namespace myShopBoard.Data.Repositories;
/// <summary>
/// Querey paramaters for the data layer to fitler assets.
/// </summary>
 
public record AssetFilter
{
    public int Page { get; init; } = 1;
    public int Size { get; init; } = 50;
    public string? Search { get; init; }
    public long? YardId { get; init; }
    public long? AssetStatusId { get; init; }
    public long? AssetTypeId { get; init; }
    public string? Sort { get; init; }
}