import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { assetService, type AssetResponse } from "@/services/assets";

export interface BoardColumn {
  statusName: string;
  colorHex: string;
  sortOrder: number;
  /** Physically in a bay, as opposed to broken down on the roadside. */
  isInShop: boolean;
  units: AssetResponse[];
}

/**
 * Shop board data.
 *
 * WHAT BELONGS ON THE BOARD: every unit that is down AND still part of the active fleet.
 *
 *   - `isAvailable`            excludes In Service - the board is about work, not the fleet
 *   - `excludeFromAvailability` excludes Seasonal/Parked and Out of Fleet - a truck parked
 *                              for the winter is not work in progress and would clutter the
 *                              board permanently
 *
 * Both flags come from the AssetStatuses TABLE via the API, not from a hardcoded list of
 * status names here. Add "Down - Waiting on Tow" to the database and it appears as a column
 * with no frontend change.
 *
 * Columns are ordered by the status table's SortOrder for the same reason.
 */
export function useShopBoardData() {
  const query = useQuery({
    queryKey: ["assets", "board"],
    // One request for the whole fleet, grouped client-side. Correct at this scale; if the
    // fleet ever passes a few hundred units this becomes a dedicated board endpoint.
    queryFn: () => assetService.search({ page: 1, size: 200, sort: "unitNumber:asc" }),
    staleTime: 15_000,
  });

  const columns = useMemo<BoardColumn[]>(() => {
    const units = query.data?.items ?? [];
    const onBoard = units.filter((u) => !u.isAvailable && !u.excludeFromAvailability);

    const byStatus = new Map<string, BoardColumn>();

    for (const unit of onBoard) {
      let column = byStatus.get(unit.statusName);

      if (!column) {
        column = {
          statusName: unit.statusName,
          colorHex: unit.statusColorHex,
          sortOrder: unit.statusSortOrder,
          isInShop: unit.isInShop,
          units: [],
        };
        byStatus.set(unit.statusName, column);
      }

      column.units.push(unit);
    }

    return [...byStatus.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [query.data]);

  const totalOnBoard = columns.reduce((sum, column) => sum + column.units.length, 0);
  const fleetSize = query.data?.totalCount ?? 0;

  return {
    columns,
    totalOnBoard,
    fleetSize,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
