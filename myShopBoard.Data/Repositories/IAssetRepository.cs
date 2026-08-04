using myShopBoard.Data.Entities;

namespace myShopBoard.Data.Repositories;
/// <summary>
/// Runs Queries. Auth unaware.
/// </summary> 

public interface IAssetRepository
{
    Task<(IReadOnlyList<Asset> Items, int TotalCount)> SearchAsync(AssetFilter filter, CancellationToken cancellationToken);

    Task<Asset?> GetByIdAsync(long id, CancellationToken cancellationToken);
}