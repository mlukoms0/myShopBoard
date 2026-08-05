using Microsoft.EntityFrameworkCore;
using myShopBoard.Data.Entities;

namespace myShopBoard.Data.Repositories;

public class FleetMapRepository(ShopBoardDbContext db) : IFleetMapRepository
{
    public async Task<IReadOnlyList<Asset>> GetAllForMapAsync(CancellationToken cancellationToken)
    {
        // AsSplitQuery: four Includes on one root would produce a cartesian explosion in a
        // single SQL statement. EF issues separate queries and stitches them, which is both
        // faster and avoids duplicated rows inflating the result set.
        return await db.Assets
            .AsNoTracking()
            .AsSplitQuery()
            .Include(a => a.Yard)
            .Include(a => a.AssetStatus)
            .Include(a => a.AssetType)
            .Include(a => a.Location)
            .OrderBy(a => a.UnitNumber)
            .ToListAsync(cancellationToken);
    }
}
