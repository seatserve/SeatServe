import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import QRDemoPage from "./pages/QRDemoPage";
import SeatLandingPage from "./pages/SeatLandingPage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import PaymentPage from "./pages/PaymentPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import AdminPage from "./pages/AdminPage";
import InventoryPage from "./pages/InventoryPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <CartProvider>
          <Routes>
            <Route path="/" element={<QRDemoPage />} />
            <Route path="/order" element={<SeatLandingPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/menu" element={<InventoryPage />} />
          </Routes>
        </CartProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
