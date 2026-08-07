import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Search that starts as an icon and grows into a pill when clicked.
 * Collapses again on blur, but only when empty - closing over an active filter would hide
 * why the table is showing three rows.
 */
export function ExpandingSearch({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(value.length > 0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div
      className={cn(
        "flex items-center rounded-full border transition-all duration-200",
        open ? "w-56 border-input bg-background pl-2.5 pr-1" : "w-8 border-transparent",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Search units"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground",
          open ? "cursor-default" : "p-1.5 hover:bg-muted",
        )}
        tabIndex={open ? -1 : 0}
      >
        <Search className="h-4 w-4" />
      </button>

      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => { if (!value) setOpen(false); }}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          onChange("");
          setOpen(false);
        }}
        // Width animates rather than the input unmounting, so focus is never lost mid-type.
        className={cn(
          "h-8 min-w-0 bg-transparent text-xs outline-none transition-all duration-200",
          open ? "flex-1 px-2 opacity-100" : "w-0 opacity-0",
        )}
        tabIndex={open ? 0 : -1}
      />

      {open && value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => { onChange(""); inputRef.current?.focus(); }}
          className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
