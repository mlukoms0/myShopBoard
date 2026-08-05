import { useQuery } from "@tanstack/react-query";
import { fleetMapService } from "@/services/fleetMap";

/**
 * The whole geographic rollup in one request - state, yard and unit levels together.
 *
 * Fetching every level up front is what makes clicking a pin instant: there is no request
 * between zoom levels, so the animation never waits on the network.
 */
export function useFleetMap() {
  return useQuery({
    queryKey: ["fleet-map"],
    queryFn: () => fleetMapService.getMap(),
    staleTime: 30_000,
  });
}
