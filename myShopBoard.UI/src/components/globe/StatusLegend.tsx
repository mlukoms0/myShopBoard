export interface LegendEntry {
  name: string;
  color: string;
}

/**
 * Marker colour key, collapsed to a column of dots.
 *
 * A permanently expanded legend is a lot of text sitting on top of a map for information you
 * need about twice. Collapsed to dots it stays readable as a colour ramp, and hovering a dot
 * expands it into a pill with the label - the detail is one gesture away instead of always on.
 *
 * Entries are DERIVED from the statuses actually present in the fleet, so this can never
 * drift from what is on the map: a status added to the AssetStatuses table appears here on
 * its own.
 */
export function StatusLegend({ entries }: { entries: LegendEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <ul className="flex w-fit flex-col gap-1" aria-label="Status colour key">
      {entries.map((entry) => (
        <li key={entry.name}>
          <div
            className="group flex w-fit items-center gap-0 rounded-full p-1 transition-all duration-200 hover:gap-1.5 hover:bg-card hover:pr-2.5 hover:shadow-soft-sm"
            tabIndex={0}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
              style={{ background: entry.color }}
            />

            {/*
              Width animates from zero rather than the element being mounted on hover, so the
              label is always in the DOM for screen readers and for keyboard focus.
            */}
            <span
              className="max-w-0 overflow-hidden whitespace-nowrap text-[10px] font-semibold leading-none text-muted-foreground opacity-0 transition-all duration-200 group-hover:max-w-[150px] group-hover:opacity-100 group-focus-within:max-w-[150px] group-focus-within:opacity-100"
            >
              {/* "Down — Waiting Parts" is just "Waiting Parts" in a status key. */}
              {entry.name.replace(/^Down\s*[-–—]\s*/i, "")}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
