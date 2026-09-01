using System.Net.Http.Json;
using Microsoft.JSInterop;

namespace Oxyniti.Services;

/// <summary>
/// String lookup for the six Indic translations, loaded one language at a time.
/// <para>
/// English is not a pack: every call site passes its English text as the
/// <c>fallback</c> argument of <see cref="T"/>, so an English visitor -- the
/// default, and most of the traffic -- fetches nothing at all. The packs used to
/// live in one 297 KB <c>translations.json</c> that every visitor downloaded in
/// full before the header could render localized strings (issue #35).
/// </para>
/// </summary>
public class LocalizationService(IJSRuntime jsRuntime, HttpClient httpClient)
{
    private readonly IJSRuntime _jsRuntime = jsRuntime;
    private readonly HttpClient _httpClient = httpClient;

    private const string StorageKey = "oxyniti-lang";
    private const string DefaultLanguage = "en";

    public static readonly (string Code, string Native)[] Languages =
    [
        ("en", "English"),
        ("ta", "தமிழ்"),
        ("kn", "ಕನ್ನಡ"),
        ("te", "తెలుగు"),
        ("ml", "മലയാളം"),
        ("hi", "हिन्दी"),
        ("bn", "বাংলা"),
    ];

    /// <summary>Packs fetched so far, keyed by language code. Never holds "en".</summary>
    private readonly Dictionary<string, Dictionary<string, string>> _packs = [];

    private bool _initialized;

    /// <summary>
    /// Identifies the most recent language request. A pack that arrives after the
    /// visitor has already switched again must not overwrite the newer choice.
    /// </summary>
    private int _requestSeq;

    public string CurrentLanguage { get; private set; } = DefaultLanguage;

    public event Action? OnChange;

    /// <summary>
    /// Boots localization for the current page load. <paramref name="currentPath"/>
    /// is the source of truth (issue #67): a locale-prefixed URL like "/ta/about"
    /// governs itself (the page component sets the language from its own route
    /// parameter, see <see cref="ResolveRouteLocale"/>) and is left alone here.
    /// Only an UNPREFIXED url consults the saved localStorage preference, and
    /// only as a redirect hint -- never as an in-place source of truth -- for any
    /// page <see cref="LocalizedRoutes"/> already has a translated URL for.
    /// Returns the path to redirect to, or null if this load should just
    /// proceed as-is.
    /// </summary>
    public async Task<string?> InitializeAsync(string currentPath)
    {
        if (_initialized) return null;
        _initialized = true;

        if (TryGetLocaleFromPath(currentPath, out _, out _)) return null; // URL already governs this load

        // Read the saved choice BEFORE fetching anything, so the common case --
        // no saved language, or English -- costs zero network.
        string? saved = null;
        try
        {
            saved = await _jsRuntime.InvokeAsync<string>("localStorage.getItem", StorageKey);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LocalizationService] Error reading saved language: {ex}");
        }

        if (string.IsNullOrEmpty(saved) || saved == DefaultLanguage || !IsSupported(saved)) return null;

        var slug = currentPath.Trim('/');
        if (LocalizedRoutes.IsReady(slug, saved))
        {
            // A real, translated URL exists for this page -- send the visitor
            // there instead of repainting in place, so the URL (not client
            // state) carries the language.
            return BuildLocalizedPath(slug, saved);
        }

        // No translated URL for this page (yet). Fall back to the pre-#67
        // in-place repaint so a returning visitor's choice still does
        // something -- shared chrome (nav/footer/etc.) picks up the saved
        // language even though this specific page's own body stays English.
        var pack = await LoadPackAsync(saved);
        if (pack is null) return null; // The English fallback is already on screen.

