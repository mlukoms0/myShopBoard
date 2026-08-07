using Microsoft.EntityFrameworkCore;
using myShopBoard.Data.Entities;

namespace myShopBoard.Data.Repositories;

public class AssetRepository(ShopBoardDbContext db) : IAssetRepository
{
    private const int MaxPageSize = 200;

    public async Task<(IReadOnlyList<Asset> Items, int TotalCount)> SearchAsync(
        AssetFilter filter,
        CancellationToken cancellationToken)
    {
        var query =  db.Assets
            .AsNoTracking()
            .Include(a => a.AssetType)
            .Include(a => a.AssetStatus)
            .Include(a => a.Yard)
            .AsQueryable();

         if (filter.YardId is { } yardId)
        {
            query = query.Where(a => a.YardId == yardId);
        }

        if (filter.AssetStatusId is { } statusId)
        {
            query = query.Where(a => a.AssetStatusId == statusId);
        }

        if (filter.AssetTypeId is { } typeId)
        {
            query = query.Where(a => a.AssetTypeId == typeId);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = $"%{filter.Search.Trim()}%";
            query = query.Where(a =>
                EF.Functions.ILike(a.UnitNumber, term) ||
                (a.Vin != null && EF.Functions.ILike(a.Vin, term)) ||
                (a.Make != null && EF.Functions.ILike(a.Make, term)) ||
                (a.Model != null && EF.Functions.ILike(a.Model, term)) ||
                (a.LicensePlate != null && EF.Functions.ILike(a.LicensePlate, term)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = ApplySort(query, filter.Sort);

        var page = Math.Max(1, filter.Page);
        var size = Math.Clamp(filter.Size, 1, MaxPageSize);

        var items = await query
            .Skip((page - 1) * size)
            .Take(size)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Asset?> GetByIdAsync(long id, CancellationToken cancellationToken) =>
        db.Assets
          .AsNoTracking()
          .Include(a => a.AssetType)
          .Include(a => a.AssetStatus)
          .Include(a => a.Yard)
          .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public async Task<Asset> AddAsync(Asset asset, CancellationToken cancellationToken)
    {
        db.Assets.Add(asset);
        await db.SaveChangesAsync(cancellationToken);

        // Insert only populates the foreign keys; load navigations so the caller can map a
        // full response without a second round trip.
        await db.Entry(asset).Reference(a => a.AssetType).LoadAsync(cancellationToken);
        await db.Entry(asset).Reference(a => a.AssetStatus).LoadAsync(cancellationToken);
        await db.Entry(asset).Reference(a => a.Yard).LoadAsync(cancellationToken);

        return asset;
    }

    public async Task<bool> ArchiveAsync(long id, CancellationToken cancellationToken)
    {
        // Tracked, unlike the read paths - EF needs to see the change to write it.
        // The global query filter means an already-archived asset is not found, so a repeat
        // delete returns 404 rather than silently succeeding.
        var asset = await db.Assets.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (asset is null) return false;

        asset.ArchivedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public Task<bool> UnitNumberExistsAsync(string unitNumber, CancellationToken cancellationToken) =>
        db.Assets.AnyAsync(a => a.UnitNumber == unitNumber, cancellationToken);

    public async Task<(IReadOnlyList<AssetType> Types, IReadOnlyList<AssetStatus> Statuses, IReadOnlyList<Yard> Yards)>
        GetLookupsAsync(CancellationToken cancellationToken)
    {
        var types = await db.AssetTypes.AsNoTracking().OrderBy(t => t.Name).ToListAsync(cancellationToken);
        var statuses = await db.AssetStatus.AsNoTracking().OrderBy(s => s.SortOrder).ToListAsync(cancellationToken);
        var yards = await db.Yards.AsNoTracking().Where(y => y.IsActive).OrderBy(y => y.Name).ToListAsync(cancellationToken);

        return (types, statuses, yards);
    }

    /// <summary>
    /// Parses "column:asc|desc" from the client into a hard-coded switch.
    /// NEVER build order-by SQL from a raw client string - that is a SQL injection hole.
    /// Unknown values fall back to unit number rather than throwing.
    /// </summary>
    private static IQueryable<Asset> ApplySort(IQueryable<Asset> query, string? sort)
    {
        var parts = (sort ?? "unitNumber:asc").Split(':', 2);
        var column = parts[0].Trim();
        var descending = parts.Length > 1 && parts[1].Trim().Equals("desc", StringComparison.OrdinalIgnoreCase);

        return column.ToLowerInvariant() switch
        {
            "status"   => descending ? query.OrderByDescending(a => a.AssetStatus.SortOrder).ThenBy(a => a.Id)
                                     : query.OrderBy(a => a.AssetStatus.SortOrder).ThenBy(a => a.Id),
            "type"     => descending ? query.OrderByDescending(a => a.AssetType.Name).ThenBy(a => a.Id)
                                     : query.OrderBy(a => a.AssetType.Name).ThenBy(a => a.Id),
            "yard"     => descending ? query.OrderByDescending(a => a.Yard.Code).ThenBy(a => a.Id)
                                     : query.OrderBy(a => a.Yard.Code).ThenBy(a => a.Id),
            "meter"    => descending ? query.OrderByDescending(a => a.CurrentPrimaryMeter).ThenBy(a => a.Id)
                                     : query.OrderBy(a => a.CurrentPrimaryMeter).ThenBy(a => a.Id),
            "year"     => descending ? query.OrderByDescending(a => a.Year).ThenBy(a => a.Id)
                                     : query.OrderBy(a => a.Year).ThenBy(a => a.Id),
            _          => descending ? query.OrderByDescending(a => a.UnitNumber).ThenBy(a => a.Id)
                                     : query.OrderBy(a => a.UnitNumber).ThenBy(a => a.Id),
        };
    } 
} 