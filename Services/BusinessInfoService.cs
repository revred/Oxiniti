using Maker.RampEdge;

namespace Oxyniti.Services
{
    /// <summary>
    /// Branding / testimonials / CMS copy: a nice-to-have overlay, never a render gate.
    /// The site paints immediately from the static defaults below and swaps in CMS
    /// values via <see cref="OnChange"/> if and when the call lands. A slow or failed
    /// GetBusinessInfo must never hold up first paint.
    /// </summary>
    public class BusinessInfoService
    {
        // Brand asset shipped with the app (same file the boot splash uses), so the
        // header/footer logo paints on the first frame instead of popping in later.
        public const string DefaultLogoUrl = "/oxyniti.png";
        private const string DefaultApplicationName = "Oxyniti";

        private readonly IMakerClient _makerClient;

        public string ApplicationName { get; private set; } = DefaultApplicationName;
        public string TagLine { get; private set; } = string.Empty;
        public string CopyRightNotice { get; private set; } = $"© {DateTime.Now.Year} {DefaultApplicationName}. All rights reserved.";
        public string SocialMediaLinks { get; private set; } = string.Empty;
        public string Testimonials { get; private set; } = """
<div class="testimonials-container">
    <div class="testimonial-card">
        <p class="testimonial-quote">நான் ஆக்சிஜனைப் பயன்படுத்த ஆரம்பித்ததில் இருந்து, என் மீன்களின் வளர்ச்சி மிகவும் வேகமாக இருக்கிறது. இரவு நேரங்களில் ஆக்ஸிஜன் பற்றாக்குறை பிரச்சனையே இல்லை.</p>
        <div class="testimonial-author">
            <div class="author-avatar"><i class="bi bi-person-fill" style="font-size: 2rem; color: rgba(255, 255, 255, 0.7);"></i></div>
            <div class="author-info">
                <span class="author-name">Muthukumar</span>
                <span class="author-description">Pangasius Farmer, Thanjavur</span>
            </div>
        </div>
    </div>
    <div class="testimonial-card">
        <p class="testimonial-quote">Sir, before we had many problem at night. Fish come to top for breathing. Now we installed this machine, morning time fish is very active. Feed is not wasting also. Growth is fast.</p>
        <div class="testimonial-author">
            <div class="author-avatar"><i class="bi bi-person-fill" style="font-size: 2rem; color: rgba(255, 255, 255, 0.7);"></i></div>
            <div class="author-info">
                <span class="author-name">Venkat Reddy</span>
                <span class="author-description">Tilapia Farmer, Nellore</span>
            </div>
        </div>
    </div>
    <div class="testimonial-card">
        <p class="testimonial-quote">இந்த மிஷின் போட்ட பிறகு மீன்கள் நல்லா சாப்பிடுது. மரண விகிதம் ரொம்ப குறைஞ்சிடுச்சு. மகசூல் நல்லா இருக்கு.</p>
        <div class="testimonial-author">
            <div class="author-avatar"><i class="bi bi-person-fill" style="font-size: 2rem; color: rgba(255, 255, 255, 0.7);"></i></div>
            <div class="author-info">
                <span class="author-name">Karthikeyan</span>
                <span class="author-description">Murrel Farmer, Madurai</span>
            </div>
        </div>
    </div>
    <div class="testimonial-card">
        <p class="testimonial-quote">Yield is very good this time. Earlier we get only 1.5 ton, now crossing 2 ton easily because oxygen is staying in water. Very happy with the result.</p>
        <div class="testimonial-author">
            <div class="author-avatar"><i class="bi bi-person-fill" style="font-size: 2rem; color: rgba(255, 255, 255, 0.7);"></i></div>
            <div class="author-info">
                <span class="author-name">Harish</span>
                <span class="author-description">Fish Farm Owner, Vijayawada</span>
            </div>
        </div>
    </div>
</div>
""";
        public DigitalAsset? Asset { get; private set; }
        public IDictionary<string, string> Contents { get; private set; } = new Dictionary<string, string>();

        /// <summary>CMS logo once it lands, the shipped brand asset until then — never empty.</summary>
        public string LogoUrl =>
            !string.IsNullOrWhiteSpace(Asset?.Url) && !IsTimeLimitedUrl(Asset!.Url)
                ? Asset!.Url
                : DefaultLogoUrl;

        /// <summary>
        /// A Supabase Storage signed URL (".../object/sign/...?token=...") expires
        /// minutes after issuance — unusable for a public brand asset that has to
        /// survive prerendering and caching. Treat one as if the CMS supplied
        /// nothing rather than ship a logo URL that goes dead in the wild.
        /// See https://github.com/revred/Oxiniti/issues/80.
        /// </summary>
        private static bool IsTimeLimitedUrl(string url) =>
            url.Contains("/object/sign/", StringComparison.OrdinalIgnoreCase);

        /// <summary>True once the fetch has settled, whether it succeeded or failed.</summary>
        public bool IsLoaded { get; private set; }

        /// <summary>Raised (once) when the fetch settles, so consumers can re-render.</summary>
        public event Action? OnChange;

        private Task? _loading;

        public BusinessInfoService(IMakerClient makerClient)
        {
            _makerClient = makerClient;
        }

        /// <summary>
        /// Starts the load if it has not started already, and never throws — safe to
        /// fire-and-forget from Program.cs so it runs alongside the first render.
        /// </summary>
        public Task EnsureLoadedAsync() => _loading ??= LoadCoreAsync();

        private async Task LoadCoreAsync()
        {
            try
            {
                var result = await _makerClient.GetBusinessInfoAsync();

                // Only overwrite what the CMS actually supplied — a partial or empty
                // response must not blank out the working static defaults.
                if (!string.IsNullOrWhiteSpace(result.ApplicationName)) ApplicationName = result.ApplicationName;
                if (!string.IsNullOrWhiteSpace(result.TagLine)) TagLine = result.TagLine;
                if (!string.IsNullOrWhiteSpace(result.CopyRightNotice)) CopyRightNotice = result.CopyRightNotice;
                if (!string.IsNullOrWhiteSpace(result.SocialMediaLinks)) SocialMediaLinks = result.SocialMediaLinks;
                // if (!string.IsNullOrWhiteSpace(result.Testimonials)) Testimonials = result.Testimonials;
                if (result.Asset != null) Asset = result.Asset;
                if (result.Contents != null) Contents = result.Contents;
            }
            catch (Exception ex)
            {
                // Nice-to-have data from an external CMS — the whole site must not go
                // down (or stay blank) just because that one call failed.
                Console.WriteLine($"[BusinessInfoService] Failed to load business info: {ex}");
            }
            finally
            {
                IsLoaded = true;
                OnChange?.Invoke();
            }
        }
    }
}
