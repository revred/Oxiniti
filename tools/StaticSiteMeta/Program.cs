using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;

namespace Oxyniti.StaticSiteMeta;

// See the comment at the top of StaticSiteMeta.csproj for what this generates
// and why. Run: dotnet run --project tools/StaticSiteMeta -- --wwwroot <path> --repo-root <path>
internal static partial class Program
{
    private const string Origin = "https://www.oxyniti.com";

    // The route table: every URL sitemap.xml should carry, plus the .razor
    // file whose <PageTitle>/description own that route's real copy, plus
    // (for the two pages issue #67 brought online in extra locales) the
    // locale codes whose translation is ready. Mirrors
    // Services/LocalizedRoutes.cs's ReadyLocales map -- duplicated rather than
    // referenced because that type lives in the Blazor WASM app project and
    // this is a separate, plain console project (see the .csproj comment).
    // If a locale is added there for "about" or "contact", add it here too.
    private static readonly PageRoute[] Routes =
    [
        new("", "Pages/Home.razor", []),
        new("about", "Pages/About.razor", ["ta", "te", "kn", "ml", "hi", "bn"]),
        new("technology", "Pages/Technology.razor", []),
        new("aquaculture-oxygenation", "Pages/AquacultureOxygenation.razor", []),
        new("ras-oxygenation", "Pages/RasOxygenation.razor", []),
        new("products", "Pages/Products.razor", []),
        new("faqs", "Pages/Faqs.razor", []),
        new("contact", "Pages/Contact.razor", ["ta", "te", "kn", "ml", "hi", "bn"]),
        new("privacy", "Pages/Privacy.razor", []),
        new("terms", "Pages/Terms.razor", []),
        new("sitemap", "Pages/Sitemap.razor", []),
    ];

    private static int Main(string[] args)
    {
        var wwwroot = Path.GetFullPath(GetArg(args, "--wwwroot") ?? Path.Combine("bin", "Release", "publish", "wwwroot"));
        var repoRoot = Path.GetFullPath(GetArg(args, "--repo-root") ?? Directory.GetCurrentDirectory());

        if (!Directory.Exists(wwwroot))
        {
            Console.Error.WriteLine($"[static-site-meta] wwwroot not found at '{wwwroot}'.");
            return 1;
        }

        var templatePath = Path.Combine(wwwroot, "index.html");
        if (!File.Exists(templatePath))
        {
            Console.Error.WriteLine($"[static-site-meta] index.html not found at '{templatePath}'.");
            return 1;
        }

        var template = File.ReadAllText(templatePath);
        var fallbackDescription = ExtractLiteralMetaDescription(template)
            ?? throw new InvalidOperationException("Could not find the default <meta name=\"description\"> in index.html to use as a fallback.");

        var sitemapGroups = new List<SitemapGroup>();

        foreach (var route in Routes)
        {
            var sourcePath = Path.Combine(repoRoot, route.SourceRelPath);
            if (!File.Exists(sourcePath))
            {
                Console.Error.WriteLine($"[static-site-meta] Route '{route.Slug}': source file not found at '{sourcePath}'.");
                return 1;
            }

            var source = File.ReadAllText(sourcePath);
            var title = ExtractTitle(source)
                ?? throw new InvalidOperationException($"Route '{route.Slug}': couldn't extract <PageTitle> from {route.SourceRelPath}.");
            var description = ExtractMetaDescription(source) ?? fallbackDescription;

            var enUrl = route.Slug.Length == 0 ? $"{Origin}/" : $"{Origin}/{route.Slug}";
            var enLastMod = GitLastModifiedDate(repoRoot, route.SourceRelPath);

            var urls = new List<SitemapUrl> { new(enUrl, enLastMod) };
            foreach (var locale in route.ReadyLocales)
            {
                var localeJson = Path.Combine("wwwroot", "i18n", $"{locale}.json");
                var localeLastMod = MaxDate(enLastMod, GitLastModifiedDate(repoRoot, localeJson));
                urls.Add(new($"{Origin}/{locale}/{route.Slug}", localeLastMod));
            }

            var group = new SitemapGroup(urls, route.ReadyLocales.Length > 0 ? [.. route.ReadyLocales] : []);
            sitemapGroups.Add(group);

            // Same reciprocal hreflang set LocaleHead.razor renders at runtime
            // for this slug (see that component) -- added here too so it's
            // present before the WASM runtime boots, not just after.
            var page = RenderPage(template, title, description, enUrl, group.HreflangLinks);
            var outputPath = route.Slug.Length == 0
                ? Path.Combine(wwwroot, "index.html")
                : Path.Combine(wwwroot, route.Slug, "index.html");
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
            File.WriteAllText(outputPath, page, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
        }

        var sitemapPath = Path.Combine(wwwroot, "sitemap.xml");
        File.WriteAllText(sitemapPath, RenderSitemap(sitemapGroups), new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));

        Console.WriteLine($"[static-site-meta] Wrote {Routes.Length} per-page head override(s) and {sitemapGroups.Sum(g => g.Urls.Count)} sitemap.xml url(s).");
        return 0;
    }

