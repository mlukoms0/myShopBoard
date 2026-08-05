namespace myShopBoard.Data.Entities;
/// <summary>
///  Asset / Unit object. 
/// </summary>
public class Asset : BaseEntity
{
    public string UnitNumber { get; set; } = null!;


    /// <summary>
    /// 128 bit random token printed into QR sticker for tracking. Not an ID
    /// </summary>
    public string QrToken { get; set; } = null!;
    public DateTime? QrTokenRotatedAtUtc { get; set; }

    public long AssetStatusId { get; set; }
    public AssetStatus AssetStatus { get; set; } = null!;


    public string? Vin { get; set; }
    public long AssetTypeId { get; set;}
    public AssetType AssetType { get; set;} = null!;

    public long YardId { get; set; }
    public Yard Yard { get; set; } = null!;

    public int? Year { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public string? Color { get; set; }
    public string? LicensePlate { get; set; }
    public string? RegistrationNumber { get; set; }
    public DateTime? RegistrationExpiresAtUtc { get; set; }
    public DateTime? DotExpiresAtUtc { get; set; }
    public DateTime? InsuranceExpiresAtUtc { get; set; }
   public DateTime? DateAquriedUtc { get; set; }
    public DateTime? DateSoldUtc { get; set; }
    
    /// <summary>
    /// Hours is the standard secondary meter unit.
    /// </summary>
    public string PrimaryMeterUnit { get; set; } = MeterUnits.Miles;
    public string? SecondaryMeterUnit { get; set; } = MeterUnits.Hours;
    public decimal? CurrentPrimaryMeter { get; set; }
    public decimal? CurrentSecondaryMeter { get; set; }

    public DateTime? CurrentMeterAsOfUtc { get; set; }
    public DateOnly? InServiceDate { get; set; }
    public DateOnly? OutOfServiceDate { get; set; }
    

    /// <summary>
    /// Always soft delete. maintenance records requried. 49 CFR 396.3(c) requires maintenance records for 1 year in service and 6 months out of service.
    /// </summary>
    public DateTime? ArchivedAtUtc { get; set; }

    /// <summary>
    /// Current position, if known. Null until someone seeds a coordinate or a telematics
    /// provider reports one - a unit with no location simply does not appear on the map.
    /// </summary>
    public AssetLocation? Location { get; set; }


    

    
}