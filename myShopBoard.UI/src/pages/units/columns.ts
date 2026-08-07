import type { AssetResponse } from "@/services/assets";

export interface UnitColumn {
  key: string;
  label: string;
  /** Sort key the API understands. Omitted for columns the server cannot sort on. */
  sortKey?: string;
  /** Unit number cannot be hidden - without it a row is unidentifiable. */
  required?: boolean;
  align?: "left" | "right";
  render: (unit: AssetResponse) => string;
}

/**
 * Every column the unit table can show.
 *
 * Only the first four are on by default: the table's job is to let you FIND a unit, and the
 * preview panel carries the detail. The rest are here for the times someone genuinely wants
 * to scan VINs or compare odometers across the fleet.
 */
export const UNIT_COLUMNS: UnitColumn[] = [
  { key: "unitNumber", label: "Unit", sortKey: "unitNumber", required: true, render: (u) => u.unitNumber },
  { key: "type", label: "Type", sortKey: "type", render: (u) => u.assetTypeName },
  { key: "status", label: "Status", sortKey: "status", render: (u) => u.statusName },
  { key: "yard", label: "Yard", sortKey: "yard", render: (u) => u.yardCode },

  { key: "year", label: "Year", sortKey: "year", align: "right", render: (u) => (u.year != null ? String(u.year) : "—") },
  { key: "make", label: "Make", render: (u) => u.make ?? "—" },
  { key: "model", label: "Model", render: (u) => u.model ?? "—" },
  { key: "vin", label: "VIN", render: (u) => u.vin ?? "—" },
  { key: "plate", label: "Plate", render: (u) => u.licensePlate ?? "—" },
  {
    key: "meter",
    label: "Primary Meter",
    sortKey: "meter",
    align: "right",
    render: (u) =>
      u.currentPrimaryMeter != null
        ? `${u.currentPrimaryMeter.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${u.primaryMeterUnit}`
        : "—",
  },
  {
    key: "hours",
    label: "Engine Hours",
    align: "right",
    render: (u) =>
      u.currentSecondaryMeter != null
        ? `${u.currentSecondaryMeter.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${u.secondaryMeterUnit ?? ""}`.trim()
        : "—",
  },
];

export const DEFAULT_COLUMN_KEYS = ["unitNumber", "type", "status", "yard"];

export const COLUMN_STORAGE_KEY = "myshopboard.units.columns";

/** Reads the saved choice, falling back to the default set if it is missing or corrupt. */
export function loadColumnKeys(): string[] {
  if (typeof window === "undefined") return DEFAULT_COLUMN_KEYS;

  try {
    const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return DEFAULT_COLUMN_KEYS;

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_COLUMN_KEYS;

    // Drop anything that no longer exists, so a renamed column cannot break the table.
    const valid = parsed.filter((key): key is string =>
      typeof key === "string" && UNIT_COLUMNS.some((c) => c.key === key),
    );

    return valid.length > 0 ? valid : DEFAULT_COLUMN_KEYS;
  } catch {
    return DEFAULT_COLUMN_KEYS;
  }
}
