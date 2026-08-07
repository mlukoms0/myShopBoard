import { useEffect, useRef, useState } from "react";
import { RotateCcw, Settings2 } from "lucide-react";
import { DEFAULT_COLUMN_KEYS, UNIT_COLUMNS } from "./columns";

/**
 * Gear menu for choosing which columns the table shows.
 *
 * Hand-rolled rather than pulling in a popover library: this is a button, a panel, and two
 * dismiss handlers. It still does the parts people skip - Escape closes it, an outside click
 * closes it, and focus returns to the trigger.
 */
export function ColumnPicker({
  visible,
  onChange,
}: {
  visible: string[];
  onChange: (keys: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(key: string) {
    const column = UNIT_COLUMNS.find((c) => c.key === key);
    if (column?.required) return;

    // Preserve the canonical column order rather than the order they were ticked, so the
    // table's layout does not depend on the sequence of clicks.
    const next = visible.includes(key)
      ? visible.filter((k) => k !== key)
      : UNIT_COLUMNS.filter((c) => c.key === key || visible.includes(c.key)).map((c) => c.key);

    onChange(next);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Choose columns"
        title="Choose columns"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Settings2 className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-lg border bg-card p-1.5 shadow-soft-lg">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Columns
          </p>

          <ul className="max-h-72 overflow-y-auto">
            {UNIT_COLUMNS.map((column) => {
              const checked = visible.includes(column.key);
              return (
                <li key={column.key}>
                  <label
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                      column.required
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:bg-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={column.required}
                      onChange={() => toggle(column.key)}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    <span className="flex-1">{column.label}</span>
                    {column.required && (
                      <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                        Fixed
                      </span>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => onChange(DEFAULT_COLUMN_KEYS)}
            className="mt-1 flex w-full items-center gap-1.5 rounded-md border-t px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
