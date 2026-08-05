import {
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  QrCode,
  Route,
  Settings,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;

  /**
   * False for routes that do not exist yet. They render greyed out and non-clickable
   * rather than as dead links that 404 
   */
  implemented: boolean;

  /**
   * Whether this belongs in the mobile navigation. 
   */
  mobile: boolean;
}

/**
 * Single source of truth for navigation. 
 *
 * TODO(auth): add a `roles` field once ApiRoles exists, and filter on it. Remember that
 * hiding a link is COSMETIC - the real gate is [Authorize] on the API.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", to: "/overview", icon: LayoutDashboard, implemented: true, mobile: true },

  // The full sortable/searchable fleet table. Overview is the dashboard; this is the list.
  { label: "Units", to: "/units", icon: Truck, implemented: true, mobile: true },

  { label: "Shop Board", to: "/board", icon: LayoutGrid, implemented: true, mobile: true },

  // Dispatch side of the house rather than maintenance: available freight, assignments,
  // which unit is pulling what. Scaffolded now so the shape of the product is visible.
  { label: "Load Board", to: "/loads", icon: Route, implemented: false, mobile: true },

  { label: "Issues", to: "/issues", icon: ClipboardList, implemented: false, mobile: true },
  { label: "Service", to: "/service", icon: Wrench, implemented: false, mobile: false },
  { label: "QR Labels", to: "/labels", icon: QrCode, implemented: false, mobile: false },
  { label: "Settings", to: "/settings", icon: Settings, implemented: false, mobile: false },
];
