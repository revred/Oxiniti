using Microsoft.JSInterop;
using System.Text.Json;

namespace Oxyniti.Services;

// Demo bookings aren't persisted server-side yet (no such API exists on
// IMakerClient) — this keeps them in localStorage as a placeholder until a
// real backend lands. See FreeDemoSection.razor and Pages/MyDemos.razor.
public class DemoService(IJSRuntime jsRuntime)
{
    private readonly IJSRuntime _jsRuntime = jsRuntime;
    private const string StorageKey = "oxyniti_demos";

    public event Action? OnChange;

    private void NotifyStateChanged() => OnChange?.Invoke();

    public async Task<List<DemoBooking>> GetDemos()
    {
        var json = await _jsRuntime.InvokeAsync<string>("localStorage.getItem", StorageKey);
        if (string.IsNullOrEmpty(json))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<DemoBooking>>(json) ?? [];
        }
        catch (JsonException)
        {
            await _jsRuntime.InvokeVoidAsync("localStorage.removeItem", StorageKey);
            return [];
        }
    }

    public async Task AddDemo(DemoBooking demo)
    {
        var demos = await GetDemos();
        demos.Add(demo);
        await SaveDemos(demos);
        NotifyStateChanged();
    }

    private async Task SaveDemos(List<DemoBooking> demos)
    {
        var json = JsonSerializer.Serialize(demos);
        await _jsRuntime.InvokeVoidAsync("localStorage.setItem", StorageKey, json);
    }
}
