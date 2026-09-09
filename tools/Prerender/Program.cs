using System.IO.Compression;
using System.Net;
using System.Security.Cryptography;
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

        // Runs BEFORE the capture loop below, and that ordering is the whole
        // reason it can work: the loop overwrites index.html with the
        // prerendered homepage, so this is the only moment at which BOTH
        // pre-boot files exist on disk in their shipped form -- index.html
        // still the WASM shell, app-shell.html the copy every app route
        // falls back to.
        var shellError = await VerifyPreBootShellAsync(browser, server.BaseAddress);
        if (shellError is not null)
        {
            Console.Error.WriteLine($"[prerender] {shellError}");
            return 1;
        }

        using var downloader = new HttpClient();
        var failures = new List<string>();

        foreach (var route in routes)
        {
            try
            {
                var html = await CaptureAsync(browser, server.BaseAddress, route.Path);
                html = await RehostSignedImagesAsync(downloader, browser, wwwroot, route.Path, html);
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

    // Guards the pre-boot shell -- what every visitor stares at until the
    // 2.7 MB WASM payload boots.
    //
    // One file does two very different jobs: index.html paints the homepage
    // hero, and its app-shell.html copy paints /login, /cart, /account and
    // /orders through staticwebapp.config.json's navigationFallback. Hiding
    // the hero on app routes is a CSS-only move (app.css:
    // html.shell-app-route), so an edit that hides it WITHOUT supplying a
    // replacement leaves those routes painting nothing at all: an 88px header
    // band over an empty white page, indistinguishable from a dead site, for
    // the whole boot.
    //
    // That shipped once already. 8d754d2 hid the hero and added a neutral
    // placeholder; dd572ea deleted the placeholder twelve minutes later; and
    // nothing caught that the result was a blank page, because every other
    // gate in this pipeline measures bytes or the POST-boot DOM. This is the
    // check that would have caught it on the day.
    //
    // Returns null when both shells are fine, or the failure message.
    private static async Task<string?> VerifyPreBootShellAsync(IBrowser browser, string baseAddress)
    {
        // "/" is answered by index.html; "/login" has no file of its own, so
        // the local server's SPA fallback answers it with app-shell.html --
        // the same two files, reached the same two ways, that Static Web Apps
        // serves in production.
        foreach (var routePath in new[] { "/", "/login" })
        {
            await using var context = await browser.NewContextAsync();
            var page = await context.NewPageAsync();

            // The whole point: hold Blazor back, so what this measures is the
            // FIRST frame rather than the booted app that replaces it.
            await page.RouteAsync("**/_framework/**", route => route.AbortAsync());

            var url = baseAddress.TrimEnd('/') + routePath;

            // Load, not DOMContentLoaded: app.css carries both the shell's own
            // styling and the html.shell-app-route rules that hide the hero,
            // and the innerText probe below is only meaningful once they apply.
            await page.GotoAsync(url, new PageGotoOptions
            {
                WaitUntil = WaitUntilState.Load,
                Timeout = 20_000,
            });

            var text = await page.EvalOnSelectorAsync<string?>(
                "#app",
                "el => el.innerText.trim()");

            // innerText (not textContent) is the correct probe precisely
            // because it honours the display:none that the app-route CSS
            // applies -- textContent would happily "pass" on a shell whose
            // every element is hidden, which is the exact bug this guards.
            if (string.IsNullOrWhiteSpace(text))
            {
                return $"Pre-boot shell for '{routePath}' paints nothing: with _framework/* blocked, #app has no "
                     + "visible text, so a visitor sees an empty page for the entire WASM boot. Give app routes a "
                     + "visible placeholder (wwwroot/index.html .shell-route-loading, shown by app.css under "
                     + "html.shell-app-route) before shipping this.";
            }

            Console.WriteLine($"[prerender] pre-boot shell OK for '{routePath}' ({text!.Length} visible chars)");
        }

        return null;
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

        // A page that is still showing a loading state has not finished
        // rendering, whatever the network-idle heuristic above concluded.
        // Shipping it is worse than failing: StripBlazorLoader removes the
        // only thing that could ever complete the render, so the skeleton
        // becomes permanent for every visitor (this is how /products once
        // shipped as six grey placeholder cards -- its product grid is a
        // live API call that outran the 20 s network-idle budget on a cold
        // backend). So WAIT for the loading state to clear -- a build step
        // can afford a cold backend's warm-up, and the alternative (not
        // prerendering the route at all) made "Products" the one nav link
        // that booted the whole 2.7 MB WASM runtime from the static
        // homepage. Only if it never clears is the capture refused.
        //
        // [data-prerender-incomplete] is the app's own opt-in marker for a
        // rendered state that must not be frozen into a static file (e.g.
        // DiscoverProductTypes' "no product types" fallback, which at build
        // time means the catalogue call failed, not that the catalogue is
        // empty).
        const string loadingSelector =
            ".placeholder-wave, .placeholder, [aria-busy=\"true\"], [role=\"status\"], [data-prerender-incomplete]";
        try
        {
            await page.WaitForFunctionAsync(
                "sel => document.querySelector(sel) === null",
                loadingSelector,
                new PageWaitForFunctionOptions { Timeout = LoadingStateTimeoutMs });
        }
        catch (TimeoutException)
        {
            var stillLoading = await page.EvaluateAsync<string?>(
                """
                sel => {
                    const hit = document.querySelector(sel);
                    if (!hit) return null;
                    return hit.className || hit.getAttribute('role') || hit.tagName;
                }
                """,
                loadingSelector);
            throw new InvalidOperationException(
                $"'{routePath}' was still showing a loading state ('{stillLoading}') after {LoadingStateTimeoutMs / 1000} s -- refusing to freeze a skeleton into a static page. " +
                "Either this route needs a longer/more specific ready wait, or it depends on runtime data and must be marked Prerender: false in tools/StaticSiteMeta.");
        }

        var html = await page.ContentAsync();
        html = StripBlazorLoader(html, routePath);
        return NormalizeHeadMeta(html, routePath);
    }

    // The CMS serves product images as Supabase Storage *signed* URLs
    // (".../object/sign/...?token=<JWT>") that expire five minutes after
    // issuance -- see issue #80 (the site logo) and tools/StaticProductPages
    // (the /product/{slug} gallery), which hit the identical problem. The
    // live Blazor app gets away with it because it re-fetches a fresh token
    // on every page load; a static page captured once at build time and
    // served for days cannot, so /products' product-type cards would show a
    // broken image within minutes of the deploy. Download each such image
    // now, while its token is still good, and point the <img> at a
    // same-origin copy under wwwroot/images/prerendered. The file name is a
    // hash of the storage object path (not the token), so the same image
    // referenced from /products and its six locale twins is written once.
    // A failed download fails the build: a permanently broken image on the
    // live page is exactly the kind of defect this tool exists to keep out.
    //
    // The CMS originals are also far too big for a card (the first one seen
    // was a 2.6 MB 1536x1024 PNG for a 340 px-tall tile -- more bytes than
    // the whole WASM runtime this tool exists to avoid). Each is re-encoded
    // through the already-running Chromium (canvas -> WebP, capped at
    // RehostedImageMaxWidth, so no image library dependency) before it is
    // written, which keeps it inside the same 500 KB per-file budget the
    // workflow enforces on wwwroot/images.
    private static async Task<string> RehostSignedImagesAsync(HttpClient http, IBrowser browser, string wwwroot, string routePath, string html)
    {
        var rewritten = html;
        foreach (Match match in ImgSrcRegex().Matches(html))
        {
            var encodedUrl = match.Groups[1].Value;
            var url = WebUtility.HtmlDecode(encodedUrl);
            if (!url.Contains("/object/sign/", StringComparison.OrdinalIgnoreCase)) continue;

            var objectPath = url.Split('?')[0];
            var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(objectPath)))[..16].ToLowerInvariant();
            var fileName = hash + ".webp";
            var dir = Path.Combine(wwwroot, "images", "prerendered");
            var filePath = Path.Combine(dir, fileName);

            if (!File.Exists(filePath))
            {
                byte[] original;
                try
                {
                    original = await http.GetByteArrayAsync(url);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException(
                        $"'{routePath}' references a time-limited image that could not be downloaded for re-hosting ({objectPath}): {ex.Message}", ex);
                }

                var webp = await ReencodeAsWebpAsync(browser, original, GuessImageExtension(objectPath), routePath, objectPath);
                Directory.CreateDirectory(dir);
                await File.WriteAllBytesAsync(filePath, webp);
                Console.WriteLine($"[prerender] {routePath}: {objectPath.Split('/')[^1]} {original.Length:N0} -> {webp.Length:N0} bytes as WebP");
            }

            var localUrl = "/images/prerendered/" + fileName;
            rewritten = rewritten.Replace(match.Value, match.Value.Replace(encodedUrl, localUrl));
            Console.WriteLine($"[prerender] {routePath}: re-hosted signed image -> {localUrl}");
        }

        return rewritten;
    }

    // Wide enough for a col-lg-4 card at 2x device pixel ratio; the CMS
    // originals are decorative photos, not spec diagrams, so this loses
    // nothing a visitor can see.
    private const int RehostedImageMaxWidth = 800;
    private const double RehostedImageQuality = 0.82;

    private static async Task<byte[]> ReencodeAsWebpAsync(IBrowser browser, byte[] original, string extension, string routePath, string objectPath)
    {
        var mime = extension switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".avif" => "image/avif",
            _ => "image/jpeg",
        };
        var dataUrl = $"data:{mime};base64,{Convert.ToBase64String(original)}";

        await using var context = await browser.NewContextAsync();
        var page = await context.NewPageAsync();
        string result;
        try
        {
            result = await page.EvaluateAsync<string>(
                """
                async ([src, maxWidth, quality]) => {
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = () => reject(new Error('image failed to decode'));
                        img.src = src;
                    });
                    const scale = Math.min(1, maxWidth / img.naturalWidth);
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(img.naturalWidth * scale);
                    canvas.height = Math.round(img.naturalHeight * scale);
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    return canvas.toDataURL('image/webp', quality);
                }
                """,
                new object[] { dataUrl, RehostedImageMaxWidth, RehostedImageQuality });
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"'{routePath}' image {objectPath} could not be re-encoded as WebP: {ex.Message}", ex);
        }

        const string prefix = "data:image/webp;base64,";
        if (!result.StartsWith(prefix, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"'{routePath}' image {objectPath}: Chromium returned '{result[..Math.Min(result.Length, 30)]}' instead of a WebP data URL.");
        }

        return Convert.FromBase64String(result[prefix.Length..]);
    }

    private static string GuessImageExtension(string objectPath)
    {
        var dot = objectPath.LastIndexOf('.');
        var ext = dot >= 0 ? objectPath[dot..] : "";
        return ext.Length is > 1 and <= 5 && ext.All(c => char.IsAsciiLetterOrDigit(c) || c == '.') ? ext.ToLowerInvariant() : ".jpg";
    }

    [GeneratedRegex("""<img\b[^>]*\ssrc="([^"]+)"[^>]*>""", RegexOptions.IgnoreCase)]
    private static partial Regex ImgSrcRegex();

    // Mirrors LocalizationService.Languages minus "en" -- the six codes that
    // are legal URL prefixes. Duplicated here for the same reason
    // tools/StaticSiteMeta duplicates the ready-locale map: this tool runs
    // against the published output, not the app's own assemblies.
    private static readonly string[] LocalePrefixes = ["ta", "kn", "te", "ml", "hi", "bn"];

    // How long a route may keep showing a loading state before its capture
    // is refused. Sized for a cold-starting external API (the product grid's
    // maker-rest-api call has been observed to outrun the 20 s network-idle
    // budget), not for a page's normal render -- every other route clears
    // this instantly.
    private const int LoadingStateTimeoutMs = 120_000;

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
