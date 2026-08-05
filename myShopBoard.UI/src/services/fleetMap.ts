import { ApiService } from "./api";

/** Mirrors myShopBoard.Domain/Records/Fleet/FleetMapRecords.cs */

export interface MapUnitResponse {
  assetId: number;
  unitNumber: string;
  assetTypeName: string;
  statusName: string;
  statusColorHex: string;
  isAvailable: boolean;
  excludeFromAvailability: boolean;
  latitude: number | null;
  longitude: number | null;
  /** manual | samsara | truckx | geotab | motive — lets the UI say the position is
   *  hand-entered rather than implying a live GPS fix. */
  locationSource: string | null;
  locationRecordedAtUtc: string | null;
}

export interface MapYardResponse {
  yardId: number;
  yardCode: string;
  yardName: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  unitCount: number;
  availableCount: number;
  downCount: number;
  units: MapUnitResponse[];
}

export interface MapStateResponse {
  stateCode: string;
  stateName: string;
  latitude: number;
  longitude: number;
  unitCount: number;
  availableCount: number;
  downCount: number;
  yards: MapYardResponse[];
}

export interface FleetMapResponse {
  totalUnits: number;
  availableUnits: number;
  downUnits: number;
  parkedUnits: number;
  states: MapStateResponse[];
}

class FleetMapService extends ApiService {
  /** Named getMap rather than get, so it does not shadow the base class helper. */
  getMap() {
    return this.get<FleetMapResponse>("/fleet-map");
  }
}

export const fleetMapService = new FleetMapService();
