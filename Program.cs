using Oxyniti;
using Oxyniti.Configuration;
using Oxyniti.Services;
using Maker.RampEdge.Configuration;
using Maker.RampEdge.Extensions;
using Maker.RampEdge.Services.Contracts;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddSingleton(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddSingleton<CartService>();
builder.Services.AddSingleton<AuthReadyGate>();
builder.Services.AddSingleton<StaffDemoService>();
builder.Services.AddSingleton<BusinessInfoService>();
builder.Services.AddSingleton<ProductCatalogService>();
// Reads ProductsBySlug/ProductDetails over GET so the browser can cache them,
// falling back to the generated client's POST. Registered after AddMakerClient
// resolves IMakerClient at first use, not here, so ordering does not matter.
builder.Services.AddSingleton<ProductApiClient>();
builder.Services.AddSingleton<LocalizationService>();
builder.Services.AddSingleton<IDemoAccountService, DemoAccountService>();
builder.Services.AddOptions<StripeSettings>()
    .BindConfiguration("Stripe");
builder.Services.AddOptions<RampEdgeSettings>()
    .BindConfiguration(RampEdgeSettings.SectionName);
builder.Services.AddOptions<OxynitiApiSettings>()
    .BindConfiguration(OxynitiApiSettings.SectionName);


// The app's own container, set once it's built. BuildServiceProvider() here
// would make a second container with its own AuthenticationService, which
// couldn't sign the real session out.
IServiceProvider? appServices = null;

builder.Services.AddMakerClient(builder.Configuration, onUnauthorized: async req =>
{
    if (appServices is null) return;

    // Sign out before going to /login: the handler only does so itself after
    // this returns (and not at all when the server answers 401), and /login
    // sends a still-signed-in visitor straight back home.
    await appServices.GetRequiredService<IAuthenticationService>().LogoutAsync();
    appServices.GetRequiredService<NavigationManager>().NavigateTo("/login");
});

// You can now inject these wherever you want (including GRPCConfigure)

var host = builder.Build();
appServices = host.Services;

// Fire-and-forget: business info is a nice-to-have CMS overlay, so it loads
// alongside the first render instead of gating it. Components subscribe to
// BusinessInfoService.OnChange and re-render if/when it lands.
_ = host.Services.GetRequiredService<BusinessInfoService>().EnsureLoadedAsync();

// Same for the product-type catalogue: every product page needs it, so start
// the (one) call now rather than when the visitor first clicks "Products".
// See ProductCatalogService for the stored-copy fallback that makes that
// page paint in the first frame on a refresh.
_ = host.Services.GetRequiredService<ProductCatalogService>().EnsureLoadedAsync();

await host.RunAsync();