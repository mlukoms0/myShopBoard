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

    public bool IsActive { get; set; } = true;

    public ICollection<Asset> Assets { get; set; } = new List<Asset>();
}