import type { ReactNode } from "react";

/**
 * Page header strip. Full width, sits directly under the shell chrome.
 * Actions - search, filters, buttons - sit right-aligned on the same line.
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
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 pb-1 pt-4 md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
