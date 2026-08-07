import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CircleCheck, Gauge, Plus, Truck, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ExpandingSearch } from "@/components/ui/expanding-search";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssetResponse } from "@/services/assets";
import { useFleetData } from "@/pages/fleet/useFleetData";
import { UnitPreview } from "./UnitPreview";
import { AddUnitDialog } from "./AddUnitDialog";
import { ColumnPicker } from "./ColumnPicker";
import { COLUMN_STORAGE_KEY, UNIT_COLUMNS, loadColumnKeys } from "./columns";

/**
 * Unit Overview.
 *
 * The table carries only what you need to FIND a unit; the preview rail carries the detail.
 * That split is what keeps this scannable at 200 units rather than turning it into a
 * horizontally scrolling spreadsheet nobody reads.
 *
 * Sorting, searching and paging are server-side: each interaction changes the query object,
 * which changes the TanStack Query cache key, which refetches. The browser holds one page of
 * rows rather than the whole fleet.
 */

const PAGE_SIZE = 50;

export default function UnitsPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("unitNumber:asc");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [columnKeys, setColumnKeys] = useState<string[]>(loadColumnKeys);

  useEffect(() => {
    window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnKeys));
  }, [columnKeys]);

  const columns = useMemo(
    () => UNIT_COLUMNS.filter((c) => columnKeys.includes(c.key)),
    [columnKeys],
  );

  const query = useMemo(
    () => ({ page, size: PAGE_SIZE, search: search || undefined, sort }),
    [page, search, sort],
  );

  const { data, isLoading, isError, error } = useFleetData(query);

  const units = useMemo(() => data?.items ?? [], [data]);
  const selected = units.find((u) => u.id === selectedId) ?? null;

  // Keep a selection alive across refetches, but drop it if the unit falls out of the
  // current filter - a preview showing a row you can no longer see is just confusing.
  useEffect(() => {
    if (selectedId != null && units.length > 0 && !units.some((u) => u.id === selectedId)) {
      setSelectedId(null);
    }
  }, [units, selectedId]);

  const [sortColumn, sortDirection] = sort.split(":");

  function toggleSort(key: string) {
    setSort((current) => {
      const [column, direction] = current.split(":");
      return column === key && direction === "asc" ? `${key}:desc` : `${key}:asc`;
    });
    setPage(1);
  }

  const availableCount = data ? units.filter((u) => u.isAvailable).length : null;
  const downCount = data
    ? units.filter((u) => !u.isAvailable && !u.excludeFromAvailability).length
    : null;
  const yardCount = data ? new Set(units.map((u) => u.yardCode)).size : null;

  return (
    <>
      <PageHeader
        title="Unit Overview"
        subtitle={isLoading ? "Loading…" : `${data?.totalCount ?? 0} units`}
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Unit
          </Button>
        }
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pt-3 md:p-6 md:pt-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total units" value={data?.totalCount ?? null} icon={Truck} tone="dark" loading={isLoading} />
          <StatCard label="Available" value={availableCount} icon={CircleCheck} tone="success" loading={isLoading} />
          <StatCard label="Down" value={downCount} icon={Wrench} tone="danger" loading={isLoading} />
          <StatCard label="Yards" value={yardCount} icon={Gauge} tone="primary" loading={isLoading} />
        </div>

        {/*
          Roughly 60/40 rather than the old 1fr + 340px. With four columns the table was
          stretching them across most of a widescreen for no reason, and the preview - which
          holds all the actual detail - was squeezed into a rail.

          The table column is a hard ceiling: turning on more columns grows the table INTO
          this width and then scrolls horizontally inside its own card, so the page layout
          never shifts and the preview never gets squeezed again.
        */}
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.95fr)_minmax(340px,1fr)]">
          <div className="overflow-hidden rounded-lg bg-card shadow-soft">
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
              <ExpandingSearch
                value={search}
                placeholder="Unit, VIN, make, model, plate…"
                onChange={(next) => {
                  setSearch(next);
                  setPage(1);
                }}
              />
              <ColumnPicker visible={columnKeys} onChange={setColumnKeys} />
            </div>

            {isError ? (
              <div className="p-6 text-sm text-destructive">
                Could not load units: {(error as Error).message}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={column.align === "right" ? "text-right" : undefined}
                      >
                        {column.sortKey ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(column.sortKey!)}
                            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                          >
                            {column.label}
                            {sortColumn === column.sortKey &&
                              (sortDirection === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5" />
                              ))}
                          </button>
                        ) : (
                          column.label
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading &&
                    Array.from({ length: 8 }).map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columns.map((column) => (
                          <TableCell key={column.key}>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}

                  {!isLoading && units.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No units match that search.
                      </TableCell>
                    </TableRow>
                  )}

                  {units.map((unit) => (
                    <UnitRow
                      key={unit.id}
                      unit={unit}
                      columns={columns}
                      selected={unit.id === selectedId}
                      onSelect={() => setSelectedId(unit.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            )}

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  Page {data.page} of {data.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          <UnitPreview unit={selected} onDeleted={() => setSelectedId(null)} />
        </div>
      </div>

      <AddUnitDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(unit) => setSelectedId(unit.id)}
      />
    </>
  );
}

function UnitRow({
  unit,
  columns,
  selected,
  onSelect,
}: {
  unit: AssetResponse;
  columns: typeof UNIT_COLUMNS;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TableRow
      // aria-selected plus a keyboard handler: a clickable row that only answers to a mouse
      // is a row half the people cannot use.
      aria-selected={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`cursor-pointer focus:outline-none ${
        selected ? "bg-accent hover:bg-accent" : "focus-visible:bg-muted"
      }`}
    >
      {columns.map((column, index) => (
        <TableCell
          key={column.key}
          className={[
            column.align === "right" ? "text-right tabular-nums" : "",
            index === 0 ? "font-semibold" : "text-muted-foreground",
          ].join(" ")}
        >
          {index === 0 ? (
            // A left bar rather than a tick column: marks the row without costing a column.
            <span className="flex items-center gap-2">
              <span
                className={`h-4 w-0.5 shrink-0 rounded-full ${selected ? "bg-primary" : "bg-transparent"}`}
                aria-hidden="true"
              />
              {column.render(unit)}
            </span>
          ) : column.key === "status" ? (
            <StatusBadge name={unit.statusName} colorHex={unit.statusColorHex} />
          ) : (
            column.render(unit)
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}
