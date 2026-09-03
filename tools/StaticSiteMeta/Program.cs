using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.Json;

namespace Oxyniti.StaticSiteMeta;

// See the comment at the top of StaticSiteMeta.csproj for what this generates
// and why. Run: dotnet run --project tools/StaticSiteMeta -- --wwwroot <path> --repo-root <path> --routes-out <path>
internal static class Program
{
    private const string Origin = "https://www.oxyniti.com";

    // The route table: every URL sitemap.xml (and tools/Prerender) should
    // carry, plus the .razor file whose git history sources <lastmod>, plus
    // (for the pages issue #67 brought online in extra locales) the locale
    // codes whose translation is ready. Mirrors
    // Services/LocalizedRoutes.cs's ReadyLocales map -- duplicated rather
    // than referenced because that type lives in the Blazor WASM app project
    // and this is a separate, plain console project (see the .csproj
    // comment). If a locale is added or removed there, change it here too --
    // this table is what actually decides which locale URLs get prerendered
    // and listed in sitemap.xml, and wwwroot/js/marketingIslands.js holds a
    // third copy for the header language picker.
    private static readonly PageRoute[] Routes =
    [
        new("", "Pages/Home.razor", ["ta", "te", "kn", "ml", "hi", "bn"]),
        new("about", "Pages/About.razor", ["ta", "te", "kn", "ml", "hi", "bn"]),
        new("technology", "Pages/Technology.razor", []),
        new("aquaculture-oxygenation", "Pages/AquacultureOxygenation.razor", []),
        new("ras-oxygenation", "Pages/RasOxygenation.razor", []),
        new("products", "Pages/Products.razor", ["ta", "te", "kn", "ml", "hi", "bn"]),
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
        var routesOut = GetArg(args, "--routes-out");

        if (!Directory.Exists(wwwroot))
        {
            Console.Error.WriteLine($"[static-site-meta] wwwroot not found at '{wwwroot}'.");
            return 1;
        }

        var sitemapGroups = new List<SitemapGroup>();
        var prerenderRoutes = new List<PrerenderRoute>();

        foreach (var route in Routes)
        {
            var sourcePath = Path.Combine(repoRoot, route.SourceRelPath);
            if (!File.Exists(sourcePath))
            {
                Console.Error.WriteLine($"[static-site-meta] Route '{route.Slug}': source file not found at '{sourcePath}'.");
                return 1;
            }

            var enUrl = route.Slug.Length == 0 ? $"{Origin}/" : $"{Origin}/{route.Slug}";
            var enPath = route.Slug.Length == 0 ? "/" : $"/{route.Slug}";
            var enLastMod = GitLastModifiedDate(repoRoot, route.SourceRelPath);

            var urls = new List<SitemapUrl> { new(enUrl, enLastMod) };
            prerenderRoutes.Add(new PrerenderRoute(enPath, route.Slug.Length == 0 ? "index.html" : $"{route.Slug}/index.html"));

            foreach (var locale in route.ReadyLocales)
            {
                var localeJson = Path.Combine("wwwroot", "i18n", $"{locale}.json");
                var localeLastMod = MaxDate(enLastMod, GitLastModifiedDate(repoRoot, localeJson));
                urls.Add(new($"{Origin}/{locale}/{route.Slug}", localeLastMod));

                var localePath = route.Slug.Length == 0 ? $"/{locale}" : $"/{locale}/{route.Slug}";
                var localeOutput = route.Slug.Length == 0 ? $"{locale}/index.html" : $"{locale}/{route.Slug}/index.html";
                prerenderRoutes.Add(new PrerenderRoute(localePath, localeOutput));
            }

            var group = new SitemapGroup(urls, route.ReadyLocales.Length > 0 ? [.. route.ReadyLocales] : []);
            sitemapGroups.Add(group);
        }

        var sitemapPath = Path.Combine(wwwroot, "sitemap.xml");
        File.WriteAllText(sitemapPath, RenderSitemap(sitemapGroups), new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));

        Console.WriteLine($"[static-site-meta] Wrote {sitemapGroups.Sum(g => g.Urls.Count)} sitemap.xml url(s).");

        if (!string.IsNullOrEmpty(routesOut))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(routesOut))!);
            var json = JsonSerializer.Serialize(prerenderRoutes, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(routesOut, json, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
            Console.WriteLine($"[static-site-meta] Wrote {prerenderRoutes.Count} route(s) to '{routesOut}' for tools/Prerender.");
        }

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
}

internal sealed record PageRoute(string Slug, string SourceRelPath, string[] ReadyLocales);

internal sealed record SitemapUrl(string Loc, string LastMod);

// path: the URL tools/Prerender should navigate the headless browser to.
// outputRelPath: where under wwwroot to write the captured, Blazor-stripped
// HTML -- both wwwroot-relative, forward-slash separated.
internal sealed record PrerenderRoute(string Path, string OutputRelPath);

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
