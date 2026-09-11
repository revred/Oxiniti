using Oxyniti;
using Oxyniti.Configuration;
using Oxyniti.Services;
using Maker.RampEdge.Configuration;
using Maker.RampEdge.Extensions;
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
builder.Services.AddSingleton<DemoService>();
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


builder.Services.AddMakerClient(builder.Configuration, onUnauthorized: async req =>
{
    // when onUnauthorized, go to login page
    var nav = builder.Services.BuildServiceProvider().GetRequiredService<NavigationManager>();
    nav.NavigateTo("/login");
    await Task.CompletedTask;
});

// You can now inject these wherever you want (including GRPCConfigure)

var host = builder.Build();

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