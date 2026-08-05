import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A chart that does not exist yet.
 *
 * Renders the real card, title and footprint so the page layout is final, but says plainly
 * that there is no data behind it. Deliberately NOT a fake sparkline: an invented trend line
 * on a maintenance dashboard is worse than an empty box, because someone will act on it.
 *
 * `needs` names the schema still missing, so it doubles as a to-do visible inside the product.
 */
export function ChartPlaceholder({
  title,
  subtitle,
  needs,
  height = 240,
  dark = false,
}: {
  title: string;
  subtitle?: string;
  needs: string;
  height?: number;
  /** Matches the dark inset chart panel in the Soft UI dashboard. */
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-lg bg-card p-4 shadow-soft">
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-2 rounded-lg px-4 text-center",
          dark ? "grad-dark" : "border border-dashed bg-muted/40",
        )}
        style={{ minHeight: height }}
      >
        <BarChart3 className={cn("h-6 w-6", dark ? "text-white/40" : "text-muted-foreground/60")} />
        <p className={cn("text-xs font-semibold", dark ? "text-white/80" : "text-muted-foreground")}>
          No data yet
        </p>
        <p
          className={cn(
            "max-w-[38ch] text-[11px] leading-snug",
            dark ? "text-white/50" : "text-muted-foreground/80",
          )}
        >
          Needs {needs}
        </p>
      </div>

      <div className="px-1 pt-4">
        <h3 className="text-base font-bold tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
