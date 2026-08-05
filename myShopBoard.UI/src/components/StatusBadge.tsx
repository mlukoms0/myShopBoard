/**
 * Status chip for a fleet unit.
 *
 * The colour comes from the DATABASE (AssetStatus.ColorHex), not from a hard-coded map in
 * the frontend. Adding "Down - Waiting on Tow" is then a data change, not a code change in
 * two repos that have to stay in sync.
 */
export function StatusBadge({ name, colorHex }: { name: string; colorHex: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        // 1A is ~10% alpha in 8-digit hex - a tint of the status colour for the background.
        backgroundColor: `${colorHex}1A`,
        color: colorHex,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colorHex }} />
      {name}
    </span>
  );
}
