namespace myShopBoard.Data.Entities;

/// <summary>
/// Where a unit currently is. ONE row per asset - this is a current position, not a track.
/// </summary>
/// <remarks>
/// Designed to take manual coordinates today and telematics tomorrow WITHOUT a schema change.
/// A Samsara/TruckX/Geotab poller upserts the same row and sets <see cref="Source"/>; nothing
/// downstream cares where the numbers came from.
///
/// Purging the hand-seeded rows later is one statement:
///   DELETE FROM "AssetLocations" WHERE "Source" = 'manual';
///
/// A location HISTORY table (breadcrumb trail) is deliberately not built. It is a different
/// shape - append-only, high volume, time-series - and nothing needs it yet.
/// </remarks>
public class AssetLocation : BaseEntity
{
    public long AssetId { get; set; }
    public Asset Asset { get; set; } = null!;

    /// <summary>Decimal degrees, WGS84. Precision (9,6) is roughly 0.1 m - see the configuration.</summary>
    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    /// <summary>When the position was true, NOT when the row was written.</summary>
    public DateTime RecordedAtUtc { get; set; }

    /// <summary>
    /// Where this came from: manual | samsara | truckx | geotab | motive.
    /// Deliberately a string, not an enum: adding a provider must not require a migration.
    /// </summary>
    public string Source { get; set; } = LocationSources.Manual;

    /// <summary>The provider's own id for the vehicle, so a poller can reconcile without guessing.</summary>
    public string? ExternalRef { get; set; }
}

/// <summary>Known values for <see cref="AssetLocation.Source"/>.</summary>
public static class LocationSources
{
    public const string Manual = "manual";
    public const string Samsara = "samsara";
    public const string TruckX = "truckx";
    public const string Geotab = "geotab";
    public const string Motive = "motive";
}
