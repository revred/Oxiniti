namespace Oxyniti.Services;

public class DemoBooking
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Place { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public string Species { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
