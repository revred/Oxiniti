using System.IO.Compression;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.Playwright;

namespace Oxyniti.Prerender;

// See the comment at the top of Prerender.csproj for what this does and why.
// Run: dotnet run --project tools/Prerender -- --wwwroot <path> --routes <path>
internal static partial class Program
{
    private static async Task<int> Main(string[] args)
    {
        var wwwroot = Path.GetFullPath(GetArg(args, "--wwwroot") ?? Path.Combine("bin", "Release", "publish", "wwwroot"));
        var routesPath = GetArg(args, "--routes");

        if (!Directory.Exists(wwwroot))
        {
            Console.Error.WriteLine($"[prerender] wwwroot not found at '{wwwroot}'.");
            return 1;
        }

        if (string.IsNullOrEmpty(routesPath) || !File.Exists(routesPath))
        {
            Console.Error.WriteLine($"[prerender] --routes not found at '{routesPath ?? "(none given)"}'. Run tools/StaticSiteMeta first -- it emits this file.");
            return 1;
        }

        var routes = JsonSerializer.Deserialize<List<RouteEntry>>(
            File.ReadAllText(routesPath),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException($"Couldn't parse routes file '{routesPath}'.");

        if (routes.Count == 0)
        {
            Console.Error.WriteLine("[prerender] Route list is empty, nothing to do.");
            return 1;
        }

        // Preserve the real WASM-booting shell *before* anything below starts
        // overwriting index.html -- this becomes staticwebapp.config.json's
        // navigationFallback target, so every route this tool doesn't cover
        // (app routes: /cart, /account, /login, etc.) still boots Blazor.
        var indexPath = Path.Combine(wwwroot, "index.html");
        var appShellPath = Path.Combine(wwwroot, "app-shell.html");
        if (!File.Exists(indexPath))
        {
            Console.Error.WriteLine($"[prerender] index.html not found at '{indexPath}'.");
            return 1;
        }

        // `dotnet publish` pre-compresses index.html into index.html.br /
        // index.html.gz at build time (Blazor's static web asset
        // compression); Static Web Apps prefers serving those precompressed
        // siblings over compressing index.html itself on the fly. Every
        // real browser negotiates Brotli, so if this loop below only ever
        // overwrites the *uncompressed* index.html (and every other route's
        // own output file), visitors keep getting served the stale,
        // Blazor-booting .br file forever -- silently undoing this entire
        // fix for anyone but a client (like plain curl) that skips
        // compression negotiation. WriteHtmlFile (below) always regenerates
        // both compressed siblings alongside the plain file for exactly
        // this reason, for every file this tool writes -- app-shell.html
        // included, even though it never had stale siblings to begin with.
        WriteHtmlFile(appShellPath, await File.ReadAllBytesAsync(indexPath));

        // The local server's SPA fallback (below) must serve app-shell.html,
        // not index.html: this loop overwrites index.html (and every other
        // route's own output file) on disk as it goes, in the same wwwroot
        // the server is reading from -- app-shell.html is the one file the
        // rest of this run never touches, so it's the only safe thing to
        // fall back to for every route captured after the first.
        await using var server = await LocalWwwrootServer.StartAsync(wwwroot, appShellPath);

        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });

        var failures = new List<string>();

