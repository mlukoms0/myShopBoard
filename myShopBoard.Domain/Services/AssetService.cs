using System.Security.Cryptography;
using myShopBoard.Data.Entities;
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

    public async Task<AssetLookupsResponse> GetLookupsAsync(CancellationToken cancellationToken)
    {
        var (types, statuses, yards) = await assets.GetLookupsAsync(cancellationToken);

        return new AssetLookupsResponse(
            [.. types.Select(t => new LookupItem(t.Id, t.Name))],
            [.. statuses.Select(s => new LookupItem(s.Id, s.Name))],
            [.. yards.Select(y => new LookupItem(y.Id, y.Name))]);
    }

    public async Task<AssetResponse> CreateAsync(CreateAssetRequest request, CancellationToken cancellationToken)
    {
        var unitNumber = request.UnitNumber.Trim();

        // Checked here as well as by the unique index, so a duplicate returns 409 with a
        // readable message instead of a raw constraint violation surfacing as a 500.
        if (await assets.UnitNumberExistsAsync(unitNumber, cancellationToken))
        {
            throw new InvalidOperationException($"Unit number '{unitNumber}' already exists.");
        }

        var asset = new Asset
        {
            UnitNumber = unitNumber,
            QrToken = GenerateQrToken(),
            AssetTypeId = request.AssetTypeId,
            AssetStatusId = request.AssetStatusId,
            YardId = request.YardId,
            Vin = string.IsNullOrWhiteSpace(request.Vin) ? null : request.Vin.Trim().ToUpperInvariant(),
            Year = request.Year,
            Make = string.IsNullOrWhiteSpace(request.Make) ? null : request.Make.Trim(),
            Model = string.IsNullOrWhiteSpace(request.Model) ? null : request.Model.Trim(),
            LicensePlate = string.IsNullOrWhiteSpace(request.LicensePlate) ? null : request.LicensePlate.Trim(),
        };

        return AssetMapper.ToResponse(await assets.AddAsync(asset, cancellationToken));
    }

    public async Task ArchiveAsync(long id, CancellationToken cancellationToken)
    {
        if (!await assets.ArchiveAsync(id, cancellationToken))
        {
            throw new KeyNotFoundException($"No unit found with id {id}.");
        }
    }

    /// <summary>128-bit CSPRNG token, base64url. Never derived from the id or VIN.</summary>
    private static string GenerateQrToken()
    {
        Span<byte> bytes = stackalloc byte[16];
        RandomNumberGenerator.Fill(bytes);

        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }
}