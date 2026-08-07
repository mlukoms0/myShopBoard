using System.ComponentModel.DataAnnotations;

namespace myShopBoard.Domain.Records.Assets;

/// <summary>
/// What the API returns for one unit. Asset DTO subset of asset entity.
/// </summary>


public record AssetResponse(
    long Id,
    string UnitNumber,
    string? Vin,
    string AssetTypeName,
    string StatusName,
    string StatusColorHex,
    bool IsAvailable,

    bool IsInShop,
    bool ExcludeFromAvailability,
    int StatusSortOrder,

    long YardId,
    string YardCode,
    string YardName,
    int? Year,
    string? Make,
    string? Model,
    string? LicensePlate,
    decimal? CurrentPrimaryMeter,
    string PrimaryMeterUnit,
    decimal? CurrentSecondaryMeter,
    string? SecondaryMeterUnit,
    DateTime? CurrentMeterAsOfUtc,
    DateOnly? InServiceDate,
    DateOnly? OutOfServiceDate,
    string? Color,
    string? RegistrationNumber,
    DateTime? RegistrationExpiresAtUtc,
    DateTime? DotExpiresAtUtc,
    DateTime? InsuranceExpiresAtUtc,
    DateTime? DateAcquiredUtc);


public record LookupItem(long Id, string Name);

/// <summary>Dropdown sources for the Add Unit form.</summary>
public record AssetLookupsResponse(
    IReadOnlyList<LookupItem> AssetTypes,
    IReadOnlyList<LookupItem> AssetStatuses,
    IReadOnlyList<LookupItem> Yards);


public record CreateAssetRequest
{
    [Required, MaxLength(30)]
    public string UnitNumber { get; init; } = null!;

    [Range(1, long.MaxValue)]
    public long AssetTypeId { get; init; }

    [Range(1, long.MaxValue)]
    public long AssetStatusId { get; init; }

    [Range(1, long.MaxValue)]
    public long YardId { get; init; }

    [MaxLength(17)]
    public string? Vin { get; init; }

    [Range(1900, 2100)]
    public int? Year { get; init; }

    [MaxLength(50)] public string? Make { get; init; }
    [MaxLength(50)] public string? Model { get; init; }
    [MaxLength(20)] public string? LicensePlate { get; init; }
}


public record AssetQuery
{
    [Range(1, int.MaxValue)]
    public int Page { get; init; } = 1;

    [Range(1, 200)]
    public int Size { get; init; } = 50;

    [MaxLength(100)]
    public string? Search { get; init; }

    public long? YardId { get; init; }

    public long? AssetStatusId { get; init; }

    public long? AssetTypeId { get; init; }

    /// <summary>Format "column:asc" or "column:desc".</summary>
    [MaxLength(40)]
    public string? Sort { get; init; } = "unitNumber:asc";
}
