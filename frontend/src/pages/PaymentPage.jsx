import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, Smartphone, Lock } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useCart } from "../context/CartContext";
import { AppHeader, PrimaryButton, SeatBadge } from "../components/Shared";

export default function PaymentPage() {
  const { slug } = useParams();
  const { items, totalPrice, seat, notes, clearCart } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState("upi");
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState("");

  const taxes = totalPrice * 0.05;
  const grandTotal = totalPrice + taxes;

  if (!seat || seat.slug !== slug || items.length === 0) {
    return (
      <div className="min-h-screen cb-grain">
        <AppHeader title="Payment" backTo={`/m/${slug}/cart`} />
        <div className="max-w-md mx-auto px-5 pt-10 text-white/60">No items to pay for.</div>
      </div>
    );
  }

  const placeOrder = async () => {
    setPlacing(true); setErr("");
    try {
      await new Promise((r) => setTimeout(r, 900));
      const res = await api.post(`/m/${slug}/orders`, {
        screen: seat.screen, seat: seat.seat,
        items, payment_method: method, total: grandTotal,
        notes: notes || "",
      });
      clearCart();
      navigate(`/m/${slug}/confirmation/${res.data.id}`);
    } catch (e) {
      setErr(formatApiError(e));
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen cb-grain pb-40">
      <AppHeader title="Payment" backTo={`/m/${slug}/cart`} testId="payment-header" />
      <main className="max-w-md mx-auto px-5 pt-5">
        <div className="cb-enter">
          <SeatBadge theater={seat.theater} screen={seat.screen} seat={seat.seat} testId="payment-seat-badge" />
        </div>

        <section className="mt-6 cb-enter-delay-1">
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold mb-3">Payment method</p>
          <div className="space-y-3" data-testid="payment-methods">
            <MethodBtn active={method === "upi"} onClick={() => setMethod("upi")} testId="pay-upi-btn" label="UPI" subtitle="GPay · PhonePe · Paytm" Icon={Smartphone} />
            <MethodBtn active={method === "card"} onClick={() => setMethod("card")} testId="pay-card-btn" label="Credit / Debit Card" subtitle="Visa · Mastercard · Rupay" Icon={CreditCard} />
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-[#141414] border border-white/10 p-5 cb-enter-delay-2" data-testid="payment-summary">
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Total payable</p>
              <p className="font-display text-3xl mt-1" data-testid="pay-total">₹{grandTotal.toFixed(0)}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Lock className="w-3 h-3" /><span>Secured (mock)</span>
            </div>
          </div>
          {notes && (
            <div className="mt-4 rounded-xl bg-[#F5C518]/5 border border-[#F5C518]/20 p-3">
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#F5C518] font-semibold mb-1">Your note</p>
              <p className="text-xs text-white/80 italic">"{notes}"</p>
            </div>
          )}
        </section>

        {err && <p className="mt-4 text-sm text-[#E50914]" data-testid="payment-error">{err}</p>}
      </main>

      <div className="fixed bottom-4 left-4 right-4 md:max-w-md md:mx-auto z-40">
        <PrimaryButton testId="place-order-btn" onClick={placeOrder} disabled={placing}>
          {placing ? "Processing…" : `Place Order · ₹${grandTotal.toFixed(0)}`}
        </PrimaryButton>
      </div>
    </div>
  );
}

const MethodBtn = ({ active, onClick, testId, label, subtitle, Icon }) => (
  <button onClick={onClick} data-testid={testId}
    className={`w-full rounded-2xl border p-4 flex items-center gap-4 transition-all active:scale-[0.99] ${
      active ? "bg-[#E50914]/10 border-[#E50914]/60" : "bg-[#141414] border-white/10 hover:border-white/20"
    }`}>
    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${active ? "bg-[#E50914]/20" : "bg-white/5"}`}>
      <Icon className={`w-5 h-5 ${active ? "text-[#E50914]" : "text-white/70"}`} />
    </div>
    <div className="flex-1 text-left">
      <p className="font-display text-base">{label}</p>
      <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
    </div>
    <div className={`w-5 h-5 rounded-full border-2 ${active ? "border-[#E50914] bg-[#E50914]" : "border-white/30"}`} />
  </button>
);
