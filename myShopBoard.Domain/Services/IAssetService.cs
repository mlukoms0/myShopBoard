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

    Task<AssetLookupsResponse> GetLookupsAsync(CancellationToken cancellationToken);

    /// <exception cref="InvalidOperationException">Unit number already exists. Maps to HTTP 409.</exception>
    Task<AssetResponse> CreateAsync(CreateAssetRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Soft delete. Never a hard delete: 49 CFR 396.3(c) requires maintenance records for
    /// 1 year in service plus 6 months after the vehicle leaves the carrier's control.
    /// </summary>
    /// <exception cref="KeyNotFoundException">No live asset with that id. Maps to HTTP 404.</exception>
    Task ArchiveAsync(long id, CancellationToken cancellationToken);
}