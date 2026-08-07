namespace myShopBoard.Domain.Records.Assets;

public record AssetImportRowResult(
    int RowNumber,
    string UnitNumber,
    bool IsValid,
    bool Imported,
    IReadOnlyList<string> Errors);

/// <summary>
/// Result of an import. The same parse and validation runs whether Committed is false
/// (preview) or true, so what the user reviews is exactly what gets written.
/// </summary>
public record AssetImportResponse(
    string FileName,
    int TotalRows,
    int ValidRows,
    int ImportedRows,
    bool Committed,
    IReadOnlyList<AssetImportRowResult> Rows);
