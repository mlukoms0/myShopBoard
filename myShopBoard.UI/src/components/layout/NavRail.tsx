import { NavLink } from "react-router";
import { Truck } from "lucide-react";
import { NAV_ITEMS } from "@/config/nav";
import { cn } from "@/lib/utils";

/**
 * Navigation rail contents, Soft UI treatment.
 *
 * The signature detail: every item carries a small rounded icon tile. Inactive tiles are
 * white on a soft shadow; the active tile is a blue gradient. That is what makes the rail
 * read as Soft UI rather than as a generic sidebar.
 *
 * Rendered in three modes from one component so they cannot drift:
 *   desktop expanded (240px) · desktop collapsed (icon tiles only) · mobile drawer
 */
export function NavRail({
  collapsed = false,
  onNavigate,
  showMobileOnly = false,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  showMobileOnly?: boolean;
}) {
  const items = showMobileOnly ? NAV_ITEMS.filter((item) => item.mobile) : NAV_ITEMS;

  return (
    <nav className="flex h-full w-full flex-col rounded-xl bg-nav text-nav-foreground shadow-soft">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-nav-border",
          collapsed ? "justify-center px-0" : "gap-2.5 px-5",
        )}
      >
        <div className="grad-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-tile">
          <Truck className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-bold tracking-tight text-foreground">myShopBoard</div>
            <div className="truncate text-[11px] leading-tight text-nav-muted">Fleet Maintenance</div>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon;

          if (!item.implemented) {
            return (
              <div
                key={item.to}
                title={collapsed ? `${item.label} — not built yet` : "Not built yet"}
                className={cn(
                  "flex cursor-not-allowed items-center rounded-lg py-2 opacity-55",
                  collapsed ? "justify-center px-0" : "gap-3 px-3",
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card shadow-tile">
                  <Icon className="h-4 w-4 text-nav-muted" />
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-sm">{item.label}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-nav-muted">
                      Soon
                    </span>
                  </>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-lg py-2 transition-all",
                  collapsed ? "justify-center px-0" : "gap-3 px-3",
                  isActive
                    ? "bg-card font-semibold text-foreground shadow-soft-sm"
                    : "text-nav-foreground hover:bg-nav-hover",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-tile",
                      isActive ? "grad-primary" : "bg-card",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-nav-muted")} />
                  </span>
                  {!collapsed && <span className="truncate text-sm">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {!collapsed && (
        <div className="shrink-0 border-t border-nav-border px-5 py-3 text-[11px] text-nav-muted">
          {/* TODO(auth): signed-in user and sign-out control. */}
          Not signed in
        </div>
      )}
    </nav>
  );
}
