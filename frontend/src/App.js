import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { setAuthToken, api } from "./lib/api";
import QRDemoPage from "./pages/QRDemoPage";
import SeatLandingPage from "./pages/SeatLandingPage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import PaymentPage from "./pages/PaymentPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import OwnerLogin from "./pages/OwnerLogin";
import OwnerDashboard from "./pages/OwnerDashboard";
import StaffConsole from "./pages/StaffConsole";

// Restore any active token (pick super_admin > owner > staff preference)
const restore = () => {
  for (const role of ["super_admin", "owner", "staff"]) {
    try {
      const raw = localStorage.getItem(`cinebites_auth_${role}`);
      if (raw) { setAuthToken(JSON.parse(raw).token); break; }
    } catch { /* ignore */ }
  }
  // Global 401 → clear token (but do NOT hard-redirect; pages handle redirects)
  api.interceptors.response.use((r) => r, (err) => {
    if (err?.response?.status === 401) {
      ["super_admin", "owner", "staff"].forEach((r) => localStorage.removeItem(`cinebites_auth_${r}`));
      setAuthToken(null);
    }
    return Promise.reject(err);
  });
};

function App() {
  useEffect(() => { restore(); }, []);
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<QRDemoPage />} />

              {/* Platform auth */}
              <Route path="/super-admin/login" element={<SuperAdminLogin />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/owner/login" element={<OwnerLogin />} />
              <Route path="/owner" element={<OwnerDashboard />} />

              {/* Customer flow (scoped by slug) */}
              <Route path="/m/:slug/order" element={<SeatLandingPage />} />
              <Route path="/m/:slug/menu" element={<MenuPage />} />
              <Route path="/m/:slug/cart" element={<CartPage />} />
              <Route path="/m/:slug/payment" element={<PaymentPage />} />
              <Route path="/m/:slug/confirmation/:orderId" element={<OrderConfirmationPage />} />

              {/* Staff (scoped by slug, PIN gate) */}
              <Route path="/m/:slug/staff" element={<StaffConsole />} />

              {/* Back-compat redirects to AMB (prototype default) */}
              <Route path="/order" element={<Navigate to="/m/amb-cinemas/order" replace />} />
              <Route path="/menu" element={<Navigate to="/m/amb-cinemas/menu" replace />} />
              <Route path="/cart" element={<Navigate to="/m/amb-cinemas/cart" replace />} />
              <Route path="/payment" element={<Navigate to="/m/amb-cinemas/payment" replace />} />
              <Route path="/admin" element={<Navigate to="/m/amb-cinemas/staff" replace />} />
              <Route path="/admin/menu" element={<Navigate to="/owner/login" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
