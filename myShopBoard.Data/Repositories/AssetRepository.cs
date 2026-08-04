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