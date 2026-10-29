namespace Oxyniti.Services;

/// <summary>
/// Rupee amounts with Indian digit grouping (₹1,00,000, not ₹100000 or
/// ₹100,000). Done by hand because every project here builds with
/// InvariantGlobalization, so the en-IN culture is not available at runtime.
/// Also compiled into tools/StaticProductPages so the static product pages
/// and the live Blazor pages print the same string.
/// </summary>
public static class InrFormat
{
    /// <summary>Whole rupees, e.g. 100000 → "₹1,00,000".</summary>
    public static string Rupees(decimal amount) => "₹" + Group(Math.Round(amount, MidpointRounding.AwayFromZero));

    public static string Rupees(double amount) => Rupees((decimal)amount);

    // Without this an int price is ambiguous between the decimal and double overloads.
    public static string Rupees(long amount) => Rupees((decimal)amount);

    /// <summary>Rupees with paise, e.g. 100000.5 → "₹1,00,000.50".</summary>
    public static string RupeesAndPaise(decimal amount)
    {
        var rounded = Math.Round(amount, 2, MidpointRounding.AwayFromZero);
        var whole = decimal.Truncate(rounded);
        var paise = (int)Math.Abs((rounded - whole) * 100);
        return $"₹{Group(whole)}.{paise:00}";
    }

    // Last three digits, then groups of two: 12345678 → 1,23,45,678.
    private static string Group(decimal whole)
    {
        var sign = whole < 0 ? "-" : "";
        var digits = decimal.Truncate(Math.Abs(whole)).ToString(System.Globalization.CultureInfo.InvariantCulture);
        if (digits.Length <= 3) return sign + digits;

        var head = digits[..^3];
        var groups = new List<string>();
        for (var end = head.Length; end > 0; end -= 2)
            groups.Insert(0, head[Math.Max(0, end - 2)..end]);
        return sign + string.Join(",", groups) + "," + digits[^3..];
    }
}
