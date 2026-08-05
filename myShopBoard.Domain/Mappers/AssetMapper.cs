using myShopBoard.Data.Entities;
using myShopBoard.Domain.Records.Assets;

namespace myShopBoard.Domain.Mappers;

/// <summary>
/// hand written mapper for assets entity to asset response
/// </summary>


public static class AssetMapper
{
    public static AssetResponse ToResponse(Asset a) => new(
        a.Id,
        a.UnitNumber,
        a.Vin,
        a.AssetType.Name,
        a.AssetStatus.Name,
        a.AssetStatus.ColorHex,
        a.AssetStatus.IsAvailable,
        a.AssetStatus.IsInShop,
        a.AssetStatus.ExcludeFromAvailability,
        a.AssetStatus.SortOrder,
        a.YardId,
        a.Yard.Code,
        a.Yard.Name,
        a.Year,
        a.Make,
        a.Model,
        a.LicensePlate,
        a.CurrentPrimaryMeter,
        a.PrimaryMeterUnit,
        a.CurrentSecondaryMeter,
        a.SecondaryMeterUnit,
        a.CurrentMeterAsOfUtc,
        a.InServiceDate);
}