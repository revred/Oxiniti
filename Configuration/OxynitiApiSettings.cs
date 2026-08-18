namespace Oxyniti.Configuration;

// Base address for Oxyniti's own backend (account creation, passcode issuance,
// profile updates). Separate from RampEdgeSettings, which points at the
// existing Maker.RampEdge product API. Leave BaseAddress empty until the
// Oxyniti backend is deployed — DemoAccountService treats "not configured"
// as an expected, gracefully-handled state rather than an error.
public class OxynitiApiSettings
{
    public const string SectionName = "OxynitiApi";
    public string BaseAddress { get; set; } = string.Empty;
}
