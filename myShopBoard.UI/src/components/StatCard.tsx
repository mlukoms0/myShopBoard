import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type StatTone = "primary" | "success" | "danger" | "warning" | "dark";

const TONE_CLASS: Record<StatTone, string> = {
  primary: "grad-primary",
  success: "grad-success",
  danger: "grad-danger",
  warning: "grad-warning",
  dark: "grad-dark",
};

/**
 * The Soft UI stat card: label above a large number on the left, gradient icon tile on the right.
 *
 * `value === null` renders an em dash rather than a zero, so "still loading" is never
 * mistaken for "no trucks are down". tabular-nums stops the figure jittering as it updates.
 */
export function StatCard({
  label,
  value,
  suffix,
  delta,
  deltaTone = "neutral",
  icon: Icon,
  tone = "primary",
  loading,
}: {
  label: string;
  value: number | string | null;
  suffix?: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  icon: LucideIcon;
  tone?: StatTone;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-card p-4 shadow-soft">
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold text-muted-foreground">{label}</div>

        {loading ? (
          <Skeleton className="mt-2 h-7 w-20" />
        ) : (
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums tracking-tight">
              {value === null ? "—" : value}
              {suffix && value !== null && <span className="text-lg">{suffix}</span>}
            </span>
            {delta && (
              <span
                className={cn(
                  "text-xs font-bold",
                  deltaTone === "up" && "text-emerald-600",
                  deltaTone === "down" && "text-destructive",
                  deltaTone === "neutral" && "text-muted-foreground",
                )}
              >
                {delta}
              </span>
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg shadow-tile",
          TONE_CLASS[tone],
        )}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}