        foreach (var route in routes)
        {
            try
            {
                var html = await CaptureAsync(browser, server.BaseAddress, route.Path);
                var outputPath = Path.Combine(wwwroot, route.OutputRelPath.Replace('/', Path.DirectorySeparatorChar));
                Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
                WriteHtmlFile(outputPath, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false).GetBytes(html));
                Console.WriteLine($"[prerender] {route.Path} -> {route.OutputRelPath} ({html.Length:N0} chars)");
            }
            catch (Exception ex)
            {
                failures.Add($"{route.Path}: {ex.Message}");
                Console.Error.WriteLine($"[prerender] Failed to capture '{route.Path}': {ex}");
            }
        }

        if (failures.Count > 0)
        {
            Console.Error.WriteLine($"[prerender] {failures.Count} of {routes.Count} route(s) failed:");
            foreach (var f in failures) Console.Error.WriteLine($"  - {f}");
            return 1;
        }

        Console.WriteLine($"[prerender] Wrote {routes.Count} prerendered page(s).");
        return 0;
    }

    private static string? GetArg(string[] args, string name)
    {
        var idx = Array.IndexOf(args, name);
        return idx >= 0 && idx + 1 < args.Length ? args[idx + 1] : null;
    }

    // Writes `path` plus fresh `path.br` / `path.gz` siblings, matching what
    // `dotnet publish`'s own static web asset compression produces for
    // everything else in wwwroot -- see the comment where this is first
    // called for why skipping the compressed siblings is actively wrong,
    // not just a missed optimisation, for a file this tool overwrites.
    private static void WriteHtmlFile(string path, byte[] bytes)
    {
        File.WriteAllBytes(path, bytes);
        WriteCompressed(path + ".br", bytes, stream => new BrotliStream(stream, CompressionLevel.Optimal));
        WriteCompressed(path + ".gz", bytes, stream => new GZipStream(stream, CompressionLevel.Optimal));
    }

    private static void WriteCompressed(string path, byte[] bytes, Func<Stream, Stream> makeCompressor)
    {
        using var fileStream = File.Create(path);
        using var compressor = makeCompressor(fileStream);
        compressor.Write(bytes, 0, bytes.Length);
    }

    // Boots the real Blazor app for this route (WASM and all -- the only way
    // to get output that's actually faithful to what the Razor components
    // render, JSON-LD/title/meta included) and captures the settled DOM.
    private static async Task<string> CaptureAsync(IBrowser browser, string baseAddress, string routePath)
    {
        var url = baseAddress.TrimEnd('/') + routePath;

        // One throwaway browser context -- i.e. one empty localStorage -- per
        // route, because that is the only visitor these files are ever
        // rendered for: someone arriving cold at this exact URL.
        //
        // The app persists the language picker's choice in localStorage
        // ("oxyniti-lang"), and LocalizationService.InitializeAsync reads it
        // back on any *unprefixed* URL: it repaints the page in the saved
        // language, or -- when LocalizedRoutes says a translated twin is
        // ready -- redirects to it outright. Sharing one page across every
        // capture therefore let each locale route poison the ones after it:
        // /bn/about (the last locale of the first localized slug) left "bn"
        // in localStorage, so /technology, /aquaculture-oxygenation,
        // /ras-oxygenation, /products and /faqs were all captured with
        // Bengali chrome, and /contact was captured as /bn/contact outright
        // -- English URLs shipping Bengali HTML, which is what a visitor
        // clicking "Products" from the English homepage actually saw.
        await using var context = await browser.NewContextAsync();
        var page = await context.NewPageAsync();

        try
        {
            await page.GotoAsync(url, new PageGotoOptions
            {
                WaitUntil = WaitUntilState.NetworkIdle,
                Timeout = 20_000,
            });
        }
        catch (TimeoutException)
        {
            // Fine on a page that keeps some background poll alive (e.g. the
            // live BusinessInfo call against a cold-starting external API --
            // see issue #26, still open) -- fall back to "DOM loaded" plus a
            // fixed settle delay rather than failing the whole build over an
            // unrelated external dependency's own flakiness.
            await page.WaitForLoadStateAsync(LoadState.Load);
        }

        // Blazor's own render + JS interop (scroll-spy init, tank-bubble
        // start, etc.) can still be finishing a beat after the network goes
        // idle; this is a build-time step, not a user's page load, so a
        // fixed settle cost here is the right trade against flakiness.
        await page.WaitForTimeoutAsync(500);

        // Belt-and-braces on the isolation above: a capture that ends up on a
        // different path than it asked for has rendered someone else's page
        // into this route's file -- wrong body copy, wrong <html lang>, and a
        // canonical/hreflang set NormalizeHeadMeta will then happily stamp
        // with this route's URL. Fail the build instead of shipping it.
        var landed = new Uri(page.Url).AbsolutePath.TrimEnd('/');
        var expected = new Uri(url).AbsolutePath.TrimEnd('/');
        if (!string.Equals(landed, expected, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Capturing '{routePath}' ended up at '{page.Url}' -- refusing to write that page's DOM to this route's file.");
        }

        // A locale route's body copy arrives as its own fetch
        // (wwwroot/i18n/{code}.json), and the page only re-renders -- and
        // only then sets <html lang> -- once it lands. NetworkIdle normally
        // covers that, but the timeout fallback above does not, and a
        // capture that settles first writes an ENGLISH body to a Tamil URL:
        // precisely the hreflang mismatch LocalizedRoutes exists to prevent
        // (issue #67). Observed flaking one or two locale routes per run
        // against a cold BusinessInfo API, so wait for the translation to
        // actually be on the document rather than trusting the settle delay.
        var expectedLocale = LocaleOf(routePath);
        if (expectedLocale is not null)
        {
            try
            {
                await page.WaitForFunctionAsync(
                    "code => document.documentElement.lang === code",
                    expectedLocale,
                    new PageWaitForFunctionOptions { Timeout = 15_000 });
            }
            catch (TimeoutException)
            {
                var actual = await page.EvaluateAsync<string>("() => document.documentElement.lang");
                throw new InvalidOperationException(
                    $"'{routePath}' never applied its '{expectedLocale}' translations (<html lang> was '{actual}') -- refusing to write an untranslated page to a locale URL.");
            }
        }

        var html = await page.ContentAsync();
        html = StripBlazorLoader(html, routePath);
        return NormalizeHeadMeta(html, routePath);
    }

    // Mirrors LocalizationService.Languages minus "en" -- the six codes that
    // are legal URL prefixes. Duplicated here for the same reason
    // tools/StaticSiteMeta duplicates the ready-locale map: this tool runs
    // against the published output, not the app's own assemblies.
    private static readonly string[] LocalePrefixes = ["ta", "kn", "te", "ml", "hi", "bn"];

    /// <summary>The locale a "/ta/about"-shaped route must render in, or null for an unprefixed one.</summary>
    private static string? LocaleOf(string routePath)
    {
        var first = routePath.Trim('/').Split('/')[0];
        return Array.IndexOf(LocalePrefixes, first) >= 0 ? first : null;
    }

    private const string Origin = "https://www.oxyniti.com";

    // Two head-rendering gaps that only show up once a page is actually
    // captured post-boot (neither existed in the old regex-on-a-template
    // approach this replaces, tools/StaticSiteMeta's now-removed
    // RenderPage -- see that tool's own comment):
    //
    //  1. App.razor's self-referencing <link rel="canonical"> is emitted
    //     from a <HeadContent> declared directly inside the Router's
    //     <Found> template (not a page component's own markup).
    //     Empirically, that specific HeadContent never survives to the
    //     final DOM on any route whose page also runs the
    //     locale-resolution OnParametersSetAsync logic (About, Technology,
    //     Home, etc.) -- only the three plain pages without it
    //     (Privacy/Terms/Sitemap) keep their canonical tag. That looks
    //     like a genuine Blazor HeadOutlet ordering bug worth its own
    //     issue, but root-causing WASM head-rendering internals is out of
    //     scope here.
    //  2. <meta name="description"> is duplicated: the site-wide default
    //     baked into wwwroot/index.html is never removed, and each page's
    //     own <HeadContent> meta description is simply appended after it
    //     by HeadOutlet -- so two <meta name="description"> tags exist,
    //     and per HTML convention crawlers use the first (wrong) one, not
    //     the page-specific (right) one that's second. og:description,
    //     twitter:description, og:title and twitter:title never update at
    //     all: nothing in the app sets them via HeadContent, so they stay
    //     on index.html's site-wide defaults on every route.
    //
    // tools/Prerender already knows (or can read straight out of the
    // captured DOM) the correct value for every one of these, so it's
    // simpler and more robust to assert them directly here than to depend
    // on runtime behaviour that -- per the above -- doesn't reliably do it.
    private static string NormalizeHeadMeta(string html, string routePath)
    {
        var canonicalUrl = routePath == "/" ? Origin + "/" : Origin + routePath;

        // Extracted from text-node content (HTML-entity-decoded by nothing
        // yet), about to be reused inside an attribute value -- re-encode
        // for that context (a literal '"' in a title would otherwise break
        // the attribute it's spliced into).
        var titleMatch = TitleRegex().Match(html);
        var title = titleMatch.Success ? WebUtility.HtmlEncode(WebUtility.HtmlDecode(titleMatch.Groups[1].Value)) : "";

        var descriptionMatches = MetaDescriptionRegex().Matches(html);
        if (descriptionMatches.Count > 1)
        {
            // Keep only the last (most specific) one, drop the rest.
            for (var i = 0; i < descriptionMatches.Count - 1; i++)
            {
                html = html.Replace(descriptionMatches[i].Value, "");
            }
        }

        var description = descriptionMatches.Count > 0
            ? descriptionMatches[^1].Groups[1].Value
            : "";

        html = ReplaceMetaContent(html, "og:title", title);
        html = ReplaceMetaContent(html, "og:description", description);
        html = ReplaceMetaContent(html, "og:url", WebUtility.HtmlEncode(canonicalUrl));
        html = ReplaceMetaContent(html, "twitter:title", title);
        html = ReplaceMetaContent(html, "twitter:description", description);

        if (!CanonicalLinkRegex().IsMatch(html))
        {
            var tag = $"    <link rel=\"canonical\" href=\"{WebUtility.HtmlEncode(canonicalUrl)}\" />\n";
            html = HeadCloseRegex().Replace(html, tag + "</head>", 1);
        }

        return html;
    }

    // `property` covers both `property="og:..."` and `name="twitter:..."`
    // metas -- the attribute name differs but the shape (one `content="..."`
    // to swap) doesn't.
    private static string ReplaceMetaContent(string html, string property, string encodedValue)
    {
        if (string.IsNullOrEmpty(encodedValue)) return html;

        var regex = MetaPropertyRegex(Regex.Escape(property));
        return regex.Replace(html, m => m.Value.Replace(m.Groups[1].Value, encodedValue), 1);
    }

    private static Regex MetaPropertyRegex(string escapedProperty) =>
        new($"""<meta (?:property|name)="{escapedProperty}" content="([^"]*)"\s*/?>""");

    [GeneratedRegex("""<title>(.*?)</title>""")]
    private static partial Regex TitleRegex();

    [GeneratedRegex("""<meta name="description" content="([^"]*)"\s*/?>""")]
    private static partial Regex MetaDescriptionRegex();

    [GeneratedRegex("""<link[^>]*rel="canonical"[^>]*>""")]
    private static partial Regex CanonicalLinkRegex();

    [GeneratedRegex("""</head>""")]
    private static partial Regex HeadCloseRegex();

    // The one actual fix: a browser parsing this file must never request the
    // WASM runtime. Throws instead of silently no-op'ing (matching
    // tools/StaticSiteMeta's ReplaceRequired) so a future change to
    // wwwroot/index.html's boot script markup gets caught by CI immediately,
    // rather than these "static" pages quietly shipping Blazor again.
    private static string StripBlazorLoader(string html, string routePath)
    {
        if (!BlazorScriptRegex().IsMatch(html))
        {
            throw new InvalidOperationException(
                $"Expected to find and strip the blazor.webassembly.js <script> tag in the captured output for '{routePath}', but it wasn't there.");
        }

        // Swapped 1:1 for the vanilla-JS island bootstrap: everything on
        // these pages that used to be a Blazor event handler (the profit
        // calculator, the free-demo form, the language switcher, nav
        // scroll-spy, tank-bubble/testimonial/map/QR/video decoration) is
        // wired there instead. See that file's own header comment.
        html = BlazorScriptRegex().Replace(html, "    <script src=\"/js/marketingIslands.js\" defer></script>\n");

        // Paired with it in wwwroot/index.html's inline bootstrap script (see
        // that file); meaningless without a Blazor runtime to ever show it.
        html = BlazorErrorUiScriptRegex().Replace(html, "");
        html = BlazorErrorUiDivRegex().Replace(html, "");

        // Belt-and-braces: strip anything else under _framework/ that the
        // Blazor runtime itself may have injected into <head> while booting
        // (e.g. modulepreload hints for lazily-loaded assemblies). Any such
        // tag surviving into the shipped file would be *worse* than doing
        // nothing -- a preload hint for a multi-MB asset nobody on this page
        // will ever load is exactly the bandwidth cost #63 removes.
        html = FrameworkAssetTagRegex().Replace(html, "");

        return html;
    }

    [GeneratedRegex("""<script[^>]*src="[^"]*_framework/blazor\.webassembly\.js"[^>]*>\s*</script>\n?""")]
    private static partial Regex BlazorScriptRegex();

    [GeneratedRegex("""<(script|link)[^>]*(?:src|href)="[^"]*_framework/[^"]*"[^>]*>(?:\s*</script>)?\n?""")]
    private static partial Regex FrameworkAssetTagRegex();

    [GeneratedRegex("""<script>\s*\(function \(\) \{\s*// Created here.*?\}\)\(\);\s*</script>\n?""", RegexOptions.Singleline)]
    private static partial Regex BlazorErrorUiScriptRegex();

    [GeneratedRegex("""<div id="blazor-error-ui"[^>]*data-nosnippet[^>]*>.*?</div>\n?""", RegexOptions.Singleline)]
    private static partial Regex BlazorErrorUiDivRegex();
}

