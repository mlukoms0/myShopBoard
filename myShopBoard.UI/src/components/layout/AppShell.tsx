import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { Menu, PanelLeftClose, PanelLeftOpen, Truck, X } from "lucide-react";
import { NavRail } from "./NavRail";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "myshopboard.nav.collapsed";

/**
 * Application shell.
 *
 * FULL BLEED BY DESIGN: there is no centred max-width container anywhere. Content runs edge
 * to edge beside the navigation rail, so a wide fleet table or a shop board with six columns
 * uses the whole monitor instead of a column down the middle.
 *
 * Desktop (>= 768px): permanent rail, collapsible between 240px and 56px. The choice is
 *                     remembered in localStorage - a preference that resets every reload is
 *                     worse than no preference at all.
 * Mobile  (<  768px): rail hidden, replaced by a top bar and an overlay drawer.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  // Close the drawer on navigation - otherwise tapping a link leaves it covering the page
  // you just navigated to.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  // Stop the page behind the drawer scrolling while it is open.
  useEffect(() => {
    if (!drawerOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Permanent rail - desktop only */}
      <aside
        className={cn(
          "relative hidden shrink-0 transition-[width] duration-200 md:block",
          collapsed ? "w-14" : "w-60",
        )}
      >
        <NavRail collapsed={collapsed} />

        {/* Collapse toggle. Sits on the rail's edge so it reads as belonging to the rail
            rather than to the page content. */}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="absolute -right-3 top-16 z-10 rounded-full border border-nav-border bg-nav p-1 text-nav-muted shadow-md transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      {/* Overlay drawer - mobile only */}
      {isMobile && drawerOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 animate-fade-in bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 animate-slide-in-left shadow-2xl">
            <NavRail showMobileOnly onNavigate={() => setDrawerOpen(false)} />
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 text-nav-muted transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar. h-14 with generous tap targets - this gets used with gloves on. */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-nav-border bg-nav px-3 md:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
            className="-ml-1 rounded-md p-2 text-nav-foreground transition-colors hover:bg-nav-hover hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Truck className="h-5 w-5 text-nav-active" />
          <span className="text-sm font-semibold text-white">myShopBoard</span>
        </header>

        {/* min-h-0 is required: without it a flex child refuses to shrink, the inner
            overflow never engages, and the whole page scrolls instead of the content. */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
