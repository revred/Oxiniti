using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Maker.RampEdge.Configuration;
using Maker.RampEdge.Services.Contracts;
using Microsoft.Extensions.Options;

namespace Oxyniti.Services;

/// <summary>
/// The staff-only demo log behind Pages/MyDemos.razor: every pond demo a Maker
/// staff member has given, stored on the Maker API (/api/demo/*). The server
/// refuses anyone whose login is not flagged IsMakerAI.
///
/// Why this calls the API directly instead of IMakerClient's AddDemoAsync /
/// GetDemosAsync / UpdateDemoAsync / DeleteDemoAsync (Maker.RampEdgeV1 1.0.11):
///   - all four are declared to return StringReply, so the generated client
///     drops the DemoVisit / DemoListResponse the server actually sends -- the
///     demo list always comes back empty;
///   - DeleteDemo answers 204, which the client does not expect.
/// Switch to IMakerClient once the package declares the real response types.
///
/// Two values the API cannot hold yet ride in a small JSON trailer at the end
/// of Notes (see <see cref="DemoNotesMeta"/>), and are stripped back out on read:
///   - the staff member's name -- everyone signs in with one shared staff
///     account, so the server's GivenBy (the login email) cannot tell them apart;
///   - the exact map pin and DO readings -- the request types them as whole
///     numbers (long), which would move a pin by up to ~100 km and turn
///     4.5 mg/L into 4. The rounded values still go in the real fields.
/// </summary>
public sealed class StaffDemoService
{
    private readonly HttpClient _http;
    private readonly IAuthenticationService _auth;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString,
    };

    public StaffDemoService(IAuthenticationService auth, IOptions<RampEdgeSettings> settings)
    {
        _auth = auth;
        _http = new HttpClient { BaseAddress = new Uri(settings.Value.BaseAddress) };
        _http.DefaultRequestHeaders.Add("businessunitkey", settings.Value.BusinessUnitKey ?? "");
    }

    public async Task<List<StaffDemo>> GetDemosAsync()
    {
        var json = await PostAsync("api/demo/GetDemos", new { });
        var reply = JsonSerializer.Deserialize<DemoListWire>(json, JsonOptions);
        return (reply?.Demos ?? [])
            .Select(FromWire)
            .OrderByDescending(d => d.DemoDate)
            .ThenByDescending(d => d.Id)
            .ToList();
    }

    public Task AddDemoAsync(StaffDemoForm form, IReadOnlyList<DemoPhotoUpload> photos) =>
        PostAsync("api/demo/AddDemo", ToWire(form, photos, demoBarId: null));

    public Task UpdateDemoAsync(ulong demoBarId, StaffDemoForm form, IReadOnlyList<DemoPhotoUpload> photos) =>
        PostAsync("api/demo/UpdateDemo", ToWire(form, photos, demoBarId));

    public Task DeleteDemoAsync(ulong demoBarId) =>
        PostAsync("api/demo/DeleteDemo", new { demoBarID = demoBarId });

    private async Task<string> PostAsync(string route, object body)
    {
        var token = await _auth.GetAccessTokenAsync();
        if (string.IsNullOrEmpty(token))
            throw new StaffDemoException(StaffDemoError.NotSignedIn);

        using var request = new HttpRequestMessage(HttpMethod.Post, route)
        {
            Content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json"),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request);
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"[StaffDemoService] {route} failed: {ex.Message}");
            throw new StaffDemoException(StaffDemoError.Network);
        }

        using (response)
        {
            var text = await response.Content.ReadAsStringAsync();
            if (response.IsSuccessStatusCode) return text;

            Console.WriteLine($"[StaffDemoService] {route} answered {(int)response.StatusCode}: {text}");
            throw new StaffDemoException(response.StatusCode switch
            {
                HttpStatusCode.Unauthorized => StaffDemoError.NotSignedIn,
                HttpStatusCode.Forbidden => StaffDemoError.NotStaff,
                HttpStatusCode.NotFound => StaffDemoError.NotFound,
                _ => StaffDemoError.Server,
            });
        }
    }

    private static object ToWire(StaffDemoForm form, IReadOnlyList<DemoPhotoUpload> photos, ulong? demoBarId)
    {
        var meta = new DemoNotesMeta
        {
            By = form.GivenByName.Trim(),
            Lat = form.Latitude,
            Lng = form.Longitude,
            DoBefore = form.DoBefore,
            DoAfter = form.DoAfter,
        };
        var wire = new Dictionary<string, object?>
        {
            // Date-only: noon UTC stays on the same calendar day in every Indian time zone.
            ["demoDateUtc"] = DateTime.SpecifyKind(form.DemoDate.ToDateTime(new TimeOnly(12, 0)), DateTimeKind.Utc),
            ["place"] = form.Place.Trim(),
            ["district"] = form.District.Trim(),
            ["state"] = form.State.Trim(),
            ["latitude"] = Whole(form.Latitude),
            ["longitude"] = Whole(form.Longitude),
            ["farmerName"] = form.FarmerName.Trim(),
            ["farmerPhone"] = form.FarmerPhone.Trim(),
            ["species"] = form.Species.Trim(),
            ["pondSize"] = form.PondSize.Trim(),
            ["productUsed"] = form.ProductUsed.Trim(),
            ["doBefore"] = Whole(form.DoBefore),
            ["doAfter"] = Whole(form.DoAfter),
            ["outcome"] = form.Outcome.Trim(),
            ["notes"] = DemoNotesMeta.Append(form.Notes.Trim(), meta),
            ["videoUrl"] = string.IsNullOrWhiteSpace(form.VideoUrl) ? null : form.VideoUrl.Trim(),
            ["photos"] = photos.Select(p => new { fileBytes = p.Base64, fileName = p.FileName }).ToList(),
        };
        if (demoBarId is not null) wire["demoBarID"] = demoBarId.Value;
        return wire;
    }

    private static long? Whole(double? value) => value is null ? null : (long)Math.Round(value.Value, MidpointRounding.AwayFromZero);

    private static StaffDemo FromWire(DemoWire w)
    {
        var (notes, meta) = DemoNotesMeta.Split(w.Notes);
        // The server stores a missing pin / reading as 0, so 0 from the real
        // field means "not recorded" unless the trailer says otherwise.
        var lat = meta?.Lat ?? NonZero(w.Latitude);
        var lng = meta?.Lng ?? NonZero(w.Longitude);
        return new StaffDemo
        {
            Id = w.BarID,
            DemoDate = DateOnly.FromDateTime(w.DemoDateUtc.Kind == DateTimeKind.Local ? w.DemoDateUtc : w.DemoDateUtc.ToLocalTime()),
            Place = w.Place ?? "",
            District = w.District ?? "",
            State = w.State ?? "",
            Latitude = lat is not null && lng is not null ? lat : null,
            Longitude = lat is not null && lng is not null ? lng : null,
            FarmerName = w.FarmerName ?? "",
            FarmerPhone = w.FarmerPhone ?? "",
            Species = w.Species ?? "",
            PondSize = w.PondSize ?? "",
            ProductUsed = w.ProductUsed ?? "",
            DoBefore = meta is not null ? meta.DoBefore : NonZero(w.DoBefore),
            DoAfter = meta is not null ? meta.DoAfter : NonZero(w.DoAfter),
            Outcome = w.Outcome ?? "",
            Notes = notes,
            VideoUrl = w.VideoUrl ?? "",
            PhotoUrls = (w.Photos ?? []).Select(p => p.Url).Where(u => !string.IsNullOrWhiteSpace(u)).Cast<string>().ToList(),
            GivenByName = meta?.By ?? "",
            LoginEmail = w.GivenBy ?? "",
        };
    }

    private static double? NonZero(double? value) => value is null or 0 ? null : value;

    private sealed class DemoListWire
    {
        public List<DemoWire>? Demos { get; set; }
    }

    private sealed class DemoWire
    {
        public ulong BarID { get; set; }
        public DateTime DemoDateUtc { get; set; }
        public string? Place { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? FarmerName { get; set; }
        public string? FarmerPhone { get; set; }
        public string? Species { get; set; }
        public string? PondSize { get; set; }
        public string? ProductUsed { get; set; }
        public double? DoBefore { get; set; }
        public double? DoAfter { get; set; }
        public string? Outcome { get; set; }
        public string? Notes { get; set; }
        public string? VideoUrl { get; set; }
        public List<PhotoWire>? Photos { get; set; }
        public string? GivenBy { get; set; }
    }

    private sealed class PhotoWire
    {
        public string? Url { get; set; }
    }
}

