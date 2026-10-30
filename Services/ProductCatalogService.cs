using System.Text.Json;
using Maker.RampEdge;
using Microsoft.JSInterop;

namespace Oxyniti.Services
{
    /// <summary>
    /// The product-type catalogue (<see cref="IMakerClient.ProductGroupsAsync"/>),
    /// fetched once per app boot (then quietly re-fetched for fresh image URLs,
    /// see <see cref="ScheduleRenewal"/>) and shared by every component that needs it.
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

        // Fresh URLs are fetched this long after the last ones, while the old
        // ones still work, so a page opened at any moment has images ready.
        private static readonly TimeSpan RenewAfter = TimeSpan.FromSeconds(210);

        // Stop renewing once nobody has opened a product section for this
        // long, so a forgotten tab doesn't call the API forever. The next
        // visit to a product section starts it again.
        private static readonly TimeSpan RenewWhileIdleFor = TimeSpan.FromMinutes(30);

        private readonly IMakerClient _makerClient;
        private readonly IJSRuntime _js;
        private Task? _loading;
        private Timer? _renewTimer;
        private DateTimeOffset _lastAskedAt = DateTimeOffset.UtcNow;

        /// <summary>The catalogue, or null until either the stored copy or the live call has produced one.</summary>
        public IReadOnlyList<ProductData>? Groups { get; private set; }

        // When the image URLs in Groups were issued (live answer or stored copy).
        private DateTimeOffset? _imagesIssuedAt;

        /// <summary>
        /// True when <see cref="Groups"/>' image URLs are fresh enough to render.
        /// Goes false on its own as they age, so a visit that outlives the
        /// signed URLs shows plain tiles rather than broken images.
        /// </summary>
        public bool ImagesUsable =>
            _imagesIssuedAt is { } issued && DateTimeOffset.UtcNow - issued < ImageUrlMaxAge;

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
        /// safe to fire-and-forget from Program.cs. Once the first load has
        /// finished, a call after the image URLs have expired fetches fresh
        /// ones, so a page opened late in a long visit still gets its images.
        /// </summary>
        public Task EnsureLoadedAsync()
        {
            _lastAskedAt = DateTimeOffset.UtcNow;

            if (_loading is { IsCompleted: true } && !ImagesUsable && Groups is { Count: > 0 })
                _loading = RefreshAsync();

            return _loading ??= LoadCoreAsync();
        }

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
                    _imagesIssuedAt = DateTimeOffset.UtcNow;
                    ScheduleRenewal();
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

        // Re-fetches the catalogue for fresh image URLs. Keeps what is shown
        // on failure or an empty answer: the tiles just stay plain.
        private async Task RefreshAsync()
        {
            try
            {
                var result = await _makerClient.ProductGroupsAsync();
                var products = result.Products?.ToList() ?? new List<ProductData>();
                if (products.Count == 0) return;

                Groups = products;
                _imagesIssuedAt = DateTimeOffset.UtcNow;
                ScheduleRenewal();
                await SaveSnapshotAsync(products);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ProductCatalogService] Failed to refresh product groups: {ex.Message}");
            }
            finally
            {
                OnChange?.Invoke();
            }
        }

        // Fetches fresh image URLs shortly before the current ones expire, so
        // the next product section to open shows its images at once instead
        // of waiting on the API. Skipped once the visit has gone idle.
        private void ScheduleRenewal()
        {
            _renewTimer?.Dispose();
            _renewTimer = new Timer(_ =>
            {
                if (DateTimeOffset.UtcNow - _lastAskedAt > RenewWhileIdleFor) return;
                if (_loading is { IsCompleted: false }) return;
                _loading = RefreshAsync();
            }, null, RenewAfter, Timeout.InfiniteTimeSpan);
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
                _imagesIssuedAt = snapshot.SavedAt;
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
