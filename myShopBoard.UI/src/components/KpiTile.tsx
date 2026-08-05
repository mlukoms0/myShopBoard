import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A single dashboard number.
 *
 * `value === null` renders an em dash, so "still loading" is visually distinct from a real
 * zero. Get this wrong and a manager reads "0 units down" during a slow load and walks away
 * happy. Copied from myStorage's KpiTile, which gets this right.
 *
 * tabular-nums keeps digit widths equal so the number does not jitter as it updates.
 */
export function KpiTile({
  label,
  value,
  suffix,
  loading,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-20" />
        ) : (
          <div className="mt-1 text-3xl font-semibold tabular-nums">
            {value === null ? "—" : value.toLocaleString()}
            {suffix && value !== null && (
              <span className="ml-1 text-lg text-muted-foreground">{suffix}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