/// <summary>
/// Values the demo API has no field for yet, kept as one machine-readable line
/// at the end of Notes: <c>[[oxyniti:{"by":"Fazil","lat":10.8051,...}]]</c>.
/// See <see cref="StaffDemoService"/> for why.
/// </summary>
public sealed class DemoNotesMeta
{
    [JsonPropertyName("by")] public string? By { get; set; }
    [JsonPropertyName("lat")] public double? Lat { get; set; }
    [JsonPropertyName("lng")] public double? Lng { get; set; }
    [JsonPropertyName("doBefore")] public double? DoBefore { get; set; }
    [JsonPropertyName("doAfter")] public double? DoAfter { get; set; }

    private static readonly Regex Trailer = new(@"\s*\[\[oxyniti:(\{.*\})\]\]\s*$", RegexOptions.Singleline);

    private static readonly JsonSerializerOptions Options = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static string Append(string notes, DemoNotesMeta meta)
    {
        var line = "[[oxyniti:" + JsonSerializer.Serialize(meta, Options) + "]]";
        return string.IsNullOrEmpty(notes) ? line : notes + "\n\n" + line;
    }

    public static (string Notes, DemoNotesMeta? Meta) Split(string? notes)
    {
        if (string.IsNullOrEmpty(notes)) return ("", null);
        var match = Trailer.Match(notes);
        if (!match.Success) return (notes, null);
        try
        {
            var meta = JsonSerializer.Deserialize<DemoNotesMeta>(match.Groups[1].Value, Options);
            return (notes[..match.Index], meta);
        }
        catch (JsonException)
        {
            return (notes, null);
        }
    }
}

