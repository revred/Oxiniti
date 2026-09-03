namespace Oxyniti.Services;

/// <summary>
/// Marketing pages that exist at a locale-prefixed URL ("/ta/about" etc.), and
/// which of the six Indic locales each one is actually ready to serve there
/// (see https://github.com/revred/Oxiniti/issues/67).
/// <para>
/// A page's "/{Locale}/slug" route always exists once that page is wired up
/// (see <see cref="LocalizationService.ResolveRouteLocale"/> and each page's
/// own Locale parameter handling) -- what this registry gates is whether that
/// combination is exposed to search engines (hreflang tags, sitemap.xml) and
/// whether a visitor is actually served the page or bounced back to the
/// English original. A locale is "ready" for a page only once that page's own
/// body content -- not just shared header/nav/footer strings -- is translated
/// in wwwroot/i18n/{code}.json. Serving a Tamil URL whose body text is still
/// English is worse than not serving one at all: it is exactly the kind of
/// mismatch Search Console's International Targeting report flags as a
/// hreflang error, which is issue #67's own acceptance criterion.
/// </para>
/// <para>
/// To bring a locale online for a page once its translations land: add the
/// locale code to that page's set below, and to the two copies of this map
/// that can't reference it -- tools/StaticSiteMeta (sitemap + the prerender
/// route list) and wwwroot/js/marketingIslands.js (the header language
/// picker on the prerendered, Blazor-free pages). No route or component code
/// changes.
/// </para>
/// <para>
/// This map is also what the header language picker can offer: a prerendered
/// marketing page has no Blazor runtime to repaint itself in place, so the
/// only way it can change language is to navigate to a locale URL that
/// exists here. A slug missing from this map leaves the picker with nowhere
/// to go -- see marketingIslands.js, which disables the locales it can't
/// serve rather than accepting the choice and silently reverting it.
/// </para>
/// </summary>
public static class LocalizedRoutes
{
    /// <summary>Every locale-eligible marketing slug; "" is home.</summary>
    public static readonly IReadOnlyList<string> Slugs =
    [
        "",
        "about",
        "technology",
        "aquaculture-oxygenation",
        "ras-oxygenation",
        "products",
        "faqs",
        "contact",
    ];

    /// <summary>slug -> locale codes whose translated content is complete enough to serve.</summary>
    private static readonly Dictionary<string, HashSet<string>> ReadyLocales = new()
    {
        [""] = ["ta", "te", "kn", "ml", "hi", "bn"],
        ["about"] = ["ta", "te", "kn", "ml", "hi", "bn"],
        ["contact"] = ["ta", "te", "kn", "ml", "hi", "bn"],
        ["products"] = ["ta", "te", "kn", "ml", "hi", "bn"],

        // Not ready yet -- 0% of the page's own body copy is translated for
        // the first three, and faqs has only 2 of its 6 own strings (the Q&A
        // items are translated, the page header isn't). Route exists and
        // redirects to English until real translations land:
        //   "technology", "aquaculture-oxygenation", "ras-oxygenation", "faqs"
    };

    public static bool IsSlugLocalizable(string slug) => Slugs.Contains(slug);

    public static bool IsReady(string slug, string localeCode) =>
        ReadyLocales.TryGetValue(slug, out var locales) && locales.Contains(localeCode);
}
