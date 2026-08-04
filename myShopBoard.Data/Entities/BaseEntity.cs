namespace myShopBoard.Data.Entities;

///<summary>
///    Base class for all entities in the system. Provides a unique identifier and common properties.
///</summary>
public abstract class BaseEntity
{
    public long Id { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public string? CreatedByUserId { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public string? UpdatedByUserId { get; set; }
}