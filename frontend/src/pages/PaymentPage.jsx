import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Smartphone, Lock } from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { AppHeader, PrimaryButton, SeatBadge } from "../components/Shared";

export default function PaymentPage() {
  const { items, totalPrice, seat, clearCart } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState("upi");
  const [placing, setPlacing] = useState(false);

  const taxes = totalPrice * 0.05;
  const grandTotal = totalPrice + taxes;

  if (!seat || items.length === 0) {
    return (
      <div className="min-h-screen cb-grain">
        <AppHeader title="Payment" backTo="/cart" />
        <div className="max-w-md mx-auto px-5 pt-10 text-white/60">No items to pay for.</div>
      </div>
    );
  }

  const placeOrder = async () => {
    setPlacing(true);
    try {
      // simulate payment delay
      await new Promise((r) => setTimeout(r, 900));
      const res = await api.post("/orders", {
        theater: seat.theater,
        screen: seat.screen,
        seat: seat.seat,
        items,
        payment_method: method,
        total: grandTotal,
      });
      clearCart();
      navigate(`/confirmation/${res.data.id}`);
    } catch (e) {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen cb-grain pb-40">
      <AppHeader title="Payment" backTo="/cart" testId="payment-header" />
      <main className="max-w-md mx-auto px-5 pt-5">
        <div className="cb-enter">
          <SeatBadge theater={seat.theater} screen={seat.screen} seat={seat.seat} testId="payment-seat-badge" />
        </div>

        <section className="mt-6 cb-enter-delay-1">
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold mb-3">Payment method</p>
          <div className="space-y-3" data-testid="payment-methods">
            <button
              onClick={() => setMethod("upi")}
              data-testid="pay-upi-btn"
              className={`w-full rounded-2xl border p-4 flex items-center gap-4 transition-all active:scale-[0.99] ${
                method === "upi" ? "bg-[#E50914]/10 border-[#E50914]/60" : "bg-[#141414] border-white/10 hover:border-white/20"
              }`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${method === "upi" ? "bg-[#E50914]/20" : "bg-white/5"}`}>
                <Smartphone className={`w-5 h-5 ${method === "upi" ? "text-[#E50914]" : "text-white/70"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-display text-base">UPI</p>
                <p className="text-xs text-white/50 mt-0.5">GPay · PhonePe · Paytm</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${method === "upi" ? "border-[#E50914] bg-[#E50914]" : "border-white/30"}`} />
            </button>
            <button
              onClick={() => setMethod("card")}
              data-testid="pay-card-btn"
              className={`w-full rounded-2xl border p-4 flex items-center gap-4 transition-all active:scale-[0.99] ${
                method === "card" ? "bg-[#E50914]/10 border-[#E50914]/60" : "bg-[#141414] border-white/10 hover:border-white/20"
              }`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${method === "card" ? "bg-[#E50914]/20" : "bg-white/5"}`}>
                <CreditCard className={`w-5 h-5 ${method === "card" ? "text-[#E50914]" : "text-white/70"}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-display text-base">Credit / Debit Card</p>
                <p className="text-xs text-white/50 mt-0.5">Visa · Mastercard · Rupay</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${method === "card" ? "border-[#E50914] bg-[#E50914]" : "border-white/30"}`} />
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-[#141414] border border-white/10 p-5 cb-enter-delay-2" data-testid="payment-summary">
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Total payable</p>
              <p className="font-display text-3xl mt-1" data-testid="pay-total">₹{grandTotal.toFixed(0)}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Lock className="w-3 h-3" />
              <span>Secured (mock)</span>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-4 left-4 right-4 md:max-w-md md:mx-auto z-40">
        <PrimaryButton
          testId="place-order-btn"
          onClick={placeOrder}
          disabled={placing}
        >
          {placing ? "Processing…" : `Place Order · ₹${grandTotal.toFixed(0)}`}
        </PrimaryButton>
      </div>
    </div>
  );
}
