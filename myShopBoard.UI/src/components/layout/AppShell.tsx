import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { Menu, PanelLeftClose, PanelLeftOpen, Truck, X } from "lucide-react";
import { NavRail } from "./NavRail";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "myshopboard.nav.collapsed";

/**
 * Application shell, Soft UI treatment.
 *
 * The rail FLOATS: it sits inset from the window edges as a rounded white card on a soft
 * shadow, rather than being a slab bolted to the side. That inset is the single biggest
 * visual difference between this and a standard admin sidebar.
 *
 * Still full bleed - there is no centred max-width container. Content fills whatever is left
 * of the viewport.
 *
 * Desktop (>= 768px): permanent rail, collapsible 240px <-> icon-only, remembered in localStorage.
 * Mobile  (<  768px): rail hidden, top bar plus an overlay drawer.
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

  // Close the drawer on navigation - otherwise it covers the page you just opened.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

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
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Floating rail - desktop only. The p-3 wrapper is what makes it read as a card. */}
      <aside
        className={cn(
          "relative hidden shrink-0 p-3 pr-0 transition-[width] duration-200 md:block",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <NavRail collapsed={collapsed} />

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="absolute -right-3 top-20 z-10 rounded-full border bg-card p-1.5 text-muted-foreground shadow-soft-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Overlay drawer - mobile only */}
      {isMobile && drawerOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 animate-fade-in bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 animate-slide-in-left p-3">
            <NavRail showMobileOnly onNavigate={() => setDrawerOpen(false)} />
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-6 top-7 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar. h-14 with generous tap targets - used with gloves on. */}
        <header className="m-3 mb-0 flex h-14 shrink-0 items-center gap-3 rounded-lg bg-card px-3 shadow-soft md:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="grad-primary flex h-7 w-7 items-center justify-center rounded-lg shadow-tile">
            <Truck className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">myShopBoard</span>
        </header>

        {/* min-h-0 is required: without it a flex child refuses to shrink, the inner overflow
            never engages, and the whole page scrolls instead of the content. */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
