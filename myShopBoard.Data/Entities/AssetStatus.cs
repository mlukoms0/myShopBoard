namespace myShopBoard.Data.Entities;
/// <summary>
/// shows the status of asset, and allows seasonal downtime and expected / unexpected downtime tracking.
/// </summary>
public class AssetStatus : BaseEntity
{
    public string Name { get; set; } = null!;

    public bool IsAvailable { get; set; }

    public bool IsInShop { get; set; }

    public bool IsPlannedDowntime { get; set; }

    public bool ExcludeFromAvailability { get; set;}
    public int SortOrder { get; set; }

    public string ColorHex { get; set; } = "#64748B";

    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
    

}