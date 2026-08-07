using ClosedXML.Excel;
using myShopBoard.Data.Entities;
using myShopBoard.Data.Repositories;
using myShopBoard.Domain.Records.Assets;

namespace myShopBoard.Domain.Services;

public class AssetImportService(IAssetRepository assets, IAssetService assetService) : IAssetImportService
{
    private const int MaxRows = 5000;

    private static readonly string[] Headers =
        ["UnitNumber", "Type", "Status", "Yard", "Vin", "Year", "Make", "Model", "LicensePlate"];

    public async Task<byte[]> BuildTemplateAsync(CancellationToken cancellationToken)
    {
        var (types, statuses, yards) = await assets.GetLookupsAsync(cancellationToken);

        using var workbook = new XLWorkbook();

        var sheet = workbook.Worksheets.Add("Units");
        for (var i = 0; i < Headers.Length; i++)
        {
            sheet.Cell(1, i + 1).Value = Headers[i];
            sheet.Cell(1, i + 1).Style.Font.Bold = true;
        }

        object[] example =
        [
            "214",
            types.FirstOrDefault()?.Name ?? "Dump Truck",
            statuses.FirstOrDefault()?.Name ?? "In Service",
            yards.FirstOrDefault()?.Name ?? "Main Yard",
            "1FUJGLDR9CLBP9999",
            2021,
            "Mack",
            "Granite GU713",
            "DT214",
        ];

        for (var i = 0; i < example.Length; i++)
        {
            sheet.Cell(2, i + 1).Value = XLCellValue.FromObject(example[i]);
        }

        // Text, not numeric: a VIN starting with 0 must not lose it, and Excel will happily
        // reformat a 17-character alphanumeric into scientific notation given the chance.
        sheet.Column(1).Style.NumberFormat.Format = "@";
        sheet.Column(5).Style.NumberFormat.Format = "@";
        sheet.Columns().AdjustToContents();

        var reference = workbook.Worksheets.Add("Reference");
        reference.Cell(1, 1).Value = "Valid Types";
        reference.Cell(1, 2).Value = "Valid Statuses";
        reference.Cell(1, 3).Value = "Valid Yards";
        reference.Row(1).Style.Font.Bold = true;

        for (var i = 0; i < types.Count; i++) reference.Cell(i + 2, 1).Value = types[i].Name;
        for (var i = 0; i < statuses.Count; i++) reference.Cell(i + 2, 2).Value = statuses[i].Name;
        for (var i = 0; i < yards.Count; i++) reference.Cell(i + 2, 3).Value = yards[i].Name;
        reference.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<AssetImportResponse> ImportAsync(
        Stream content,
        string fileName,
        bool commit,
        CancellationToken cancellationToken)
    {
        var rows = await ReadRowsAsync(content, fileName, cancellationToken);

        if (rows.Count == 0)
        {
            throw new ArgumentException("The file is empty.");
        }

        if (rows.Count - 1 > MaxRows)
        {
            throw new ArgumentException($"Too many rows. The limit is {MaxRows:N0}.");
        }

        var (types, statuses, yards) = await assets.GetLookupsAsync(cancellationToken);
        var header = rows[0].Select(h => h.Trim()).ToList();

        var results = new List<AssetImportRowResult>();
        var pending = new List<(int RowNumber, CreateAssetRequest Request)>();

        // Duplicates within the file itself are invisible to a per-row database check,
        // because nothing is written until the commit pass.
        var seenInFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 1; i < rows.Count; i++)
        {
            var rowNumber = i + 1;
            var (request, unitNumber, errors) = ValidateRow(rows[i], header, types, statuses, yards);

            if (request is not null && !seenInFile.Add(request.UnitNumber))
            {
                errors = [.. errors, $"Unit number '{request.UnitNumber}' appears more than once in this file"];
                request = null;
            }

            if (request is null)
            {
                results.Add(new AssetImportRowResult(rowNumber, unitNumber, false, false, errors));
            }
            else
            {
                pending.Add((rowNumber, request));
                results.Add(new AssetImportRowResult(rowNumber, unitNumber, true, false, []));
            }
        }

        var imported = 0;

        if (commit)
        {
            foreach (var (rowNumber, request) in pending)
            {
                var index = results.FindIndex(r => r.RowNumber == rowNumber);

                try
                {
                    await assetService.CreateAsync(request, cancellationToken);
                    imported++;
                    results[index] = results[index] with { Imported = true };
                }
                catch (Exception ex) when (ex is InvalidOperationException or ArgumentException)
                {
                    results[index] = results[index] with { IsValid = false, Errors = [ex.Message] };
                }
            }
        }

        return new AssetImportResponse(
            fileName,
            rows.Count - 1,
            pending.Count,
            imported,
            commit,
            results);
    }

