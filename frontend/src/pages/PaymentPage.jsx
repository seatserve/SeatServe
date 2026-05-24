import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, Smartphone, Lock, X, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
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
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [payingState, setPayingState] = useState("idle"); // idle, paying, success, error

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

  const triggerRazorpayCheckout = () => {
    setShowRazorpay(true);
  };

  const handleRazorpayPayment = async () => {
    setPlacing(true);
    setErr("");
    setPayingState("paying");
    try {
      // 1. Create the pending order
      const res = await api.post(`/m/${slug}/orders`, {
        screen: seat.screen,
        seat: seat.seat,
        additional_seats: seat.additional_seats || [],
        items,
        payment_method: method,
        total: grandTotal,
        notes: notes || "",
      });
      const order = res.data;

      // 2. Simulate short payment delay, then call /pay endpoint
      await new Promise((r) => setTimeout(r, 1200));
      await api.post(`/m/${slug}/orders/${order.id}/pay`);

      setPayingState("success");
      await new Promise((r) => setTimeout(r, 800));
      
      // 3. Clear cart and redirect
      clearCart();
      setShowRazorpay(false);
      navigate(`/m/${slug}/confirmation/${order.id}`);
    } catch (e) {
      setPayingState("error");
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
          {seat.additional_seats && seat.additional_seats.length > 0 && (
            <div className="mt-2 text-center text-xs text-white/60 font-semibold uppercase tracking-wider bg-white/5 border border-white/5 rounded-full py-1">
              + Additional Seats: {seat.additional_seats.join(", ")}
            </div>
          )}
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
              <Lock className="w-3 h-3 text-[#10B981]" /><span>Razorpay Secured</span>
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
        <PrimaryButton testId="place-order-btn" onClick={triggerRazorpayCheckout} disabled={placing}>
          {placing ? "Processing…" : `Place Order · ₹${grandTotal.toFixed(0)}`}
        </PrimaryButton>
      </div>

      {/* RAZORPAY SIMULATOR POPUP MODAL */}
      {showRazorpay && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-5 z-50 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#0F172A] border border-blue-500/20 shadow-2xl relative overflow-hidden font-sans">
            
            {/* Razorpay Brand Bar */}
            <div className="bg-[#1E293B] px-5 py-4 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#3B82F6] flex items-center justify-center text-xs font-bold text-white">R</div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Razorpay Checkout</h4>
                  <p className="text-[9px] text-white/50">Simulated Sandbox</p>
                </div>
              </div>
              {payingState !== "paying" && payingState !== "success" && (
                <button onClick={() => setShowRazorpay(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-6 space-y-5">
              
              {/* Payment Info */}
              <div className="text-center bg-black/30 border border-white/5 rounded-2xl p-4">
                <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Amount to pay</p>
                <p className="text-3xl font-extrabold text-white mt-1">₹{grandTotal.toFixed(2)}</p>
                <p className="text-[10px] text-blue-400 font-semibold mt-1.5">{seat.theater} · S{seat.screen}-{seat.seat}</p>
              </div>

              {payingState === "idle" && (
                <div className="space-y-4">
                  <div className="text-xs text-white/60 leading-relaxed bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-3">
                    <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <span>Click the button below to authorize a mock Razorpay charge. This completes checkout and routes the order immediately to the kitchen.</span>
                  </div>

                  <button
                    onClick={handleRazorpayPayment}
                    className="w-full h-12 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 transition-colors active:scale-98"
                  >
                    <Lock className="w-4 h-4" /> Pay & Authorize Order
                  </button>
                </div>
              )}

              {payingState === "paying" && (
                <div className="flex flex-col items-center py-6 space-y-3">
                  <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-white/80">Securing payment authorization...</p>
                  <p className="text-[10px] text-white/40">Contacting Razorpay Gateway (Sandbox)</p>
                </div>
              )}

              {payingState === "success" && (
                <div className="flex flex-col items-center py-6 space-y-3 animate-pulse">
                  <CheckCircle2 className="w-12 h-12 text-[#10B981]" />
                  <p className="text-sm font-bold text-[#10B981]">Payment Successful!</p>
                  <p className="text-[10px] text-white/40">Routing order ticket to staff console...</p>
                </div>
              )}

              {payingState === "error" && (
                <div className="space-y-4 text-center py-2">
                  <ShieldAlert className="w-12 h-12 text-[#E50914] mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-white">Payment Failed</p>
                    <p className="text-xs text-[#E50914] mt-1">{err || "An error occurred."}</p>
                  </div>
                  <button
                    onClick={() => setPayingState("idle")}
                    className="w-full h-11 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-full transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
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