    private static string? GetArg(string[] args, string name)
    {
        var idx = Array.IndexOf(args, name);
        return idx >= 0 && idx + 1 < args.Length ? args[idx + 1] : null;
    }

    private static string MaxDate(string a, string b) => string.CompareOrdinal(a, b) >= 0 ? a : b;

    // The last commit that touched this exact file -- the same "sourced from
    // each page's last content commit" rule the partial #69 fix already
    // applied by hand. Requires full history (the workflow's checkout step
    // uses fetch-depth: 0); on a shallow clone every file would report the
    // single available commit's date, which is why that's set explicitly.
    private static string GitLastModifiedDate(string repoRoot, string relativePath)
    {
        var psi = new ProcessStartInfo("git")
        {
            WorkingDirectory = repoRoot,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
        };
        psi.ArgumentList.Add("log");
        psi.ArgumentList.Add("-1");
        psi.ArgumentList.Add("--format=%cI");
        psi.ArgumentList.Add("--");
        psi.ArgumentList.Add(relativePath);

        using var process = Process.Start(psi) ?? throw new InvalidOperationException("Could not start git.");
        var output = process.StandardOutput.ReadToEnd().Trim();
        process.WaitForExit();

        if (process.ExitCode != 0 || string.IsNullOrEmpty(output) || !DateTimeOffset.TryParse(output, out var date))
        {
            throw new InvalidOperationException($"git log found no commit for '{relativePath}' under '{repoRoot}' -- is this a full checkout (fetch-depth: 0) and is the path correct?");
        }

        return date.UtcDateTime.ToString("yyyy-MM-dd");
    }

    // <PageTitle>literal text</PageTitle> or <PageTitle>@Loc.T("key", "fallback")</PageTitle>.
    // The Loc.T fallback IS the real English copy (LocalizationService.T renders it
    // whenever the key is missing/English), so it's exactly the right string to lift.
    private static string? ExtractTitle(string source)
    {
        var locMatch = TitleLocRegex().Match(source);
        if (locMatch.Success)
        {
            return WebUtility.HtmlDecode(locMatch.Groups[1].Value);
        }

        var literalMatch = TitleLiteralRegex().Match(source);
        return literalMatch.Success ? WebUtility.HtmlDecode(literalMatch.Groups[1].Value.Trim()) : null;
    }

    private static string? ExtractMetaDescription(string source)
    {
        var locMatch = DescriptionLocRegex().Match(source);
        if (locMatch.Success)
        {
            return WebUtility.HtmlDecode(locMatch.Groups[1].Value);
        }

        return ExtractLiteralMetaDescription(source);
    }

    private static string? ExtractLiteralMetaDescription(string source)
    {
        var match = DescriptionLiteralRegex().Match(source);
        return match.Success ? WebUtility.HtmlDecode(match.Groups[1].Value) : null;
    }

    // Swaps the page-identity fields in a clone of index.html: <title>, the
    // description meta, og:*/twitter:* title+description, og:url, and a
    // <link rel="canonical"> (App.razor otherwise only sets one after the
    // WASM runtime boots -- invisible to a share-preview scraper, which
    // never runs JS). og:image is left as the site-wide hero: none of these
    // pages ship a distinct hero photo to source a "1200x630 with the
    // product visible" crop from (see the PR description) -- a real
    // per-page image is content/design work, left as a follow-up.
    private static string RenderPage(string template, string title, string description, string canonicalUrl, List<(string Hreflang, string Href)> hreflangLinks)
    {
        var html = template;

        html = ReplaceRequired(html, "<title>Oxyniti</title>", $"<title>{Enc(title)}</title>");
        html = ReplaceRequired(
            html,
            "<meta name=\"description\" content=\"Oxyniti nano-bubble generators supercharge dissolved oxygen in fish ponds — healthier fish, faster growth, higher yield.\" />",
            $"<meta name=\"description\" content=\"{Enc(description)}\" />");
        html = ReplaceRequired(
            html,
            "<meta property=\"og:title\" content=\"Oxyniti — Infinite Oxygen. Infinite Yield.\" />",
            $"<meta property=\"og:title\" content=\"{Enc(title)}\" />");
        html = ReplaceRequired(
            html,
            "<meta property=\"og:description\" content=\"Nano-bubble generators that supercharge dissolved oxygen in fish ponds — healthier fish, faster growth, higher yield.\" />",
            $"<meta property=\"og:description\" content=\"{Enc(description)}\" />");
        html = ReplaceRequired(
            html,
            "<meta property=\"og:url\" content=\"https://www.oxyniti.com/\" />",
            $"<meta property=\"og:url\" content=\"{Enc(canonicalUrl)}\" />");
        html = ReplaceRequired(
            html,
            "<meta name=\"twitter:title\" content=\"Oxyniti — Infinite Oxygen. Infinite Yield.\" />",
            $"<meta name=\"twitter:title\" content=\"{Enc(title)}\" />");
        html = ReplaceRequired(
            html,
            "<meta name=\"twitter:description\" content=\"Nano-bubble generators that supercharge dissolved oxygen in fish ponds — healthier fish, faster growth, higher yield.\" />",
            $"<meta name=\"twitter:description\" content=\"{Enc(description)}\" />");
        var headExtras = new StringBuilder();
        headExtras.Append($"\n\n    <link rel=\"canonical\" href=\"{Enc(canonicalUrl)}\" />");
        foreach (var (hreflang, href) in hreflangLinks)
        {
            headExtras.Append($"\n    <link rel=\"alternate\" hreflang=\"{Enc(hreflang)}\" href=\"{Enc(href)}\" />");
        }

        html = ReplaceRequired(html, "<base href=\"/\" />", $"<base href=\"/\" />{headExtras}");

        return html;
    }

