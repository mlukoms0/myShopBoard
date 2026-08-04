namespace myShopBoard.Data.Entities;
/// <summary>
/// Asset type being tracked. Currently Supports tractor / trailer (dryvan,reefer,flatbed), dump trucks, etc. All metered readings, service records, work orders are attached to AssetTypeId.
/// </summary>
public class AssetType : BaseEntity
{
    
    public string Name { get; set;} = null!;

    public bool RequiresDotAnnual { get; set; } 

    public string DefaultPrimaryMeterUnit { get; set; } = MeterUnits.Miles;

    public string? DefaultSecondaryMeterUnit { get; set; } = MeterUnits.Hours;

    public ICollection<Asset> Assets { get; set; } = new List<Asset>();

}