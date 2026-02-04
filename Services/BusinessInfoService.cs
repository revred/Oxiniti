using Maker.RampEdge;

namespace Oxyniti.Services
{
    public class BusinessInfoService
    {
        private readonly IMakerClient _makerClient;

        public string ApplicationName { get; private set; } = string.Empty;
        public string TagLine { get; private set; } = string.Empty;
        public string CopyRightNotice { get; private set; } = string.Empty;
        public string SocialMediaLinks { get; private set; } = string.Empty;
        public string Testimonials { get; private set; } = string.Empty;
        public DigitalAsset? Asset { get; private set; }
        public IDictionary<string, string> Contents { get; private set; } = new Dictionary<string, string>();

        private bool _loaded = false;

        public BusinessInfoService(IMakerClient makerClient)
        {
            _makerClient = makerClient;
        }

        public async Task LoadAsync()
        {
            if (_loaded) return; // load once only

            var result = await _makerClient.GetBusinessInfoAsync();

            ApplicationName = result.ApplicationName;
            TagLine = result.TagLine;
            CopyRightNotice = result.CopyRightNotice;
            SocialMediaLinks = result.SocialMediaLinks;
            Asset = result.Asset;
            Testimonials = result.Testimonials;
            Contents = result.Contents;

            _loaded = true;
        }
    }
}
