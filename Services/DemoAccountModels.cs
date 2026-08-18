namespace Oxyniti.Services;

public class CreateDemoAccountRequest
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Place { get; set; } = string.Empty;
    public string Size { get; set; } = string.Empty;
    public string Species { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class UpdateDemoProfileRequest
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? AlternatePhone { get; set; }
    public string? Place { get; set; }
    public string? State { get; set; }
    public string? PondLocation { get; set; }
    public string? Size { get; set; }
    public string? Species { get; set; }
}

public class DemoAccountResult
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
}
