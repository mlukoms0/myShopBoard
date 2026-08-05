using Microsoft.AspNetCore.Mvc;
using myShopBoard.Domain.Records.Fleet;
using myShopBoard.Domain.Services;

namespace myShopBoard.API.Controllers;

/// <summary>
/// Geographic rollup of the fleet: state → yard → unit, with coordinates and status counts.
/// Feeds every zoom level of the Overview map from a single request.
/// </summary>
[ApiController]
[Route("api/fleet-map")]
public class FleetMapController(IFleetMapService fleetMapService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<FleetMapResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<FleetMapResponse>> Get(CancellationToken cancellationToken)
    {
        return Ok(await fleetMapService.GetMapAsync(cancellationToken));
    }
}
