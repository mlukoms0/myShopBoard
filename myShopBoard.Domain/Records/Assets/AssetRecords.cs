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
    DateOnly? InServiceDate);



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