        _packs[saved] = pack;
        CurrentLanguage = saved;
        OnChange?.Invoke();
        return null;
    }

    public string T(string key, string fallback)
    {
        if (CurrentLanguage != DefaultLanguage &&
            _packs.TryGetValue(CurrentLanguage, out var pack) &&
            pack.TryGetValue(key, out var value))
        {
            return value;
        }

        return fallback;
    }

    public async Task SetLanguageAsync(string code)
    {
        if (!IsSupported(code)) return;
        if (code == CurrentLanguage) return;

        var request = ++_requestSeq;

        // Fetch before flipping, not after. Switching first would repaint the whole
        // page in English fallbacks while the pack was still in flight, with the
        // language picker already showing the new language.
        if (code != DefaultLanguage && !_packs.ContainsKey(code))
        {
            var pack = await LoadPackAsync(code);

            // Cache it even if a newer request has superseded this one -- the data
            // is valid and the visitor may well switch back.
            if (pack is not null) _packs[code] = pack;

            if (request != _requestSeq) return;
            if (pack is null) return; // Load failed; stay on the current language.
        }

        CurrentLanguage = code;

        try
        {
            await _jsRuntime.InvokeVoidAsync("localStorage.setItem", StorageKey, code);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LocalizationService] Error saving language: {ex}");
        }

        OnChange?.Invoke();
    }

    /// <summary>
    /// Validated against <see cref="Languages"/>, not against the packs already
    /// fetched -- with lazy loading the cache says nothing about what the site
    /// supports.
    /// </summary>
    private static bool IsSupported(string code)
    {
        foreach (var (supported, _) in Languages)
        {
            if (supported == code) return true;
        }

        return false;
    }

    /// <summary>One of the six non-English locale codes -- i.e. a valid URL prefix.</summary>
    private static bool IsSupportedNonDefault(string code) => code != DefaultLanguage && IsSupported(code);

    /// <summary>
    /// Splits a path into an optional locale prefix and the slug after it.
    /// "/ta/about" -> ("ta", "about", true). "/about" -> ("en", "about", false).
    /// "/" or "" -> ("en", "", false). The leading segment is only treated as a
    /// locale if it is one of the six non-English codes -- an unprefixed slug
    /// that happens to collide with a code is not a case this app has (no page
    /// is named e.g. "ta").
    /// </summary>
    public static bool TryGetLocaleFromPath(string path, out string locale, out string slug)
    {
        var trimmed = path.Trim('/');
        if (trimmed.Length > 0)
        {
            var slashIndex = trimmed.IndexOf('/');
            var first = slashIndex < 0 ? trimmed : trimmed[..slashIndex];

            if (IsSupportedNonDefault(first))
            {
                locale = first;
                slug = slashIndex < 0 ? "" : trimmed[(slashIndex + 1)..];
                return true;
            }
        }

        locale = DefaultLanguage;
        slug = trimmed;
        return false;
    }

    /// <summary>The slug alone, with any locale prefix removed -- "/ta/about" -> "about".</summary>
    public static string StripLocalePrefix(string path)
    {
        TryGetLocaleFromPath(path, out _, out var slug);
        return slug;
    }

    /// <summary>
    /// "/about" for English, "/ta/about" for Tamil, "/" / "/ta" for the empty
    /// (home) slug. The one place URL shape for a locale is decided -- pages,
    /// LocaleHead and the language switcher all build paths through this.
    /// </summary>
    public static string BuildLocalizedPath(string slug, string localeCode) =>
        localeCode == DefaultLanguage
            ? "/" + slug
            : "/" + localeCode + (slug.Length == 0 ? "" : "/" + slug);

    /// <summary>What a page with a "/{Locale}/slug" route should do with the route value it got.</summary>
    public enum RouteLocaleOutcome
    {
        /// <summary>Unprefixed request ("/slug") -- render in the current/default language.</summary>
        RenderDefault,
        /// <summary>A ready, translated locale -- render in <see cref="RouteLocaleResult.Locale"/>.</summary>
        RenderLocale,
        /// <summary>A supported locale code, but this page isn't translated for it yet -- send them to English.</summary>
        Redirect,
        /// <summary>The route segment isn't one of the six locale codes at all -- there's nothing here.</summary>
        NotFound,
    }

    public readonly record struct RouteLocaleResult(RouteLocaleOutcome Outcome, string? Locale, string? RedirectPath);

    /// <summary>
    /// Central decision for every locale-prefixed page: called with the page's
    /// own <c>Locale</c> route parameter (null on the unprefixed route) and its
    /// slug in <see cref="LocalizedRoutes"/>. Keeps "is this code real" and "is
    /// this page ready in it" out of every individual page component.
    /// </summary>
    public static RouteLocaleResult ResolveRouteLocale(string? routeLocale, string slug)
    {
        if (routeLocale is null) return new(RouteLocaleOutcome.RenderDefault, DefaultLanguage, null);

        if (!IsSupportedNonDefault(routeLocale)) return new(RouteLocaleOutcome.NotFound, null, null);

        if (!LocalizedRoutes.IsReady(slug, routeLocale))
            return new(RouteLocaleOutcome.Redirect, null, BuildLocalizedPath(slug, DefaultLanguage));

        return new(RouteLocaleOutcome.RenderLocale, routeLocale, null);
    }

    private async Task<Dictionary<string, string>?> LoadPackAsync(string code)
    {
        try
        {
            return await _httpClient.GetFromJsonAsync<Dictionary<string, string>>($"i18n/{code}.json");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LocalizationService] Error loading '{code}' translations: {ex}");
            return null;
        }
    }
}
