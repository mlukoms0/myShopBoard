using myShopBoard.Domain.Records.Fleet;

namespace myShopBoard.Domain.Services;

public interface IFleetMapService
{
    Task<FleetMapResponse> GetMapAsync(CancellationToken cancellationToken);
}
