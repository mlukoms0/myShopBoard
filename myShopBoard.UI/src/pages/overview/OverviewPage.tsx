import { useMemo, useState } from "react";
import { ChevronRight, CircleCheck, Gauge, MapPin, Truck, Wrench } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ChartPlaceholder } from "@/components/ChartPlaceholder";
import { FleetGlobe } from "@/components/globe/FleetGlobe";
import { StatusLegend, type LegendEntry } from "@/components/globe/StatusLegend";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapStateResponse, MapYardResponse } from "@/services/fleetMap";
import { useFleetMap } from "./useFleetMap";

/**
 * Fleet Overview.
 *
 * Layout follows the Soft UI dashboard: a 2x2 KPI grid and the locations table down the
 * left, the dotted globe filling the right and bleeding past the page gutter, chart cards
 * along the bottom.
 *
 * The globe and the table are two views of ONE selection - clicking a pin and clicking a
 * row do the same thing. That matters because the globe is hidden below 1280px, so the
 * table has to be a complete path to every level on its own.
 */
export default function OverviewPage() {
  const { data, isLoading, isError, error } = useFleetMap();

  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);
  const [selectedYardId, setSelectedYardId] = useState<number | null>(null);

  const selectedState = useMemo(
    () => data?.states.find((s) => s.stateCode === selectedStateCode) ?? null,
    [data, selectedStateCode],
  );

  const selectedYard = useMemo(
    () => selectedState?.yards.find((y) => y.yardId === selectedYardId) ?? null,
    [selectedState, selectedYardId],
  );

  /**
   * Legend entries, derived from the statuses actually present in the fleet rather than a
   * hardcoded list - so the key can never disagree with the map, and a status added to the
   * AssetStatuses table shows up here on its own.
   */
  const legend = useMemo<LegendEntry[]>(() => {
    if (!data) return [];

    const seen = new Map<string, string>();
    for (const state of data.states) {
      for (const yard of state.yards) {
        for (const unit of yard.units) {
          if (!seen.has(unit.statusName)) seen.set(unit.statusName, unit.statusColorHex);
        }
      }
    }

    return [...seen.entries()]
      .map(([name, color]) => ({ name, color }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Parked units are excluded from BOTH sides of the ratio. Counting a truck parked for the
  // winter as "unavailable" makes the number meaningless within a month.
  const inService = data ? data.totalUnits - data.parkedUnits : 0;
  const availabilityPct =
    data && inService > 0 ? Math.round((data.availableUnits / inService) * 100) : null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4 md:px-6">
      <h1 className="mb-5 text-3xl font-bold tracking-tight">Fleet Overview</h1>

      {isError && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Could not load the fleet map: {(error as Error).message}
        </div>
      )}

      {/* ---- upper band: stats + table on the left, globe on the right ---- */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,46%)]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Total units" value={data?.totalUnits ?? null} icon={Truck} tone="dark" loading={isLoading} />
            <StatCard label="Available" value={data?.availableUnits ?? null} icon={CircleCheck} tone="success" loading={isLoading} />
            <StatCard label="Down" value={data?.downUnits ?? null} icon={Wrench} tone="danger" loading={isLoading} />
            <StatCard
              label="Availability"
              value={availabilityPct}
              suffix="%"
              icon={Gauge}
              tone="primary"
              loading={isLoading}
              delta={data ? `${data.parkedUnits} parked` : undefined}
            />
          </div>

          <LocationsTable
            loading={isLoading}
            states={data?.states ?? []}
            selectedState={selectedState}
            selectedYard={selectedYard}
            onSelectState={(code) => { setSelectedStateCode(code); setSelectedYardId(null); }}
            onSelectYard={(yardId) => setSelectedYardId(yardId)}
            onHome={() => { setSelectedStateCode(null); setSelectedYardId(null); }}
            onBackToState={() => setSelectedYardId(null)}
          />
        </div>

        {/* The box is deliberately SHORTER than the sphere drawn inside it, so the globe is
            cropped top and bottom and bleeds past the right gutter. A fully contained sphere
            reads as a diagram; a cropped one reads as scenery.
            Sizing it near the left column's height also stops it dictating the row height
            and leaving dead space beside the table.
            Hidden below xl - it is decorative context, and the table reaches every level on
            its own. */}
        <div className="relative -mr-4 hidden h-[460px] overflow-hidden xl:block">
          {/* Collapsed to dots in the top-left corner - out of the map's way until hovered. */}
          {!isLoading && legend.length > 0 && (
            <div className="absolute left-3 top-3 z-10">
              <StatusLegend entries={legend} />
            </div>
          )}

          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Skeleton className="h-80 w-80 rounded-full" />
            </div>
          ) : (
            <FleetGlobe
              states={data?.states ?? []}
              selectedStateCode={selectedStateCode}
              selectedYardId={selectedYardId}
              onSelectState={(code) => { setSelectedStateCode(code); setSelectedYardId(null); }}
              onSelectYard={(yardId) => setSelectedYardId(yardId)}
            />
          )}
        </div>
      </div>

      {/* ---- lower band: charts, scaffolded ---- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ChartPlaceholder
          dark
          title="Fleet availability"
          subtitle="Trailing 30 days"
          needs="the AssetStatusChanges table — nothing records when a unit entered its status yet"
        />
        <ChartPlaceholder
          title="Downtime by reason"
          subtitle="Planned vs unplanned"
          needs="status history plus the IsPlannedDowntime flag over a date range"
        />
        <ChartPlaceholder
          title="PM compliance"
          subtitle="Completed within ±10% of interval"
          needs="ServiceReminders and ServiceEntries"
        />
        <ChartPlaceholder
          title="Cost per mile"
          subtitle="Rolling 90 days"
          needs="the financials module — parts and labour cost on work order lines"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Locations by state, drilling into yards and then units.
 *
 * Cell style copies the template's "Sales by Country": a small grey caption above each
 * value rather than a header row. It reads well at four columns and degrades gracefully on
 * a narrow screen, where a real table header would not.
 */
function LocationsTable({
  loading,
  states,
  selectedState,
  selectedYard,
  onSelectState,
  onSelectYard,
  onHome,
  onBackToState,
}: {
  loading: boolean;
  states: MapStateResponse[];
  selectedState: MapStateResponse | null;
  selectedYard: MapYardResponse | null;
  onSelectState: (code: string) => void;
  onSelectYard: (yardId: number) => void;
  onHome: () => void;
  onBackToState: () => void;
}) {
  const title = selectedYard
    ? selectedYard.yardName
    : selectedState
      ? `${selectedState.stateName} — yards`
      : "Units by state";

  return (
    <section className="rounded-lg bg-card p-4 shadow-soft">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight">{title}</h2>

        {(selectedState || selectedYard) && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            <button type="button" onClick={onHome} className="rounded px-1 hover:text-foreground hover:underline">
              All states
            </button>
            {selectedYard && selectedState && (
              <>
                <ChevronRight className="h-3 w-3 opacity-50" />
                <button type="button" onClick={onBackToState} className="rounded px-1 hover:text-foreground hover:underline">
                  {selectedState.stateCode}
                </button>
              </>
            )}
          </nav>
        )}
      </div>

      <div className="divide-y">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-3">
              <Skeleton className="h-8 w-full" />
            </div>
          ))}

        {!loading && !selectedState &&
          states.map((state) => (
            <TableRow
              key={state.stateCode}
              onClick={() => onSelectState(state.stateCode)}
              cells={[
                { label: "State", value: state.stateName },
                { label: "Units", value: String(state.unitCount) },
                { label: "Available", value: String(state.availableCount), tone: "#16A34A" },
                { label: "Down", value: String(state.downCount), tone: state.downCount > 0 ? "#DC2626" : undefined },
              ]}
            />
          ))}

        {!loading && selectedState && !selectedYard &&
          selectedState.yards.map((yard) => (
            <TableRow
              key={yard.yardId}
              onClick={() => onSelectYard(yard.yardId)}
              cells={[
                { label: "Yard", value: yard.yardName, sub: yard.city ?? undefined },
                { label: "Units", value: String(yard.unitCount) },
                { label: "Available", value: String(yard.availableCount), tone: "#16A34A" },
                { label: "Down", value: String(yard.downCount), tone: yard.downCount > 0 ? "#DC2626" : undefined },
              ]}
            />
          ))}

        {!loading && selectedYard &&
          selectedYard.units.map((unit) => (
            <TableRow
              key={unit.assetId}
              cells={[
                { label: "Unit", value: unit.unitNumber, sub: unit.assetTypeName },
                { label: "Status", value: unit.statusName.replace(/^Down\s*[-–]\s*/i, ""), tone: unit.statusColorHex },
                { label: "Position", value: unit.locationSource === "manual" ? "Seeded" : (unit.locationSource ?? "None") },
                { label: "Coordinates", value: unit.latitude != null && unit.longitude != null
                    ? `${Number(unit.latitude).toFixed(3)}, ${Number(unit.longitude).toFixed(3)}`
                    : "—" },
              ]}
            />
          ))}

        {!loading && states.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No yards have a state set yet, so nothing can be placed on the map.
          </p>
        )}
      </div>

      {selectedYard && (
        <p className="pt-3 text-[11px] leading-snug text-muted-foreground">
          <MapPin className="mr-1 inline h-3 w-3" />
          Positions are hand-seeded. A telematics feed writes to the same table and these become
          live without a schema change.
        </p>
      )}
    </section>
  );
}

interface Cell {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}

function TableRow({ cells, onClick }: { cells: Cell[]; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`grid w-full grid-cols-2 items-center gap-3 py-3 text-left sm:grid-cols-4 ${
        onClick ? "-mx-2 rounded-md px-2 transition-colors hover:bg-muted" : ""
      }`}
    >
      {cells.map((cell) => (
        <div key={cell.label} className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {cell.label}
          </div>
          <div
            className="truncate text-sm font-bold tabular-nums"
            style={cell.tone ? { color: cell.tone } : undefined}
          >
            {cell.value}
          </div>
          {cell.sub && <div className="truncate text-[11px] text-muted-foreground">{cell.sub}</div>}
        </div>
      ))}
    </Tag>
  );
}
