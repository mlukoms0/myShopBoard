namespace myShopBoard.Data.Entities;
/// <summary>
/// A physical yard or shop or terminal. An Asset belongs to a yard
/// </summary>
public class Yard : BaseEntity
{
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? Address { get; set; }

    public string? address2 { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string? ZipCode { get; set; }

    public string? Country { get; set; }

    public string? PhoneNumber { get; set; }

    public string? Code { get; set; } = null!;

    /// <summary>
    /// Yard position in decimal degrees, WGS84. Nullable because a yard can exist before
    /// anyone has looked up its coordinates - it simply will not appear on the map.
    /// Precision is pinned to (9,6) in the configuration; the global decimal convention of
    /// (18,2) would round longitude to two places, roughly a kilometre of error.
    /// </summary>
    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
}