using Microsoft.AspNetCore.Mvc;
using myShopBoard.Domain.Records.Assets;
using myShopBoard.Domain.Records.Common;
using myShopBoard.Domain.Services;

namespace myShopBoard.API.Controllers;

/// <summary>
/// parse the request, call one domain service, map to a status code. No business logic
/// </summary> 
 

[ApiController]
[Route("api/assets")]

public class AssetsController(IAssetService assetService, IAssetImportService importService) : ControllerBase
{
    private const long MaxImportBytes = 5 * 1024 * 1024;

    private const string XlsxContentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    ///<summary> List fleet units with paging, saerch, filtering, and sorted.
    [HttpGet]
    [ProducesResponseType<PagedResult<AssetResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AssetResponse>>> Search(
        [FromQuery] AssetQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await assetService.SearchAsync(query, cancellationToken));
    }
    /// <summary>Types, statuses and yards for the Add Unit form.</summary>
    /// <remarks>MUST stay above the {id:long} route or it is matched as an id.</remarks>
    [HttpGet("lookups")]
    [ProducesResponseType<AssetLookupsResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AssetLookupsResponse>> GetLookups(CancellationToken cancellationToken)
    {
        return Ok(await assetService.GetLookupsAsync(cancellationToken));
    }

    /// <summary>Blank .xlsx import template with a Reference sheet of valid values.</summary>
    [HttpGet("import-template")]
    public async Task<IActionResult> GetImportTemplate(CancellationToken cancellationToken)
    {
        var bytes = await importService.BuildTemplateAsync(cancellationToken);
        return File(bytes, XlsxContentType, "myshopboard-units-template.xlsx");
    }

    /// <summary>Validate an uploaded .xlsx or .csv, and optionally create the valid rows.</summary>
    /// <param name="commit">False previews only. Parsing and validation are identical either way.</param>
    [HttpPost("import")]
    [RequestSizeLimit(MaxImportBytes)]
    [ProducesResponseType<AssetImportResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AssetImportResponse>> Import(
        IFormFile file,
        [FromQuery] bool commit,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            throw new ArgumentException("No file was uploaded.");
        }

        // Extension allowlist here; the content itself is checked in the service.
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".xlsx" or ".csv"))
        {
            throw new ArgumentException($"Unsupported file type '{extension}'. Use .xlsx or .csv.");
        }

        await using var stream = file.OpenReadStream();
        return Ok(await importService.ImportAsync(stream, file.FileName, commit, cancellationToken));
    }

    /// get one unit by internal id
    [HttpGet("{id:long}")]
    [ProducesResponseType<AssetResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetResponse>> GetById(long id, CancellationToken cancellationToken)
    {
        return Ok(await assetService.GetByIdAsync(id, cancellationToken));
    }

    /// <summary>Soft delete. The row is retained for DOT record-keeping.</summary>
    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Archive(long id, CancellationToken cancellationToken)
    {
        await assetService.ArchiveAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>Create a unit.</summary>
    [HttpPost]
    [ProducesResponseType<AssetResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AssetResponse>> Create(
        [FromBody] CreateAssetRequest request,
        CancellationToken cancellationToken)
    {
        var created = await assetService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}