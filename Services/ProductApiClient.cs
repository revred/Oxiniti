using System.Net;
using System.Text.Json;
using Maker.RampEdge;
using Maker.RampEdge.Configuration;
using Microsoft.Extensions.Options;

namespace Oxyniti.Services
{
    /// <summary>
    /// Reads the two product endpoints over GET instead of the generated client's
    /// POST, so the browser can cache them.
    ///
    /// Why this exists at all: a browser will never cache a POST response, whatever
    /// Cache-Control says. /api/public/ProductGroups was made a cacheable GET and a
    /// storefront refresh now repaints its catalogue with no network round trip;
    /// ProductsBySlug and ProductDetails could not get that win because
    /// Maker.RampEdgeV1 ships compiled with both bound to POST. The API now serves
    /// both verbs from the same repository method and the same server cache, so
    /// this calls the GET and gets the browser cache for free.
    ///
    /// The generated client stays as the fallback. The two deploy separately -- the
    /// storefront can go live against an API that predates the GET routes -- so a
    /// missing route must degrade to the old path, not to an empty catalogue.
    /// </summary>
    public sealed class ProductApiClient
    {
        private readonly HttpClient _http;
        private readonly IMakerClient _makerClient;
        private readonly string _businessUnitKey;

        /// <summary>
        /// Set once the API is known not to serve the GET routes, so every later
        /// call goes straight to the POST instead of paying a doomed round trip
        /// first. Only the LIST endpoint may set this -- see TryGetListAsync.
        /// </summary>
        private bool _getRoutesUnavailable;

        public ProductApiClient(IMakerClient makerClient, IOptions<RampEdgeSettings> settings)
        {
            _makerClient = makerClient;
            _businessUnitKey = settings.Value.BusinessUnitKey ?? "";

            _http = new HttpClient { BaseAddress = new Uri(settings.Value.BaseAddress) };
            _http.DefaultRequestHeaders.Add("businessunitkey", _businessUnitKey);
        }

        public async Task<ProductListResponse> ProductsBySlugAsync(ProductRequest request)
        {
            var viaGet = await TryGetListAsync(request);
            if (viaGet is not null) return viaGet;

            return await _makerClient.ProductsBySlugAsync(body: request);
        }

        public async Task<ProductDetailsReply?> ProductDetailsAsync(ProductRequest request)
        {
            var viaGet = await TryGetDetailsAsync(request);
            if (viaGet is not null) return viaGet;

            // Either the GET routes are not deployed, or the GET returned 404. The
            // second case is ambiguous -- an undeployed route and a product that
            // does not exist both answer 404 -- so let the POST decide rather than
            // guessing. It is authoritative, and a genuine 404 is rare enough that
            // the extra round trip costs nothing in practice.
            try
            {
                return await _makerClient.ProductDetailsAsync(request);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ProductApiClient] ProductDetailsAsync failed: {ex.Message}");
                return null;
            }
        }

        private async Task<ProductListResponse?> TryGetListAsync(ProductRequest request)
        {
            if (_getRoutesUnavailable) return null;

            try
            {
                var url = "api/public/ProductsBySlug"
                    + $"?slug={Uri.EscapeDataString(request.Slug ?? "")}"
                    + $"&search={Uri.EscapeDataString(request.Search ?? "")}"
                    + $"&sortBy={Uri.EscapeDataString(request.SortBy ?? "")}"
                    + $"&page={request.Page}"
                    + $"&pageSize={request.PageSize}";

                using var response = await _http.GetAsync(url);

                // Both are unambiguous here: a deployed route answers 200 with an
                // empty list for an unknown slug, so 404 can only mean the route is
                // missing, and 405 means the path routes the POST but not the GET.
                // Latch either and stop asking. (Production answers 405 today.)
                if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.MethodNotAllowed)
                {
                    _getRoutesUnavailable = true;
                    return null;
                }

                if (!response.IsSuccessStatusCode) return null;

                var json = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<ProductListResponse>(json);
            }
            catch (Exception ex)
            {
                // A transport failure says nothing about whether the route exists,
                // so this does NOT latch: fall back for this call only.
                Console.WriteLine($"[ProductApiClient] GET ProductsBySlug failed, using POST: {ex.Message}");
                return null;
            }
        }

        private async Task<ProductDetailsReply?> TryGetDetailsAsync(ProductRequest request)
        {
            if (_getRoutesUnavailable) return null;

            try
            {
                var url = $"api/public/ProductDetails?slug={Uri.EscapeDataString(request.Slug ?? "")}";

                using var response = await _http.GetAsync(url);

                // 405 is unambiguous and worth latching: the path exists (the POST
                // is routed there) but does not accept GET, so the GET route is
                // definitively absent -- which is exactly what an API older than
                // the GET routes answers. A plain 404 is NOT latched: here it
                // cannot be told apart from a product that does not exist.
                if (response.StatusCode is HttpStatusCode.MethodNotAllowed)
                {
                    _getRoutesUnavailable = true;
                    return null;
                }

                if (!response.IsSuccessStatusCode) return null;

                var json = await response.Content.ReadAsStringAsync();
                var reply = JsonSerializer.Deserialize<ProductDetailsReply>(json);

                // The endpoint 404s rather than returning a bodiless 200, but a
                // reply with no Slug is what every caller treats as "not found".
                return string.IsNullOrEmpty(reply?.Slug) ? null : reply;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ProductApiClient] GET ProductDetails failed, using POST: {ex.Message}");
                return null;
            }
        }
    }
}
