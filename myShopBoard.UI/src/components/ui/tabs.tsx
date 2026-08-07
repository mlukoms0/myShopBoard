import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabDef {
  id: string;
  label: string;
}

/**
 * Minimal controlled tab bar.
 *
 * Hand-written rather than pulling in @radix-ui/react-tabs: this needs a row of buttons and
 * one conditional render, and every dependency is install-time code execution on a machine
 * that can reach the database (see SECURITY_BASELINE.md section 5).
 *
 * Keeps the real ARIA wiring - roles, aria-selected, and arrow-key movement - because those
 * are the part people actually skip when hand-rolling tabs.
 */
export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();

    const index = tabs.findIndex((t) => t.id === active);
    const next = e.key === "ArrowRight" ? index + 1 : index - 1;
    onChange(tabs[(next + tabs.length) % tabs.length].id);
  }

  return (
    <div role="tablist" onKeyDown={onKeyDown} className={cn("flex gap-1 border-b px-2", className)}>
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px border-b-2 px-2.5 py-2 text-xs font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ children, active }: { children: ReactNode; active: boolean }) {
  if (!active) return null;
  return <div role="tabpanel">{children}</div>;
}
