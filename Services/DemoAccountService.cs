using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using Oxyniti.Configuration;

namespace Oxyniti.Services;

// Free Pond Demo -> account entry point. No such API exists yet: it isn't on
// the compiled Maker.RampEdge client, and Oxyniti's own backend
// (OxynitiApiSettings.BaseAddress) hasn't been deployed. This service defines
// the contracts the demo entry flow needs so the frontend is ready to wire up
// as soon as the backend ships:
//   POST {BaseAddress}/api/demo-accounts   -- create the account/profile from
//     the demo form and (ideally) send the user a passcode over WhatsApp.
//   POST {BaseAddress}/api/account/profile -- update profile info from the
//     Account page.
// Login itself doesn't need a new endpoint here: it reuses the existing
// IAuthenticationService.LoginAsync(identifier, secret) — see Login.razor —
// on the expectation that accounts created via demo entry can log in with
// their phone number as the identifier and their WhatsApp passcode as the
// secret. Until BaseAddress is configured, every call below fails gracefully
// and the caller falls back to today's local-only behaviour.
public interface IDemoAccountService
{
    Task<DemoAccountResult> CreateAccountAndSendPasscodeAsync(CreateDemoAccountRequest request);
    Task<DemoAccountResult> UpdateProfileAsync(UpdateDemoProfileRequest request);
}

public class DemoAccountService(HttpClient http, IOptions<OxynitiApiSettings> apiSettings) : IDemoAccountService
{
    private const string CreateAccountRoute = "api/demo-accounts";
    private const string UpdateProfileRoute = "api/account/profile";

    public Task<DemoAccountResult> CreateAccountAndSendPasscodeAsync(CreateDemoAccountRequest request) =>
        PostAsync(CreateAccountRoute, request,
            "We couldn't reach the account service yet — your demo request is saved and we'll be in touch.");

    public Task<DemoAccountResult> UpdateProfileAsync(UpdateDemoProfileRequest request) =>
        PostAsync(UpdateProfileRoute, request,
            "We can't save profile changes just yet — please check back soon.");

    private async Task<DemoAccountResult> PostAsync<TRequest>(string route, TRequest request, string unavailableMessage)
    {
        var baseAddress = apiSettings.Value.BaseAddress;
        if (string.IsNullOrWhiteSpace(baseAddress))
        {
            Console.WriteLine($"[DemoAccountService] OxynitiApi:BaseAddress not configured — skipping call to {route}.");
            return new DemoAccountResult { IsSuccess = false, Message = unavailableMessage };
        }

        try
        {
            var uri = new Uri(new Uri(baseAddress), route);
            var response = await http.PostAsJsonAsync(uri, request);
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<DemoAccountResult>();
                return result ?? new DemoAccountResult { IsSuccess = true, Message = "Done." };
            }

            Console.WriteLine($"[DemoAccountService] {route} returned {(int)response.StatusCode}.");
            return new DemoAccountResult { IsSuccess = false, Message = unavailableMessage };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DemoAccountService] Error calling {route}: {ex}");
            return new DemoAccountResult { IsSuccess = false, Message = unavailableMessage };
        }
    }
}
