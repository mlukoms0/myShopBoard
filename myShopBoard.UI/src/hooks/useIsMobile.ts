import { useEffect, useState } from "react";

/**
 * Breakpoint below which we render purpose-built mobile views rather than shrinking the
 * desktop ones. 768px is Tailwind's `md`.
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * Client-side mobile detection via matchMedia.
 *
 * Deliberately NOT server-side User-Agent sniffing, which:
 *   - is trivially spoofed and endlessly wrong about new devices,
 *   - breaks when the user resizes a window or rotates a tablet,
 *   - breaks browser dev-tools device emulation, so you cannot test it, and
 *   - poisons any HTTP cache that is not keyed on User-Agent.
 *
 * matchMedia reacts to the ACTUAL viewport, live. Resize the window and the layout swaps.
 *
 * NOTE: exactly ONE implementation of this hook exists, on purpose. myStorage ships both a
 * use-mobile.ts and a use-mobile.tsx with different behaviour, and the .tsx one is silently
 * dead code.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    // Sync once on mount in case the viewport changed before this effect ran.
    setIsMobile(query.matches);
    query.addEventListener("change", onChange);

    return () => query.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
