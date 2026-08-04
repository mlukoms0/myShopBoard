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

public class AssetsController(IAssetService assetService) : ControllerBase
{
    ///<summary> List fleet units with paging, saerch, filtering, and sorted.
    [HttpGet]
    [ProducesResponseType<PagedResult<AssetResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AssetResponse>>> Search(
        [FromQuery] AssetQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await assetService.SearchAsync(query, cancellationToken));
    }
    /// get one unit by internal id
    [HttpGet("{id:long}")]
    [ProducesResponseType<AssetResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssetResponse>> GetById(long id, CancellationToken cancellationToken)
    {
        return Ok(await assetService.GetByIdAsync(id, cancellationToken));
    }
}