internal sealed class RouteEntry
{
    [JsonPropertyName("path")] public string Path { get; set; } = "";
    [JsonPropertyName("outputRelPath")] public string OutputRelPath { get; set; } = "";
}

// A minimal local static-file host for the published wwwroot, with the same
// "serve a matching file, else fall back to the WASM-booting shell" shape
// Azure Static Web Apps applies in production (navigationFallback) --
// close enough that navigating Chromium at e.g. "/about" boots the real
// Blazor Router into the real About.razor, same as a live visitor would get.
internal sealed class LocalWwwrootServer : IAsyncDisposable
{
    private readonly WebApplication _app;
    public string BaseAddress { get; }

    private LocalWwwrootServer(WebApplication app, string baseAddress)
    {
        _app = app;
        BaseAddress = baseAddress;
    }

    public static async Task<LocalWwwrootServer> StartAsync(string wwwroot, string spaFallbackPath)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Production" });
        builder.Logging.ClearProviders();
        builder.WebHost.UseUrls("http://127.0.0.1:0");

        var contentTypeProvider = new FileExtensionContentTypeProvider();
        // .NET's default map already knows .wasm/.json/.woff2; Blazor's own
        // publish output also ships a couple of extensionless/less-common
        // ones that would otherwise 404 or serve with no content-type.
        contentTypeProvider.Mappings[".dat"] = "application/octet-stream";
        contentTypeProvider.Mappings[".blat"] = "application/octet-stream";
        contentTypeProvider.Mappings[".dll"] = "application/octet-stream";

        var app = builder.Build();
        var fileProvider = new PhysicalFileProvider(wwwroot);
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = fileProvider,
            ContentTypeProvider = contentTypeProvider,
            ServeUnknownFileTypes = true,
        });
        app.MapFallback(async context =>
        {
            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.SendFileAsync(spaFallbackPath);
        });

        await app.StartAsync();

        var addressFeature = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()
            ?? throw new InvalidOperationException("Local server started without a bound address.");
        var baseAddress = addressFeature.Addresses.First();

        return new LocalWwwrootServer(app, baseAddress);
    }

    public async ValueTask DisposeAsync() => await _app.DisposeAsync();
}
