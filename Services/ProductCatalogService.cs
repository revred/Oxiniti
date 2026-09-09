using System.Text.Json;
using Maker.RampEdge;
using Microsoft.JSInterop;

namespace Oxyniti.Services
{
    /// <summary>
    /// The product-type catalogue (<see cref="IMakerClient.ProductGroupsAsync"/>),
    /// fetched ONCE per app boot and shared by every component that needs it.
    ///
    /// Before this, /products (DiscoverProductTypes), the homepage
    /// (FeaturedProducts), /products/type/{slug} and /search each made their
    /// own call on mount, so every visit to the Products page sat behind six
    /// grey skeleton cards for however long the (cold-starting) CMS API took
    /// to answer. Now:
    ///
    ///  * Program.cs starts the load alongside the first render, so the data
    ///    is usually already here by the time anyone clicks "Products".
    ///  * The last good answer is kept in localStorage and shown immediately
    ///    on the next boot while the live call refreshes it (stale-while-
    ///    revalidate), so the grid paints in the first frame even on a
    ///    refresh.
    ///  * A failed live call falls back to the stored copy, so an API outage
    ///    degrades to "slightly old catalogue" rather than an empty page.
    ///
    /// The one thing a stored copy cannot supply is images: the CMS serves
    /// them as Supabase Storage signed URLs that expire ~5 minutes after
    /// issue (see BusinessInfoService.IsTimeLimitedUrl, issue #80). Consumers
    /// check <see cref="ImagesUsable"/> and show a neutral tile instead of a
    /// broken image until the live answer swaps the fresh URLs in.
    /// </summary>
    public sealed class ProductCatalogService
    {
        private const string StorageKey = "oxyniti_product_groups";

        // How long a stored copy's text (name, slug, description) is worth
        // showing before the live call lands. Product types change rarely.
        private static readonly TimeSpan SnapshotMaxAge = TimeSpan.FromDays(7);

        // Signed image URLs live ~5 minutes; leave a margin so a copy saved
        // just under the limit is never rendered as a broken image.
        private static readonly TimeSpan ImageUrlMaxAge = TimeSpan.FromMinutes(4);

        private readonly IMakerClient _makerClient;
        private readonly IJSRuntime _js;
        private Task? _loading;

        /// <summary>The catalogue, or null until either the stored copy or the live call has produced one.</summary>
        public IReadOnlyList<ProductData>? Groups { get; private set; }

        /// <summary>True when <see cref="Groups"/>' image URLs are fresh enough to render.</summary>
        public bool ImagesUsable { get; private set; }

        /// <summary>True once the live call has settled (success or failure) this session.</summary>
        public bool IsLoaded { get; private set; }

        /// <summary>Raised whenever <see cref="Groups"/> changes (stored copy restored, live answer landed).</summary>
        public event Action? OnChange;

        public ProductCatalogService(IMakerClient makerClient, IJSRuntime js)
        {
            _makerClient = makerClient;
            _js = js;
        }

        /// <summary>
        /// Starts the load if it has not started already, and never throws --
        /// safe to fire-and-forget from Program.cs.
        /// </summary>
        public Task EnsureLoadedAsync() => _loading ??= LoadCoreAsync();

        /// <summary>The catalogue once the live call has settled; empty (never null) on failure.</summary>
        public async Task<IReadOnlyList<ProductData>> GetGroupsAsync()
        {
            await EnsureLoadedAsync();
            return Groups ?? Array.Empty<ProductData>();
        }

        private async Task LoadCoreAsync()
        {
            await RestoreSnapshotAsync();

            try
            {
                var result = await _makerClient.ProductGroupsAsync();
                var products = result.Products?.ToList() ?? new List<ProductData>();

                // An empty answer from a live API is far more likely a transient
                // backend failure than a genuinely empty catalogue: keep the
                // stored copy if there is one.
                if (products.Count > 0 || Groups is null)
                {
                    Groups = products;
                    ImagesUsable = true;
                    await SaveSnapshotAsync(products);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ProductCatalogService] Failed to load product groups: {ex}");
                Groups ??= Array.Empty<ProductData>();
            }
            finally
            {
                IsLoaded = true;
                OnChange?.Invoke();
            }
        }

        private async Task RestoreSnapshotAsync()
        {
            try
            {
                var json = await _js.InvokeAsync<string?>("localStorage.getItem", StorageKey);
                if (string.IsNullOrEmpty(json)) return;

                var snapshot = JsonSerializer.Deserialize<Snapshot>(json);
                if (snapshot?.Products is not { Count: > 0 }) return;

                var age = DateTimeOffset.UtcNow - snapshot.SavedAt;
                if (age > SnapshotMaxAge) return;

                Groups = snapshot.Products;
                ImagesUsable = age < ImageUrlMaxAge;
                OnChange?.Invoke();
            }
            catch (Exception ex)
            {
                // A corrupt or incompatible stored copy is just a cache miss.
                Console.WriteLine($"[ProductCatalogService] Ignoring stored product groups: {ex.Message}");
            }
        }

        private async Task SaveSnapshotAsync(List<ProductData> products)
        {
            try
            {
                var json = JsonSerializer.Serialize(new Snapshot(DateTimeOffset.UtcNow, products));
                await _js.InvokeVoidAsync("localStorage.setItem", StorageKey, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ProductCatalogService] Could not store product groups: {ex.Message}");
            }
        }

        private sealed record Snapshot(DateTimeOffset SavedAt, List<ProductData> Products);
    }
}
