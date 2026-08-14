namespace Oxyniti;

public static class SiteContact
{
    public const string WhatsAppNumber = "918668197639";

    public static string WhatsAppLink(string message = "Hi, I'd like to know more about Oxyniti.") =>
        $"https://wa.me/{WhatsAppNumber}?text={Uri.EscapeDataString(message)}";
}
