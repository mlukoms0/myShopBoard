/**
 * Meter values. Returns an em dash for null so "no reading yet" is visually
 * distinguishable from a real zero 
 */
export function formatMeter(value: number | null | undefined, unit: string | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unit ?? ""}`.trim();
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}