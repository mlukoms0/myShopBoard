using myShopBoard.Domain.Records.Assets;
using myShopBoard.Domain.Records.Common;

namespace myShopBoard.Domain.Services;

/// <summary>
/// Takes and returns records where yard scoping and
/// permission checks live for auth.
/// </summary>
public interface IAssetService
{
    Task<PagedResult<AssetResponse>> SearchAsync(AssetQuery query, CancellationToken cancellationToken);

    /// <exception cref="KeyNotFoundException">No asset with that id. Maps to HTTP 404.</exception>
    Task<AssetResponse> GetByIdAsync(long id, CancellationToken cancellationToken);
}