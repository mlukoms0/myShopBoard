import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { assetService, type AssetQuery } from "@/services/assets";

/**
 * Data for the fleet dashboard.
 *
 * TanStack Query handles caching, request de-duplication, refetch-on-window-focus, and
 * cancelling in-flight requests when the component unmounts.
 *
 * This is a deliberate addition over myStorage, which has no server-state library and
 * copy-pastes a ~20-line useEffect/useState/try-catch block into ~39 pages - getting none
 * of the above, and leaking a state update on every unmounted component.
 */
export function useFleetData(query: AssetQuery) {
  return useQuery({
    // The key IS the cache identity. Change any part of the query and it refetches; return
    // to a previous query and the cached result renders instantly.
    queryKey: ["assets", query],
    queryFn: () => assetService.search(query),

    // Keeps the previous page on screen while the next loads, instead of flashing an empty
    // table every time you sort or page.
    placeholderData: keepPreviousData,
  });
}
