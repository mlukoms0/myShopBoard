import { NavLink } from "react-router";
import { Truck } from "lucide-react";
import { NAV_ITEMS } from "@/config/nav";
import { cn } from "@/lib/utils";

/**
 * The navigation rail's contents.
 *
 * Rendered in three modes with one component, so they can never drift apart:
 *   - desktop expanded  (240px, icon + label)
 *   - desktop collapsed (56px, icon only, native tooltip on hover)
 *   - mobile drawer     (overlay, always expanded, mobile items only)
 */
export function NavRail({
  collapsed = false,
  onNavigate,
  showMobileOnly = false,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  /** When true, only items flagged `mobile` are shown - see config/nav.ts. */
  showMobileOnly?: boolean;
}) {
  const items = showMobileOnly ? NAV_ITEMS.filter((item) => item.mobile) : NAV_ITEMS;

  return (
    <nav className="flex h-full w-full flex-col bg-nav text-nav-foreground">
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-nav-border",
          collapsed ? "justify-center px-0" : "gap-2.5 px-4",
        )}
      >
        <Truck className="h-5 w-5 shrink-0 text-nav-active" />
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">myShopBoard</div>
            <div className="truncate text-[11px] leading-tight text-nav-muted">
              Fleet Maintenance
            </div>
          </div>
        )}
      </div>

      <div className={cn("flex-1 space-y-0.5 overflow-y-auto py-2", collapsed ? "px-2" : "px-2")}>
        {items.map((item) => {
          const Icon = item.icon;

          // Not built yet: inert and muted rather than a link that 404s.
          if (!item.implemented) {
            return (
              <div
                key={item.to}
                title={collapsed ? `${item.label} — not built yet` : "Not built yet"}
                className={cn(
                  "flex cursor-not-allowed items-center rounded-md py-2 text-sm text-nav-muted/70",
                  collapsed ? "justify-center px-0" : "gap-3 px-3",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    <span className="rounded bg-nav-hover px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
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
                  "flex items-center rounded-md py-2 text-sm transition-colors",
                  collapsed ? "justify-center px-0" : "gap-3 px-3",
                  isActive
                    ? "bg-nav-hover font-medium text-white"
                    : "text-nav-foreground hover:bg-nav-hover hover:text-white",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-nav-active")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {!collapsed && (
        <div className="shrink-0 border-t border-nav-border px-4 py-3 text-[11px] text-nav-muted">
          {/* TODO(auth): replace with the signed-in user and a sign-out control. */}
          Not signed in
        </div>
      )}
    </nav>
  );
}
