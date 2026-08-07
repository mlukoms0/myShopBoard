import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import OverviewPage from "@/pages/overview/OverviewPage";
import UnitsPage from "@/pages/units/UnitsPage";
import ShopBoardPage from "@/pages/board/ShopBoardPage";

/**
 * Route table.
 *
 * NOTE the import source: "react-router", NOT "react-router-dom".
 * react-router-dom was discontinued at v7 - it was only ever a re-export shim - and from
 * v8 onward everything lives in the `react-router` package.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />

          {/* Dashboard: KPIs, globe, charts */}
          <Route path="/overview" element={<OverviewPage />} />

          {/* Unit list plus the detail preview rail */}
          <Route path="/units" element={<UnitsPage />} />

          <Route path="/board" element={<ShopBoardPage />} />

          {/* Old paths, kept so nothing bookmarked breaks. */}
          <Route path="/fleet" element={<Navigate to="/overview" replace />} />

          {/* TODO(qr): /u/:qrToken lands here from a scanned sticker.
              It must redirect to login and back, preserving the token. */}

          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
