namespace Oxyniti;

public static class SiteContact
{
    public const string WhatsAppNumber = "919659727477";
    public const string PhoneDisplay = "+91 96597 27477";

    public static string WhatsAppLink(string message = "Hi, I'd like to know more about Oxyniti.") =>
        $"https://wa.me/{WhatsAppNumber}?text={Uri.EscapeDataString(message)}";

    public static string PhoneLink => $"tel:+{WhatsAppNumber}";
}
