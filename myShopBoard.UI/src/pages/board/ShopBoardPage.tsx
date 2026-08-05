import { MapPin, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMeter } from "@/lib/format";
import { useShopBoardData, type BoardColumn } from "./useShopBoardData";

/**
 * The shop board.
 *
 * Deliberately NOT a fleet list: In Service units are absent entirely. This screen answers
 * one question - what is in the shop right now and what is happening to it.
 *
 * The dark surface is intentional and uses its own --board-* tokens rather than the app's
 * light theme. A board is a working surface; a dark board inside a light shell reads as
 * deliberate the same way a code editor does.
 *
 * TODO(aging): the "3d 04h" counter that makes a shop board actually useful needs the
 * AssetStatusChanges table - there is currently no record of WHEN a unit entered its status.
 * Omitted rather than faked.
 * TODO(workorders): technician and bay assignment need work orders.
 */
export default function ShopBoardPage() {
  const { columns, totalOnBoard, fleetSize, isLoading, isError, error } = useShopBoardData();

  return (
    <>
      <PageHeader
        title="Shop Board"
        subtitle={
          isLoading
            ? "Loading…"
            : `${totalOnBoard} of ${fleetSize} units down · In Service and parked units hidden`
        }
      />

      <div className="min-h-0 flex-1 overflow-hidden p-4 pt-3 md:p-6 md:pt-3">
        <div className="h-full overflow-x-auto rounded-lg bg-board p-3 shadow-soft">
          {isError && (
            <div className="m-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Could not load the board: {(error as Error).message}
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, columnIndex) => (
                <div key={columnIndex} className="w-56 shrink-0">
                  <Skeleton className="mb-2 h-5 w-full bg-board-hover" />
                  <Skeleton className="mb-2 h-24 w-full bg-board-hover" />
                  <Skeleton className="h-24 w-full bg-board-hover" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !isError && columns.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Wrench className="mx-auto mb-3 h-8 w-8 text-board-muted" />
                <p className="text-sm font-medium text-board-foreground">Nothing in the shop</p>
                <p className="mt-1 text-xs text-board-muted">Every unit is in service or parked.</p>
              </div>
            </div>
          )}

          {!isLoading && !isError && columns.length > 0 && (
            <div className="flex h-full gap-3">
              {columns.map((column) => (
                <BoardColumnView key={column.statusName} column={column} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function BoardColumnView({ column }: { column: BoardColumn }) {
  return (
    <section className="flex w-56 shrink-0 flex-col">
      <header className="mb-2 flex items-center justify-between px-1">
        <h2 className="truncate text-[11px] font-semibold uppercase tracking-wider text-board-foreground">
          {column.statusName.replace(/^Down\s*[-–]\s*/i, "")}
        </h2>
        <span className="ml-2 shrink-0 rounded-full bg-board-hover px-2 py-0.5 text-[10px] font-medium text-board-foreground">
          {column.units.length}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
        {column.units.map((unit) => (
          <article
            key={unit.id}
            className="rounded-md bg-board-hover p-2.5 transition-colors hover:bg-board-hover/70"
            style={{ borderTop: `3px solid ${column.colorHex}` }}
          >
            <div className="text-[15px] font-semibold leading-tight text-white">{unit.unitNumber}</div>

            <div className="mt-0.5 truncate text-[11px] text-board-muted">
              {[unit.make, unit.model].filter(Boolean).join(" ") || unit.assetTypeName}
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-board-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {unit.yardCode}
              </span>
              <span className="tabular-nums">
                {formatMeter(unit.currentPrimaryMeter, unit.primaryMeterUnit)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