public sealed class StaffDemo
{
    public ulong Id { get; init; }
    public DateOnly DemoDate { get; init; }
    public string Place { get; init; } = "";
    public string District { get; init; } = "";
    public string State { get; init; } = "";
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }
    public string FarmerName { get; init; } = "";
    public string FarmerPhone { get; init; } = "";
    public string Species { get; init; } = "";
    public string PondSize { get; init; } = "";
    public string ProductUsed { get; init; } = "";
    public double? DoBefore { get; init; }
    public double? DoAfter { get; init; }
    public string Outcome { get; init; } = "";
    public string Notes { get; init; } = "";
    public string VideoUrl { get; init; } = "";
    public List<string> PhotoUrls { get; init; } = [];
    /// <summary>The name typed in "Demo given by". Empty for a demo saved outside this page.</summary>
    public string GivenByName { get; init; } = "";
    /// <summary>The login that saved it (the server's GivenBy) -- the shared staff account today.</summary>
    public string LoginEmail { get; init; } = "";

    public bool HasLocation => Latitude is not null && Longitude is not null;

    public string GivenByDisplay => !string.IsNullOrWhiteSpace(GivenByName) ? GivenByName : LoginEmail;

    public string PlaceLine => string.Join(", ", new[] { Place, District, State }.Where(s => !string.IsNullOrWhiteSpace(s)));

    public static string FormatDo(double value) => value.ToString("0.##", CultureInfo.InvariantCulture);
}

public sealed class StaffDemoForm
{
    public DateOnly DemoDate { get; set; } = DateOnly.FromDateTime(DateTime.Now);
    public string GivenByName { get; set; } = "";
    public string Place { get; set; } = "";
    public string District { get; set; } = "";
    public string State { get; set; } = "";
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string FarmerName { get; set; } = "";
    public string FarmerPhone { get; set; } = "";
    public string Species { get; set; } = "";
    public string PondSize { get; set; } = "";
    public string ProductUsed { get; set; } = "Oxyniti nano-bubble unit";
    public double? DoBefore { get; set; }
    public double? DoAfter { get; set; }
    public string Outcome { get; set; } = "";
    public string Notes { get; set; } = "";
    public string VideoUrl { get; set; } = "";

    public static StaffDemoForm From(StaffDemo d) => new()
    {
        DemoDate = d.DemoDate,
        GivenByName = d.GivenByName,
        Place = d.Place,
        District = d.District,
        State = d.State,
        Latitude = d.Latitude,
        Longitude = d.Longitude,
        FarmerName = d.FarmerName,
        FarmerPhone = d.FarmerPhone,
        Species = d.Species,
        PondSize = d.PondSize,
        ProductUsed = d.ProductUsed,
        DoBefore = d.DoBefore,
        DoAfter = d.DoAfter,
        Outcome = d.Outcome,
        Notes = d.Notes,
        VideoUrl = d.VideoUrl,
    };
}

public sealed record DemoPhotoUpload(string FileName, string Base64);

public enum StaffDemoError { NotSignedIn, NotStaff, NotFound, Network, Server }

public sealed class StaffDemoException(StaffDemoError error) : Exception(error.ToString())
{
    public StaffDemoError Error { get; } = error;
}
