using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Maker.RampEdge;
using Maker.RampEdge.Configuration;
using Maker.RampEdge.Extensions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.JSInterop;

namespace Oxyniti.StaticProductPages;

// See the comment at the top of StaticProductPages.csproj for what this
// generates and why. Run: dotnet run --project tools/StaticProductPages -- --wwwroot <path>
internal static class Program
{
    private const string SiteOrigin = "https://www.oxyniti.com";

    private static async Task<int> Main(string[] args)
    {
        var wwwroot = Path.GetFullPath(GetArg(args, "--wwwroot") ?? Path.Combine("bin", "Release", "publish", "wwwroot"));

        if (!Directory.Exists(wwwroot))
        {
            Console.Error.WriteLine($"[static-product-pages] wwwroot not found at '{wwwroot}'.");
            return 1;
        }

        var appsettingsPath = Path.Combine(wwwroot, "appsettings.json");
        if (!File.Exists(appsettingsPath))
        {
            Console.Error.WriteLine($"[static-product-pages] appsettings.json not found at '{appsettingsPath}', can't resolve the RampEdge API address.");
            return 1;
        }

        var configuration = new ConfigurationBuilder()
            .AddJsonFile(appsettingsPath, optional: false)
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddOptions<RampEdgeSettings>().BindConfiguration(RampEdgeSettings.SectionName);
        // AddMakerClient wires Maker.RampEdge.Services.TokenStorage (browser
        // localStorage token persistence) into every client it builds, even
        // for the unauthenticated catalogue endpoints this tool calls. There's
        // no browser here, so this stub satisfies the constructor; it's never
        // expected to actually be invoked by ProductsBySlugAsync/ProductDetailsAsync.
        services.AddSingleton<IJSRuntime, UnavailableJSRuntime>();
        services.AddMakerClient(configuration);
        var provider = services.BuildServiceProvider();
        var client = provider.GetRequiredService<IMakerClient>();

        List<ProductData> catalogue;
        try
        {
            catalogue = await FetchCatalogueAsync(client);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[static-product-pages] Failed to fetch the product catalogue: {ex.Message}");
            return 1;
        }

        if (catalogue.Count == 0)
        {
            Console.Error.WriteLine("[static-product-pages] Catalogue came back empty, refusing to wipe product pages/sitemap entries on a possibly-transient API failure.");
            return 1;
        }

        using var downloader = new HttpClient();
        var generated = new List<(string Slug, string LastMod)>();
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

        foreach (var summary in catalogue)
        {
            var slug = summary.Slug;
            if (!IsSafePathSegment(slug))
            {
                Console.Error.WriteLine($"[static-product-pages] Skipping product with an unsafe slug '{slug}'.");
                continue;
            }

            ProductDetailsReply detail;
            try
            {
                detail = await client.ProductDetailsAsync(new ProductRequest
                {
                    Slug = slug,
                    Search = "",
                    SortBy = "",
                    Page = 1,
                    PageSize = 1,
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[static-product-pages] Skipping '{slug}': {ex.Message}");
                continue;
            }

            var images = await RehostProductImagesAsync(downloader, wwwroot, slug, detail.Assets);

            var pageDir = Path.Combine(wwwroot, "product", slug);
            Directory.CreateDirectory(pageDir);
            File.WriteAllText(
                Path.Combine(pageDir, "index.html"),
                ProductPageTemplate.Render(detail, images),
                new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));

            generated.Add((slug, today));
        }

        if (generated.Count == 0)
        {
            Console.Error.WriteLine("[static-product-pages] Every product detail lookup failed, no pages written.");
            return 1;
        }

        var sitemapPath = Path.Combine(wwwroot, "sitemap.xml");
        if (File.Exists(sitemapPath))
        {
            MergeSitemap(sitemapPath, generated);
        }
        else
        {
            Console.Error.WriteLine($"[static-product-pages] sitemap.xml not found at '{sitemapPath}', skipping sitemap update.");
        }

        Console.WriteLine($"[static-product-pages] Wrote {generated.Count} product page(s) under {Path.Combine(wwwroot, "product")}.");
        return 0;
    }

    private static string? GetArg(string[] args, string name)
    {
        var idx = Array.IndexOf(args, name);
        return idx >= 0 && idx + 1 < args.Length ? args[idx + 1] : null;
    }

    // Slugs come straight from the CMS and end up as a filesystem path segment
    // (wwwroot/product/{slug}/index.html) and a URL segment; reject anything
    // that could escape that directory or isn't a single plain segment.
    private static bool IsSafePathSegment(string? slug) =>
        !string.IsNullOrWhiteSpace(slug)
        && slug.IndexOfAny(['/', '\\']) < 0
        && slug != "."
        && slug != "..";

    // There's no "list every product" endpoint: ProductsBySlugAsync's Slug is
    // a *type/category* filter (see ProductsByFilter.razor's route
    // "/products/{FilterType}/{Slug}" and DiscoverProductTypes.razor's
    // GoToProducts, which navigates to "/products/type/{typeSlug}"). So the
    // catalogue is every product reachable by paging ProductsBySlugAsync once
    // per type slug returned by ProductGroupsAsync.
    private static async Task<List<ProductData>> FetchCatalogueAsync(IMakerClient client)
    {
        var groups = await client.ProductGroupsAsync();
        var typeSlugs = groups.Products.Select(p => p.Slug).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToList();

        var products = new List<ProductData>();
        foreach (var typeSlug in typeSlugs)
        {
            var page = 1;
            var totalPages = 1;

            do
            {
                var response = await client.ProductsBySlugAsync(new ProductRequest
                {
                    Slug = typeSlug,
                    Search = "",
                    SortBy = "",
                    Page = page,
                    PageSize = 50,
                });

                products.AddRange(response.Products);
                totalPages = Math.Max(response.TotalPages, 1);
                page++;
            } while (page <= totalPages);
        }

        return products
            .Where(p => !string.IsNullOrWhiteSpace(p.Slug))
            .GroupBy(p => p.Slug)
            .Select(g => g.First())
            .ToList();
    }

    // The CMS serves product images as Supabase Storage *signed* URLs
    // (".../object/sign/...?token=<JWT>") that expire minutes after issuance
    // (see issue #80, which hit the identical problem for the site logo). The
    // live Blazor app gets away with that because it re-fetches a fresh token
    // on every page load; a static page generated once at build time and
    // deployed for hours/days cannot. Download the bytes now, while the token
    // is still good, and re-host them as an ordinary same-origin file under
    // wwwroot/images, matching the "serve it from the site's own origin" fix
    // #80 applied to the logo.
    private static async Task<List<string>> RehostProductImagesAsync(HttpClient http, string wwwroot, string slug, ICollection<DigitalAsset>? assets)
    {
        var urls = (assets ?? Array.Empty<DigitalAsset>())
            .Where(a => !a.Is3DFile && !string.IsNullOrWhiteSpace(a.Url))
            .Select(a => a.Url)
            .ToList();

        var rehosted = new List<string>(urls.Count);
        var index = 0;
        foreach (var url in urls)
        {
            index++;
            if (!IsTimeLimitedUrl(url))
            {
                rehosted.Add(url);
                continue;
            }

            try
            {
                var bytes = await http.GetByteArrayAsync(url);
                var dir = Path.Combine(wwwroot, "images", "products", slug);
                Directory.CreateDirectory(dir);
                var fileName = $"{index}{GuessImageExtension(url)}";
                await File.WriteAllBytesAsync(Path.Combine(dir, fileName), bytes);
                rehosted.Add($"/images/products/{slug}/{fileName}");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[static-product-pages] Failed to re-host image {index} for '{slug}', linking the CMS URL directly (it will expire): {ex.Message}");
                rehosted.Add(url);
            }
        }

        return rehosted;
    }

    private static bool IsTimeLimitedUrl(string url) =>
        url.Contains("/object/sign/", StringComparison.OrdinalIgnoreCase);

    private static string GuessImageExtension(string url)
    {
        var path = url.Split('?')[0];
        var dot = path.LastIndexOf('.');
        var ext = dot >= 0 ? path[dot..] : "";
        return ext.Length is > 1 and <= 5 ? ext : ".jpg";
    }

    // Idempotent: re-running against an already-merged sitemap.xml (e.g. a
    // re-run of this step) won't duplicate <url> entries for the same <loc>.
    private static void MergeSitemap(string sitemapPath, List<(string Slug, string LastMod)> products)
    {
        var xml = File.ReadAllText(sitemapPath);
        const string closeTag = "</urlset>";
        var closeIdx = xml.LastIndexOf(closeTag, StringComparison.Ordinal);
        if (closeIdx < 0)
        {
            Console.Error.WriteLine("[static-product-pages] sitemap.xml has no </urlset>, skipping sitemap update.");
            return;
        }

        var sb = new StringBuilder();
        foreach (var (slug, lastMod) in products)
        {
            var loc = $"{SiteOrigin}/product/{slug}";
            if (xml.Contains($"<loc>{loc}</loc>", StringComparison.Ordinal))
            {
                continue;
            }

            sb.Append("  <url>\n");
            sb.Append($"    <loc>{WebUtility.HtmlEncode(loc)}</loc>\n");
            sb.Append($"    <lastmod>{lastMod}</lastmod>\n");
            sb.Append("  </url>\n");
        }

        if (sb.Length == 0)
        {
            return;
        }

        var merged = xml[..closeIdx] + sb + xml[closeIdx..];
        File.WriteAllText(sitemapPath, merged, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
    }
}

// See the comment where this is registered in Program.Main.
internal sealed class UnavailableJSRuntime : IJSRuntime
{
    public ValueTask<TValue> InvokeAsync<TValue>(string identifier, object?[]? args) =>
        throw new NotSupportedException("No browser JS runtime is available in the static-product-pages generator.");

    public ValueTask<TValue> InvokeAsync<TValue>(string identifier, CancellationToken cancellationToken, object?[]? args) =>
        throw new NotSupportedException("No browser JS runtime is available in the static-product-pages generator.");
}

internal static class ProductPageTemplate
{
    private static readonly JsonSerializerOptions JsonLdOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    // images: already-rehosted (or otherwise safe) URLs, main image first, in
    // the same order as detail.Assets' non-3D entries.
    public static string Render(ProductDetailsReply detail, IReadOnlyList<string> images)
    {
        var canonicalUrl = $"{Origin}/product/{detail.Slug}";
        var description = detail.Description ?? "";
        var metaDescription = description.Length > 155 ? description[..155].TrimEnd() + "…" : description;
        var mainImage = images.Count > 0 ? images[0] : null;
        var productJsonLd = BuildProductJsonLd(detail, canonicalUrl, mainImage);
        var breadcrumbJsonLd = BuildBreadcrumbJsonLd(detail, canonicalUrl);

        var html = new StringBuilder();
        html.Append("<!DOCTYPE html>\n<html lang=\"en\">\n\n<head>\n");
        html.Append("    <meta charset=\"utf-8\" />\n");
        html.Append("    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n");
        html.Append($"    <title>{Enc(detail.Name)} | Oxyniti</title>\n");
        html.Append($"    <meta name=\"description\" content=\"{Enc(metaDescription)}\" />\n");
        html.Append("    <meta name=\"theme-color\" content=\"#0B1F33\" />\n");
        html.Append("    <meta property=\"og:type\" content=\"product\" />\n");
        html.Append("    <meta property=\"og:site_name\" content=\"Oxyniti\" />\n");
        html.Append($"    <meta property=\"og:title\" content=\"{Enc(detail.Name)}\" />\n");
        html.Append($"    <meta property=\"og:description\" content=\"{Enc(metaDescription)}\" />\n");
        html.Append($"    <meta property=\"og:url\" content=\"{Enc(canonicalUrl)}\" />\n");
        if (mainImage is not null)
        {
            html.Append($"    <meta property=\"og:image\" content=\"{Enc(AbsoluteUrl(mainImage))}\" />\n");
        }
        html.Append("    <meta property=\"og:locale\" content=\"en_IN\" />\n");
        html.Append("    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n");
        html.Append($"    <meta name=\"twitter:title\" content=\"{Enc(detail.Name)}\" />\n");
        html.Append($"    <meta name=\"twitter:description\" content=\"{Enc(metaDescription)}\" />\n");
        html.Append("    <base href=\"/\" />\n");
        html.Append("    <link rel=\"canonical\" href=\"" + Enc(canonicalUrl) + "\" />\n");
        html.Append("    <link rel=\"icon\" type=\"image/png\" href=\"/oxyniti.png?v=2\" />\n");
        html.Append("    <link rel=\"preconnect\" href=\"https://maker-rest-api-e5c2djh7aafkace8.uksouth-01.azurewebsites.net\" crossorigin />\n");
        html.Append("    <link rel=\"stylesheet\" href=\"app.css\" />\n");
        html.Append("    <link rel=\"stylesheet\" href=\"css/content-pages.css\" media=\"print\" onload=\"this.media='all'\" />\n");
        html.Append("    <link rel=\"stylesheet\" href=\"bootstrap/dist/css/bootstrap.min.css\" media=\"print\" onload=\"this.media='all'\" />\n");
        html.Append("    <link href=\"Oxyniti.styles.css\" rel=\"stylesheet\" media=\"print\" onload=\"this.media='all'\" />\n");
        html.Append("    <link rel=\"stylesheet\" href=\"bootstrap/dist/css/bootstrap-icons.min.css\" media=\"print\" onload=\"this.media='all'\" />\n");
        html.Append("    <noscript>\n");
        html.Append("        <link rel=\"stylesheet\" href=\"css/content-pages.css\" />\n");
        html.Append("        <link rel=\"stylesheet\" href=\"bootstrap/dist/css/bootstrap.min.css\" />\n");
        html.Append("        <link href=\"Oxyniti.styles.css\" rel=\"stylesheet\" />\n");
        html.Append("        <link rel=\"stylesheet\" href=\"bootstrap/dist/css/bootstrap-icons.min.css\" />\n");
        html.Append("    </noscript>\n");
        html.Append($"    <script type=\"application/ld+json\">{productJsonLd}</script>\n");
        html.Append($"    <script type=\"application/ld+json\">{breadcrumbJsonLd}</script>\n");
        html.Append("</head>\n\n<body>\n");
        html.Append("    <script src=\"bootstrap/dist/js/bootstrap.bundle.min.js\" defer></script>\n");
        html.Append("    <div id=\"app\">\n");
        html.Append("        <div class=\"shell-loading-bar\" aria-hidden=\"true\"></div>\n");
        html.Append("        <div class=\"shell-header-spacer\" aria-hidden=\"true\"></div>\n");
        html.Append("        <div class=\"product-details container-fluid px-4 py-5\">\n");
        html.Append("            <nav aria-label=\"breadcrumb\" class=\"mb-3\">\n");
        html.Append("                <a href=\"/\">Home</a> &rsaquo; <a href=\"/products\">Products</a> &rsaquo; " + Enc(detail.Name) + "\n");
        html.Append("            </nav>\n");
        html.Append("            <div class=\"row g-5\">\n");
        html.Append("                <div class=\"col-12 col-lg-6\">\n");
        if (mainImage is not null)
        {
            html.Append($"                    <img src=\"{Enc(mainImage)}\" class=\"d-block w-100 rounded\" alt=\"{Enc(detail.Name)}\" />\n");
            if (images.Count > 1)
            {
                html.Append("                    <div class=\"carousel-thumbs-container mt-3\">\n");
                html.Append("                        <div class=\"thumbs-row d-flex flex-row gap-2 justify-content-center\">\n");
                foreach (var image in images.Skip(1))
                {
                    html.Append($"                            <div class=\"thumb-box\"><img src=\"{Enc(image)}\" alt=\"{Enc(detail.Name)}\" /></div>\n");
                }
                html.Append("                        </div>\n");
                html.Append("                    </div>\n");
            }
        }
        html.Append("                </div>\n");
        html.Append("                <div class=\"col-12 col-lg-6\">\n");
        html.Append($"                    <h1>{Enc(detail.Name)}</h1>\n");
        html.Append($"                    <p class=\"fs-4 fw-bold text-purple\">₹{detail.Price}</p>\n");
        html.Append($"                    <p>{Enc(detail.Description)}</p>\n");
        html.Append("                    <div class=\"accordion\" id=\"specAccordion\">\n");
        // ReadMeHtml is trusted CMS-authored markup, same as ProductDetails.razor's
        // (MarkupString)Detail.ReadMeHtml: embedded verbatim, not re-encoded.
        html.Append(detail.ReadMeHtml ?? "");
        html.Append("\n                    </div>\n");
        html.Append("                </div>\n");
        html.Append("            </div>\n");
        html.Append("        </div>\n");
        html.Append("    </div>\n");
        html.Append("    <script>\n");
        html.Append("        (function () {\n");
        html.Append("            var el = document.createElement('div');\n");
        html.Append("            el.id = 'blazor-error-ui';\n");
        html.Append("            el.setAttribute('data-nosnippet', '');\n");
        html.Append("            el.innerHTML = 'An unhandled error has occurred.'\n");
        html.Append("                + '<a href=\".\" class=\"reload\">Reload</a>'\n");
        html.Append("                + '<span class=\"dismiss\">🗙</span>';\n");
        html.Append("            document.body.appendChild(el);\n");
        html.Append("        })();\n");
        html.Append("    </script>\n");
        html.Append("    <script src=\"./js/i18nHelper.js\" defer></script>\n");
        html.Append("    <script src=\"./js/clickOutsideHelper.js\" defer></script>\n");
        html.Append("    <script src=\"./js/tankBubbles.js\" defer></script>\n");
        html.Append("    <script src=\"./js/scrollHelper.js\" defer></script>\n");
        html.Append("    <script src=\"./js/testimonialTranslate.js\" defer></script>\n");
        html.Append("    <script src=\"_framework/blazor.webassembly.js\" defer></script>\n");
        html.Append("</body>\n</html>\n");

        return html.ToString();
    }

    private const string Origin = "https://www.oxyniti.com";

    private static string Enc(string? value) => WebUtility.HtmlEncode(value ?? "");

    // Social scrapers (WhatsApp etc.) don't resolve relative og:image paths, same
    // rationale as the one already noted in wwwroot/index.html.
    private static string AbsoluteUrl(string url) => url.StartsWith('/') ? Origin + url : url;

    // Mirrors ProductDetails.razor.BuildProductJsonLd/BuildBreadcrumbJsonLd: System.Text.Json's
    // default encoder escapes HTML-sensitive characters, so CMS text containing a quote or a
    // literal "</script>" can't break out of the tag.
    private static string BuildProductJsonLd(ProductDetailsReply detail, string canonicalUrl, string? mainImage)
    {
        var product = new JsonLdProduct
        {
            Name = detail.Name,
            Description = detail.Description,
            Image = mainImage is null ? null : AbsoluteUrl(mainImage),
            Offers = new JsonLdOffer
            {
                Url = canonicalUrl,
                Price = detail.Price.ToString(System.Globalization.CultureInfo.InvariantCulture),
            },
        };

        return JsonSerializer.Serialize(product, JsonLdOptions);
    }

    private static string BuildBreadcrumbJsonLd(ProductDetailsReply detail, string canonicalUrl)
    {
        var breadcrumb = new JsonLdBreadcrumbList
        {
            ItemListElement =
            [
                new JsonLdListItem { Position = 1, Name = "Home", Item = $"{Origin}/" },
                new JsonLdListItem { Position = 2, Name = "Products", Item = $"{Origin}/products" },
                new JsonLdListItem { Position = 3, Name = detail.Name, Item = canonicalUrl },
            ],
        };

        return JsonSerializer.Serialize(breadcrumb, JsonLdOptions);
    }

    private sealed class JsonLdProduct
    {
        [JsonPropertyName("@context")] public string Context => "https://schema.org";
        [JsonPropertyName("@type")] public string Type => "Product";
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public string? Image { get; set; }
        public JsonLdBrand Brand { get; set; } = new();
        public JsonLdOffer Offers { get; set; } = new();
    }

    private sealed class JsonLdBrand
    {
        [JsonPropertyName("@type")] public string Type => "Brand";
        public string Name => "Oxyniti";
    }

    private sealed class JsonLdOffer
    {
        [JsonPropertyName("@type")] public string Type => "Offer";
        public string Url { get; set; } = "";
        public string PriceCurrency => "INR";
        public string Price { get; set; } = "";
    }

    private sealed class JsonLdBreadcrumbList
    {
        [JsonPropertyName("@context")] public string Context => "https://schema.org";
        [JsonPropertyName("@type")] public string Type => "BreadcrumbList";
        public List<JsonLdListItem> ItemListElement { get; set; } = [];
    }

    private sealed class JsonLdListItem
    {
        [JsonPropertyName("@type")] public string Type => "ListItem";
        public int Position { get; set; }
        public string Name { get; set; } = "";
        public string Item { get; set; } = "";
    }
}
