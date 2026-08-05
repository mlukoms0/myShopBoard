namespace myShopBoard.Domain.Records.Fleet;

/// <summary>
/// Everything the Overview map needs, in ONE request.
/// </summary>
/// <remarks>
/// Deliberately hierarchical - state, then yard, then unit - because that is exactly the
/// zoom sequence the globe walks through. Fetching it in one call means clicking a pin is
/// instant: no spinner between zoom levels, because the data for every level is already here.
///
/// This is affordable at fleet sizes in the hundreds. If it ever is not, the fix is to trim
/// the unit array at the top level and fetch units per-yard on demand.
/// </remarks>
public record FleetMapResponse(
    int TotalUnits,
    int AvailableUnits,
    int DownUnits,
    int ParkedUnits,
    IReadOnlyList<MapStateResponse> States);

public record MapStateResponse(
    string StateCode,
    string StateName,
    /// <summary>Average of this state's yard coordinates - the pin sits where you actually
    /// operate, not at the geographic centre of the state.</summary>
    decimal Latitude,
    decimal Longitude,
    int UnitCount,
    int AvailableCount,
    int DownCount,
    IReadOnlyList<MapYardResponse> Yards);

public record MapYardResponse(
    long YardId,
    string YardCode,
    string YardName,
    string? City,
    decimal? Latitude,
    decimal? Longitude,
    int UnitCount,
    int AvailableCount,
    int DownCount,
    IReadOnlyList<MapUnitResponse> Units);

public record MapUnitResponse(
    long AssetId,
    string UnitNumber,
    string AssetTypeName,
    string StatusName,
    string StatusColorHex,
    bool IsAvailable,
    bool ExcludeFromAvailability,
    decimal? Latitude,
    decimal? Longitude,
    /// <summary>manual | samsara | truckx | geotab | motive - lets the UI show "position is
    /// hand-entered" rather than implying a live GPS fix.</summary>
    string? LocationSource,
    DateTime? LocationRecordedAtUtc);
