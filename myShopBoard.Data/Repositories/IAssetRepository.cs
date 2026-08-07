using myShopBoard.Data.Entities;

namespace myShopBoard.Data.Repositories;
/// <summary>
/// Runs Queries. Auth unaware.
/// </summary> 

public interface IAssetRepository
{
    Task<(IReadOnlyList<Asset> Items, int TotalCount)> SearchAsync(AssetFilter filter, CancellationToken cancellationToken);

    Task<Asset?> GetByIdAsync(long id, CancellationToken cancellationToken);

    Task<Asset> AddAsync(Asset asset, CancellationToken cancellationToken);

    /// <summary>Soft delete. Returns false if no live asset has that id.</summary>
    Task<bool> ArchiveAsync(long id, CancellationToken cancellationToken);

    Task<bool> UnitNumberExistsAsync(string unitNumber, CancellationToken cancellationToken);

    Task<(IReadOnlyList<AssetType> Types, IReadOnlyList<AssetStatus> Statuses, IReadOnlyList<Yard> Yards)>
        GetLookupsAsync(CancellationToken cancellationToken);
}