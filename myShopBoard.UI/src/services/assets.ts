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

  isAvailable: boolean;
  isInShop: boolean;
  excludeFromAvailability: boolean;
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

  /*
   * Detail fields for the unit preview panel.
   *
   * OPTIONAL on purpose: they exist on the Asset entity but are not on AssetResponse yet.
   * Typing them optional means the UI compiles and renders an em dash today, and fills in
   * automatically once the API starts returning them - no frontend change needed.
   */
  color?: string | null;
  registrationNumber?: string | null;
  registrationExpiresAtUtc?: string | null;
  dotExpiresAtUtc?: string | null;
  insuranceExpiresAtUtc?: string | null;
  dateAcquiredUtc?: string | null;
  outOfServiceDate?: string | null;
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

/** Matches CreateAssetRequest on the server. */
export interface CreateAssetRequest {
  unitNumber: string;
  assetTypeId: number;
  assetStatusId: number;
  yardId: number;
  vin?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  licensePlate?: string | null;
}

export interface LookupItem {
  id: number;
  name: string;
}

/** Dropdown sources for the Add Unit form. */
export interface AssetLookups {
  assetTypes: LookupItem[];
  assetStatuses: LookupItem[];
  yards: LookupItem[];
}

export interface AssetImportRowResult {
  rowNumber: number;
  unitNumber: string;
  isValid: boolean;
  imported: boolean;
  errors: string[];
}

export interface AssetImportResponse {
  fileName: string;
  totalRows: number;
  validRows: number;
  importedRows: number;
  committed: boolean;
  rows: AssetImportRowResult[];
}

class AssetService extends ApiService {
  search(query: AssetQuery = {}) {
    return this.get<PagedResult<AssetResponse>>("/assets", query);
  }

  getById(id: number) {
    return this.get<AssetResponse>(`/assets/${id}`);
  }

  getLookups() {
    return this.get<AssetLookups>("/assets/lookups");
  }

  create(body: CreateAssetRequest) {
    return this.post<AssetResponse>("/assets", body);
  }

  /** Soft delete - the row is retained for DOT record-keeping. */
  archive(id: number) {
    return this.del(`/assets/${id}`);
  }

  downloadImportTemplate() {
    return this.getBlob("/assets/import-template");
  }

  /** commit=false previews; the server runs the same parse and validation either way. */
  importFile(file: File, commit: boolean) {
    const form = new FormData();
    form.append("file", file);
    return this.postForm<AssetImportResponse>(`/assets/import?commit=${commit}`, form);
  }
}

/** Module-level singleton, matching the myStorage convention. */
export const assetService = new AssetService();
