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

    public async Task InitializeAsync()
    {
        if (_initialized) return;
        _initialized = true;

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

        if (string.IsNullOrEmpty(saved) || saved == DefaultLanguage || !IsSupported(saved)) return;

        var pack = await LoadPackAsync(saved);
        if (pack is null) return; // The English fallback is already on screen.

        _packs[saved] = pack;
        CurrentLanguage = saved;
        OnChange?.Invoke();
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
