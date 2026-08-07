using myShopBoard.Domain.Records.Assets;

namespace myShopBoard.Domain.Services;

public interface IAssetImportService
{
    /// <summary>Blank .xlsx workbook: a Units sheet plus a Reference sheet of valid values.</summary>
    Task<byte[]> BuildTemplateAsync(CancellationToken cancellationToken);

    /// <param name="commit">False to validate only. Parsing and validation are identical either way.</param>
    /// <exception cref="ArgumentException">Unsupported file type or unreadable content. Maps to HTTP 400.</exception>
    Task<AssetImportResponse> ImportAsync(
        Stream content,
        string fileName,
        bool commit,
        CancellationToken cancellationToken);
}
