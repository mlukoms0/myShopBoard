using myShopBoard.Data.Entities;
using myShopBoard.Data.Repositories;
using myShopBoard.Domain.Records.Fleet;

namespace myShopBoard.Domain.Services;

/// <summary>
/// Builds the state → yard → unit hierarchy the Overview map walks through.
/// </summary>
public class FleetMapService(IFleetMapRepository fleetMap) : IFleetMapService
{
    public async Task<FleetMapResponse> GetMapAsync(CancellationToken cancellationToken)
    {
        // TODO(auth): once ICurrentUserScope exists, filter to the caller's yards here.
        var assets = await fleetMap.GetAllForMapAsync(cancellationToken);

        var states = assets
            // A yard with no state cannot be placed on a map. Grouped out rather than
            // silently dropped from the counts - see UnplacedUnits below if that becomes an issue.
            .Where(a => !string.IsNullOrWhiteSpace(a.Yard.State))
            .GroupBy(a => a.Yard.State!.Trim().ToUpperInvariant())
            .Select(BuildState)
            .OrderByDescending(s => s.UnitCount)
            .ToList();

        return new FleetMapResponse(
            TotalUnits: assets.Count,
            AvailableUnits: assets.Count(a => a.AssetStatus.IsAvailable),
            DownUnits: assets.Count(a => !a.AssetStatus.IsAvailable && !a.AssetStatus.ExcludeFromAvailability),
            ParkedUnits: assets.Count(a => a.AssetStatus.ExcludeFromAvailability),
            States: states);
    }

    private static MapStateResponse BuildState(IGrouping<string, Asset> group)
    {
        var yards = group
            .GroupBy(a => a.Yard)
            .Select(BuildYard)
            .OrderByDescending(y => y.UnitCount)
            .ToList();

        // The state pin sits at the AVERAGE of its yards' coordinates rather than the state's
        // geographic centre. A pin in the middle of Texas when both yards are on the coast
        // would be technically correct and practically useless.
        var placed = yards.Where(y => y.Latitude.HasValue && y.Longitude.HasValue).ToList();

        var latitude = placed.Count > 0 ? placed.Average(y => y.Latitude!.Value) : 0m;
        var longitude = placed.Count > 0 ? placed.Average(y => y.Longitude!.Value) : 0m;

        return new MapStateResponse(
            StateCode: group.Key,
            StateName: UsStates.NameFor(group.Key),
            Latitude: latitude,
            Longitude: longitude,
            UnitCount: group.Count(),
            AvailableCount: group.Count(a => a.AssetStatus.IsAvailable),
            DownCount: group.Count(a => !a.AssetStatus.IsAvailable && !a.AssetStatus.ExcludeFromAvailability),
            Yards: yards);
    }

    private static MapYardResponse BuildYard(IGrouping<Yard, Asset> group)
    {
        var yard = group.Key;

        return new MapYardResponse(
            YardId: yard.Id,
            YardCode: yard.Code ?? string.Empty,
            YardName: yard.Name,
            City: yard.City,
            Latitude: yard.Latitude,
            Longitude: yard.Longitude,
            UnitCount: group.Count(),
            AvailableCount: group.Count(a => a.AssetStatus.IsAvailable),
            DownCount: group.Count(a => !a.AssetStatus.IsAvailable && !a.AssetStatus.ExcludeFromAvailability),
            Units: [.. group.Select(BuildUnit).OrderBy(u => u.UnitNumber)]);
    }

    private static MapUnitResponse BuildUnit(Asset a) => new(
        AssetId: a.Id,
        UnitNumber: a.UnitNumber,
        AssetTypeName: a.AssetType.Name,
        StatusName: a.AssetStatus.Name,
        StatusColorHex: a.AssetStatus.ColorHex,
        IsAvailable: a.AssetStatus.IsAvailable,
        ExcludeFromAvailability: a.AssetStatus.ExcludeFromAvailability,
        // Fall back to the yard's position when a unit has no location of its own, so a truck
        // still appears on the map - it is at its yard as far as anyone knows.
        Latitude: a.Location?.Latitude ?? a.Yard.Latitude,
        Longitude: a.Location?.Longitude ?? a.Yard.Longitude,
        LocationSource: a.Location?.Source,
        LocationRecordedAtUtc: a.Location?.RecordedAtUtc);
}

/// <summary>
/// US state and territory names. Falls back to the code itself for anything unrecognised, so
/// a typo in the data shows up as "XX" on screen rather than throwing.
/// </summary>
internal static class UsStates
{
    private static readonly Dictionary<string, string> Names = new(StringComparer.OrdinalIgnoreCase)
    {
        ["AL"] = "Alabama",      ["AK"] = "Alaska",        ["AZ"] = "Arizona",      ["AR"] = "Arkansas",
        ["CA"] = "California",   ["CO"] = "Colorado",      ["CT"] = "Connecticut",  ["DE"] = "Delaware",
        ["DC"] = "District of Columbia",
        ["FL"] = "Florida",      ["GA"] = "Georgia",       ["HI"] = "Hawaii",       ["ID"] = "Idaho",
        ["IL"] = "Illinois",     ["IN"] = "Indiana",       ["IA"] = "Iowa",         ["KS"] = "Kansas",
        ["KY"] = "Kentucky",     ["LA"] = "Louisiana",     ["ME"] = "Maine",        ["MD"] = "Maryland",
        ["MA"] = "Massachusetts",["MI"] = "Michigan",      ["MN"] = "Minnesota",    ["MS"] = "Mississippi",
        ["MO"] = "Missouri",     ["MT"] = "Montana",       ["NE"] = "Nebraska",     ["NV"] = "Nevada",
        ["NH"] = "New Hampshire",["NJ"] = "New Jersey",    ["NM"] = "New Mexico",   ["NY"] = "New York",
        ["NC"] = "North Carolina",["ND"] = "North Dakota", ["OH"] = "Ohio",         ["OK"] = "Oklahoma",
        ["OR"] = "Oregon",       ["PA"] = "Pennsylvania",  ["RI"] = "Rhode Island", ["SC"] = "South Carolina",
        ["SD"] = "South Dakota", ["TN"] = "Tennessee",     ["TX"] = "Texas",        ["UT"] = "Utah",
        ["VT"] = "Vermont",      ["VA"] = "Virginia",      ["WA"] = "Washington",   ["WV"] = "West Virginia",
        ["WI"] = "Wisconsin",    ["WY"] = "Wyoming",       ["PR"] = "Puerto Rico",
    };

    public static string NameFor(string code) =>
        Names.TryGetValue(code, out var name) ? name : code;
}
