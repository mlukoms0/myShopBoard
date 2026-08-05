import { ApiService, type PagedResult } from "./api";

/**
 * Mirrors AssetResponse in myShopBoard.Domain/Records/Assets/AssetRecords.cs.
 *
 * TODO(codegen): generate these from the API's OpenAPI document so C# and TypeScript
 * cannot drift apart. Hand-mirroring is the known weak point of a split stack.
 */
export interface AssetResponse {
  id: number;
  unitNumber: string;
  vin: string | null;
  assetTypeName: string;
  statusName: string;
  statusColorHex: string;

  /** True only for statuses that count as "up" - currently just In Service. */
  isAvailable: boolean;
  /** Physically in a bay, as opposed to broken down on the roadside. */
  isInShop: boolean;
  /** Seasonal/parked and retired units - out of BOTH sides of the availability ratio. */
  excludeFromAvailability: boolean;
  /** Drives shop board column order, so ordering lives in the database. */
  statusSortOrder: number;

  yardId: number;
  yardCode: string;
  yardName: string;
  year: number | null;
  make: string | null;
  model: string | null;
  licensePlate: string | null;
  currentPrimaryMeter: number | null;
  primaryMeterUnit: string;
  currentSecondaryMeter: number | null;
  secondaryMeterUnit: string | null;
  currentMeterAsOfUtc: string | null;
  inServiceDate: string | null;
}

export interface AssetQuery {
  page?: number;
  size?: number;
  search?: string;
  yardId?: number;
  assetStatusId?: number;
  assetTypeId?: number;
  sort?: string;
}

class AssetService extends ApiService {
  search(query: AssetQuery = {}) {
    return this.get<PagedResult<AssetResponse>>("/assets", query);
  }

  getById(id: number) {
    return this.get<AssetResponse>(`/assets/${id}`);
  }
}

/** Module-level singleton, matching the myStorage convention. */
export const assetService = new AssetService();