    // Throws instead of silently no-op'ing so a future edit to index.html's
    // wording gets caught by CI immediately, rather than these routes quietly
    // reverting to the site-wide meta with no visible symptom.
    private static string ReplaceRequired(string html, string oldValue, string newValue)
    {
        if (!html.Contains(oldValue, StringComparison.Ordinal))
        {
            throw new InvalidOperationException($"Expected to find and replace this in index.html, but it wasn't there any more:\n{oldValue}");
        }

        return html.Replace(oldValue, newValue);
    }

    private static string Enc(string value) => WebUtility.HtmlEncode(value);

    // No <priority> (Google ignores it -- already dropped in the partial #69
    // fix); a <lastmod> per url; the same hreflang alternate-link block on
    // every url in a locale group, matching the shape #67 established.
    private static string RenderSitemap(List<SitemapGroup> groups)
    {
        var sb = new StringBuilder();
        sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.Append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:xhtml=\"http://www.w3.org/1999/xhtml\">\n");

        foreach (var group in groups)
        {
            foreach (var url in group.Urls)
            {
                sb.Append("  <url>\n");
                sb.Append($"    <loc>{Enc(url.Loc)}</loc>\n");
                sb.Append($"    <lastmod>{url.LastMod}</lastmod>\n");
                foreach (var (hreflang, href) in group.HreflangLinks)
                {
                    sb.Append($"    <xhtml:link rel=\"alternate\" hreflang=\"{hreflang}\" href=\"{Enc(href)}\" />\n");
                }
                sb.Append("  </url>\n");
            }
        }

        sb.Append("</urlset>\n");
        return sb.ToString();
    }

    [GeneratedRegex("""<PageTitle>\s*@Loc\.T\("[^"]+",\s*"((?:[^"\\]|\\.)*)"\)\s*</PageTitle>""")]
    private static partial Regex TitleLocRegex();

    [GeneratedRegex("""<PageTitle>\s*([^@<][^<]*)</PageTitle>""")]
    private static partial Regex TitleLiteralRegex();

    [GeneratedRegex("""<meta name="description" content="@Loc\.T\("[^"]+",\s*"((?:[^"\\]|\\.)*)"\)"\s*/>""")]
    private static partial Regex DescriptionLocRegex();

    [GeneratedRegex("""<meta name="description" content="([^@][^"]*)"\s*/>""")]
    private static partial Regex DescriptionLiteralRegex();
}

internal sealed record PageRoute(string Slug, string SourceRelPath, string[] ReadyLocales);

internal sealed record SitemapUrl(string Loc, string LastMod);

// HreflangLinks: (hreflang, href) pairs shared identically across every url in
// the group, self-reference and x-default included -- same shape sitemap.xml
// already carried by hand for "about"/"contact" (issue #67).
internal sealed record SitemapGroup(List<SitemapUrl> Urls, string[] ReadyLocales)
{
    public List<(string Hreflang, string Href)> HreflangLinks { get; } = BuildHreflangLinks(Urls, ReadyLocales);

    private static List<(string, string)> BuildHreflangLinks(List<SitemapUrl> urls, string[] readyLocales)
    {
        if (readyLocales.Length == 0)
        {
            return [];
        }

        // urls[0] is always the English url (see Program.Main); the rest are
        // in the same order as readyLocales.
        var links = new List<(string, string)> { ("en", urls[0].Loc) };
        for (var i = 0; i < readyLocales.Length; i++)
        {
            links.Add((readyLocales[i], urls[i + 1].Loc));
        }
        links.Add(("x-default", urls[0].Loc));
        return links;
    }
}
