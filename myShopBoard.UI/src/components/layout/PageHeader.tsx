import type { ReactNode } from "react";

/**
 * Consistent header strip for every page. Full width, sits directly under the shell chrome.
 * Actions (search, filters, buttons) go in `actions` and sit right-aligned on the same line.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3 md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold leading-tight md:text-lg">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
