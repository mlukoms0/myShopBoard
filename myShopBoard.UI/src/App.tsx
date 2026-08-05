import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import FleetPage from "@/pages/fleet/FleetPage";
import ShopBoardPage from "@/pages/board/ShopBoardPage";

/**
 * Route table.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<FleetPage />} />
          <Route path="/board" element={<ShopBoardPage />} />

          {/* Old path from before the rename, kept so nothing bookmarked breaks. */}
          <Route path="/fleet" element={<Navigate to="/overview" replace />} />

          {/* TODO(qr): /u/:qrToken lands here from a scanned sticker.
              It must redirect to login and back, preserving the token. */}

          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