    private static (CreateAssetRequest? Request, string UnitNumber, IReadOnlyList<string> Errors) ValidateRow(
        IReadOnlyList<string> cells,
        List<string> header,
        IReadOnlyList<AssetType> types,
        IReadOnlyList<AssetStatus> statuses,
        IReadOnlyList<Yard> yards)
    {
        string Cell(string name)
        {
            var index = header.FindIndex(h => h.Equals(name, StringComparison.OrdinalIgnoreCase));
            return index >= 0 && index < cells.Count ? cells[index].Trim() : string.Empty;
        }

        var errors = new List<string>();

        var unitNumber = Cell("UnitNumber");
        if (string.IsNullOrWhiteSpace(unitNumber)) errors.Add("UnitNumber is required");
        else if (unitNumber.Length > 30) errors.Add("UnitNumber is longer than 30 characters");

        var typeName = Cell("Type");
        var type = types.FirstOrDefault(t => t.Name.Equals(typeName, StringComparison.OrdinalIgnoreCase));
        if (type is null) errors.Add($"Unknown type '{Blank(typeName)}'");

        var statusName = Cell("Status");
        var status = statuses.FirstOrDefault(s => s.Name.Equals(statusName, StringComparison.OrdinalIgnoreCase));
        if (status is null) errors.Add($"Unknown status '{Blank(statusName)}'");

        // Yards match on name or code - people know them by either.
        var yardName = Cell("Yard");
        var yard = yards.FirstOrDefault(y =>
            y.Name.Equals(yardName, StringComparison.OrdinalIgnoreCase) ||
            (y.Code ?? string.Empty).Equals(yardName, StringComparison.OrdinalIgnoreCase));
        if (yard is null) errors.Add($"Unknown yard '{Blank(yardName)}'");

        var vin = Cell("Vin");
        if (vin.Length > 17) errors.Add("VIN is longer than 17 characters");

        int? year = null;
        var yearRaw = Cell("Year");
        if (!string.IsNullOrWhiteSpace(yearRaw))
        {
            if (int.TryParse(yearRaw, out var parsed) && parsed is >= 1900 and <= 2100) year = parsed;
            else errors.Add($"Invalid year '{yearRaw}'");
        }

        if (errors.Count > 0 || type is null || status is null || yard is null)
        {
            return (null, string.IsNullOrWhiteSpace(unitNumber) ? "(blank)" : unitNumber, errors);
        }

        return (
            new CreateAssetRequest
            {
                UnitNumber = unitNumber,
                AssetTypeId = type.Id,
                AssetStatusId = status.Id,
                YardId = yard.Id,
                Vin = string.IsNullOrWhiteSpace(vin) ? null : vin,
                Year = year,
                Make = Null(Cell("Make")),
                Model = Null(Cell("Model")),
                LicensePlate = Null(Cell("LicensePlate")),
            },
            unitNumber,
            []);

        static string Blank(string value) => string.IsNullOrWhiteSpace(value) ? "(blank)" : value;
        static string? Null(string value) => string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private static async Task<List<string[]>> ReadRowsAsync(
        Stream content,
        string fileName,
        CancellationToken cancellationToken)
    {
        // Buffer so the magic-byte check can rewind. Size is already capped by the controller.
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        buffer.Position = 0;

        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        return extension switch
        {
            ".xlsx" => ReadXlsx(buffer),
            ".csv" => ReadCsv(buffer),
            _ => throw new ArgumentException($"Unsupported file type '{extension}'. Use .xlsx or .csv."),
        };
    }

    private static List<string[]> ReadXlsx(MemoryStream buffer)
    {
        // xlsx is a zip. Checking the signature stops a renamed file reaching the parser -
        // the extension and the client's content type are both attacker-controlled.
        Span<byte> signature = stackalloc byte[4];
        if (buffer.Read(signature) < 4 || signature[0] != 0x50 || signature[1] != 0x4B)
        {
            throw new ArgumentException("That is not a valid .xlsx file.");
        }

        buffer.Position = 0;

        using var workbook = new XLWorkbook(buffer);
        var sheet = workbook.Worksheets.FirstOrDefault()
            ?? throw new ArgumentException("The workbook has no sheets.");

        var used = sheet.RangeUsed();
        if (used is null) return [];

        var rows = new List<string[]>();

        var columnCount = used.ColumnCount();

        foreach (var row in used.RowsUsed())
        {
            var cells = new string[columnCount];
            for (var c = 1; c <= columnCount; c++)
            {
                cells[c - 1] = row.Cell(c).GetFormattedString().Trim();
            }

            if (cells.Any(c => c.Length > 0)) rows.Add(cells);
        }

        return rows;
    }

    private static List<string[]> ReadCsv(MemoryStream buffer)
    {
        using var reader = new StreamReader(buffer, detectEncodingFromByteOrderMarks: true);
        var text = reader.ReadToEnd();

        var rows = new List<string[]>();
        var row = new List<string>();
        var field = new System.Text.StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < text.Length; i++)
        {
            var ch = text[i];

            if (inQuotes)
            {
                if (ch == '"')
                {
                    if (i + 1 < text.Length && text[i + 1] == '"') { field.Append('"'); i++; }
                    else inQuotes = false;
                }
                else field.Append(ch);
                continue;
            }

            switch (ch)
            {
                case '"': inQuotes = true; break;
                case ',': row.Add(field.ToString()); field.Clear(); break;
                case '\n':
                    row.Add(field.ToString());
                    rows.Add([.. row]);
                    row.Clear();
                    field.Clear();
                    break;
                case '\r': break;
                default: field.Append(ch); break;
            }
        }

        if (field.Length > 0 || row.Count > 0)
        {
            row.Add(field.ToString());
            rows.Add([.. row]);
        }

        return [.. rows.Where(r => r.Any(c => !string.IsNullOrWhiteSpace(c)))];
    }
}
