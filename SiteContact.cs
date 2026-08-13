namespace Oxyniti;

public static class SiteContact
{
    // TODO: replace with the real WhatsApp Business number (digits only, country code first, e.g. "919876543210").
    public const string WhatsAppNumber = "910000000000";

    public static string WhatsAppLink(string message = "Hi, I'd like to know more about Oxyniti.") =>
        $"https://wa.me/{WhatsAppNumber}?text={Uri.EscapeDataString(message)}";
}
