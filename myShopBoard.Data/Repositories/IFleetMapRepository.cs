using myShopBoard.Data.Entities;

namespace myShopBoard.Data.Repositories;

public interface IFleetMapRepository
{
    /// <summary>
    /// Every active asset with the yard, status, type and location needed to draw the map.
    /// One query, all zoom levels - see FleetMapResponse for why.
    /// </summary>
    Task<IReadOnlyList<Asset>> GetAllForMapAsync(CancellationToken cancellationToken);
}
