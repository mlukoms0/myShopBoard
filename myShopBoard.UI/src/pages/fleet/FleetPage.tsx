import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiTile } from "@/components/KpiTile";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMeter } from "@/lib/format";
import { useFleetData } from "./useFleetData";

/**
 * Fleet Overview.
 *
 * TODO(redesign): this page is scheduled for a redesign - see the six UI directions. For now
 * it has only been adapted to the full-bleed shell (its own header and centred container
 * removed); the information design is unchanged.
 *
 * Sorting, searching and paging all happen SERVER-SIDE: each interaction changes the query
 * object, which changes the TanStack Query cache key, which refetches. The browser holds one
 * page of rows rather than the whole fleet, so this still works at 500 units.
 */

const SORTABLE_COLUMNS = [
  { key: "unitNumber", label: "Unit" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "yard", label: "Yard" },
  { key: "year", label: "Year" },
  { key: "meter", label: "Primary Meter" },
] as const;

const PAGE_SIZE = 50;

export default function FleetPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("unitNumber:asc");
  const [page, setPage] = useState(1);

  // useMemo keeps this object identity stable between renders. Without it a new object is
  // created every render, the query key changes, and TanStack Query refetches endlessly.
  const query = useMemo(
    () => ({ page, size: PAGE_SIZE, search: search || undefined, sort }),
    [page, search, sort],
  );

  const { data, isLoading, isError, error } = useFleetData(query);

  const [sortColumn, sortDirection] = sort.split(":");

  function toggleSort(key: string) {
    setSort((current) => {
      const [column, direction] = current.split(":");
      return column === key && direction === "asc" ? `${key}:desc` : `${key}:asc`;
    });
    setPage(1);
  }

  const units = data?.items ?? [];

  // NOTE: these count the CURRENT PAGE only. Honest at 12 units, wrong at 500.
  // Real fleet-wide KPIs come from the API later, derived from the status-change log.
  const availableCount = data ? units.filter((u) => u.isAvailable).length : null;
  const downCount = data
    ? units.filter((u) => !u.isAvailable && !u.excludeFromAvailability).length
    : null;
  const yardCount = data ? new Set(units.map((u) => u.yardCode)).size : null;

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={isLoading ? "Loading…" : `${data?.totalCount ?? 0} units`}
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
              placeholder="Search unit, VIN, make, model, plate…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        }
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile label="Total units" value={data?.totalCount ?? null} loading={isLoading} />
          <KpiTile label="Available" value={availableCount} loading={isLoading} />
          <KpiTile label="Down" value={downCount} loading={isLoading} />
          <KpiTile label="Yards" value={yardCount} loading={isLoading} />
        </div>

        <div className="rounded-lg border bg-card">
          {isError ? (
            <div className="p-6 text-sm text-destructive">
              Could not load the fleet: {(error as Error).message}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {SORTABLE_COLUMNS.map((column) => (
                    <TableHead key={column.key}>
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                      >
                        {column.label}
                        {sortColumn === column.key &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          ))}
                      </button>
                    </TableHead>
                  ))}
                  <TableHead>Engine Hours</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading &&
                  Array.from({ length: 8 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!isLoading && units.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No units match that search.
                    </TableCell>
                  </TableRow>
                )}

                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{unit.assetTypeName}</TableCell>
                    <TableCell>
                      <StatusBadge name={unit.statusName} colorHex={unit.statusColorHex} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{unit.yardCode}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {unit.year ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatMeter(unit.currentPrimaryMeter, unit.primaryMeterUnit)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatMeter(unit.currentSecondaryMeter, unit.secondaryMeterUnit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {data.page} of {data.totalPages} · {data.totalCount} units
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border px-3 py-1.5 transition-colors hover:bg-muted disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-md border px-3 py-1.5 transition-colors hover:bg-muted disabled:opacity-50"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
