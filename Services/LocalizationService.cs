using System.Net.Http.Json;
using Microsoft.JSInterop;

namespace Oxyniti.Services;

public class LocalizationService(IJSRuntime jsRuntime, HttpClient httpClient)
{
    private readonly IJSRuntime _jsRuntime = jsRuntime;
    private readonly HttpClient _httpClient = httpClient;

    private const string StorageKey = "oxyniti-lang";

    public static readonly (string Code, string Native)[] Languages =
    [
        ("en", "English"),
        ("ta", "தமிழ்"),
        ("kn", "ಕನ್ನಡ"),
        ("te", "తెలుగు"),
        ("ml", "മലയാളം"),
        ("hi", "हिन्दी"),
        ("bn", "বাংলা"),
    ];

    private Dictionary<string, Dictionary<string, string>> _translations = [];
    private bool _initialized;

    public string CurrentLanguage { get; private set; } = "en";

    public event Action? OnChange;

    public async Task InitializeAsync()
    {
        if (_initialized) return;
        _initialized = true;

        try
        {
            _translations = await _httpClient.GetFromJsonAsync<Dictionary<string, Dictionary<string, string>>>("i18n/translations.json") ?? [];
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LocalizationService] Error loading translations: {ex}");
        }

        string? saved = null;
        try
        {
            saved = await _jsRuntime.InvokeAsync<string>("localStorage.getItem", StorageKey);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LocalizationService] Error reading saved language: {ex}");
        }

        if (!string.IsNullOrEmpty(saved) && (saved == "en" || _translations.ContainsKey(saved)))
        {
            CurrentLanguage = saved;
            OnChange?.Invoke();
        }
    }

    public string T(string key, string fallback)
    {
        if (CurrentLanguage != "en" &&
            _translations.TryGetValue(CurrentLanguage, out var dict) &&
            dict.TryGetValue(key, out var value))
        {
            return value;
        }

        return fallback;
    }

    public async Task SetLanguageAsync(string code)
    {
        if (code != "en" && !_translations.ContainsKey(code)) return;
        if (code == CurrentLanguage) return;

        CurrentLanguage = code;

        try
        {
            await _jsRuntime.InvokeVoidAsync("localStorage.setItem", StorageKey, code);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LocalizationService] Error saving language: {ex}");
        }

        OnChange?.Invoke();
    }
}
