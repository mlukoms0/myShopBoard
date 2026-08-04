using myShopBoard.Data.Repositories;
using myShopBoard.Domain.Mappers;
using myShopBoard.Domain.Records.Assets;
using myShopBoard.Domain.Records.Common;

namespace myShopBoard.Domain.Services;

/// <param name="assets"></param>

public class AssetService(IAssetRepository assets) : IAssetService
{
    public async Task<PagedResult<AssetResponse>> SearchAsync(AssetQuery query, CancellationToken cancellationToken)
    {
        // TODO(auth): once ICurrentUserScope exists, force filter.YardId to the caller's yard
        // for non-admin roles. This method is the ONLY place that should decide that.
        var filter = new AssetFilter
        {
            Page = query.Page,
            Size = query.Size,
            Search = query.Search,
            YardId = query.YardId,
            AssetStatusId = query.AssetStatusId,
            AssetTypeId = query.AssetTypeId,
            Sort = query.Sort,
        };

        var (items, totalCount) = await assets.SearchAsync(filter, cancellationToken);

        return new PagedResult<AssetResponse>(
            items.Select(AssetMapper.ToResponse).ToList(),
            totalCount,
            Math.Max(1, query.Page),
            Math.Clamp(query.Size, 1, 200));
    }

    public async Task<AssetResponse> GetByIdAsync(long id, CancellationToken cancellationToken)
    {
        var asset = await assets.GetByIdAsync(id, cancellationToken)
                    ?? throw new KeyNotFoundException($"No unit found with id {id}.");

        return AssetMapper.ToResponse(asset);
    }
}