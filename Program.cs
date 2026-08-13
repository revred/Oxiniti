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
builder.Services.AddSingleton<BusinessInfoService>();
builder.Services.AddSingleton<LocalizationService>();
builder.Services.AddOptions<StripeSettings>()
    .BindConfiguration("Stripe");
builder.Services.AddOptions<RampEdgeSettings>()
    .BindConfiguration(RampEdgeSettings.SectionName);


builder.Services.AddMakerClient(builder.Configuration, onUnauthorized: async req =>
{
    // when onUnauthorized, go to login page
    var nav = builder.Services.BuildServiceProvider().GetRequiredService<NavigationManager>();
    nav.NavigateTo("/login");
    await Task.CompletedTask;
});

// You can now inject these wherever you want (including GRPCConfigure)

await builder.Build().RunAsync();