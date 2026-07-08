import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Armchair, CreditCard, Lock, Phone, Smartphone } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useCart } from "../context/CartContext";
import { AppHeader, PrimaryButton, SeatBadge } from "../components/Shared";

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const normalizePhone = (value) => value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
const validSeat = (value) => /^[A-Z]{1,3}[0-9]{1,3}$/.test(value.trim().toUpperCase());
const parseSeatParts = (value = "") => {
  const match = value.trim().toUpperCase().match(/^([A-Z]{1,3})([0-9]{1,3})$/);
  return {
    row: match ? match[1] : "",
    number: match ? match[2] : "",
  };
};
const buildSeat = (row, number) => `${row.trim().toUpperCase()}${number.trim()}`;

export default function PaymentPage() {
  const { slug } = useParams();
  const { items, totalPrice, seat, setSeat, notes, customerPhone, setCustomerPhone, clearCart } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState("upi");
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState("");
  const initialSeatParts = parseSeatParts(seat?.seat || "");
  const [seatRowInput, setSeatRowInput] = useState(initialSeatParts.row);
  const [seatNumberInput, setSeatNumberInput] = useState(initialSeatParts.number);

  const grandTotal = totalPrice;
  const phoneDigits = normalizePhone(customerPhone || "");
  const cleanSeat = buildSeat(seatRowInput, seatNumberInput);

  if (!seat || seat.slug !== slug || items.length === 0) {
    return (
      <div className="min-h-screen cb-grain">
        <AppHeader title="Payment" backTo={`/m/${slug}/cart`} />
        <div className="max-w-md mx-auto px-5 pt-10 text-white/60">No items to pay for.</div>
      </div>
    );
  }

  const startRazorpayPayment = async () => {
    setErr("");
    if (!validSeat(cleanSeat)) {
      setErr("Enter the row letter and exact seat number, for example row A and seat 11.");
      return;
    }
    if (phoneDigits.length !== 10) {
      setErr("Enter the customer's 10-digit phone number before confirming the order.");
      return;
    }

    setPlacing(true);
    try {
      const updatedSeat = { ...seat, seat: cleanSeat };
      setSeat(updatedSeat);

      const orderRes = await api.post(`/m/${slug}/orders`, {
        screen: updatedSeat.screen,
        seat: cleanSeat,
        additional_seats: updatedSeat.additional_seats || [],
        customer_phone: phoneDigits,
        items,
        payment_method: method,
        total: grandTotal,
        notes: notes || "",
      });
      const order = orderRes.data;

      const gatewayRes = await api.post(`/m/${slug}/payments/razorpay-order`, {
        order_id: order.id,
        amount: grandTotal,
      });
      const { key_id, razorpay_order } = gatewayRes.data;

      const ready = await loadRazorpayScript();
      if (!ready) throw new Error("Razorpay checkout could not be loaded. Check your internet connection.");

      const checkout = new window.Razorpay({
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || key_id,
        amount: razorpay_order.amount,
        currency: razorpay_order.currency,
        name: "SeatServe",
        description: `${seat.theater} - Screen ${updatedSeat.screen}, Seat ${cleanSeat}`,
        order_id: razorpay_order.id,
        prefill: { contact: phoneDigits },
        method,
        theme: { color: "#E50914" },
        handler: async (payment) => {
          try {
            await api.post(`/m/${slug}/payments/razorpay-verify`, {
              order_id: order.id,
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
            });
            clearCart();
            navigate(`/m/${slug}/confirmation/${order.id}`);
          } catch (e) {
            setErr(formatApiError(e));
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });

      checkout.on("payment.failed", (response) => {
        setErr(response?.error?.description || "Payment failed. Please try again.");
        setPlacing(false);
      });
      checkout.open();
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
          <SeatBadge theater={seat.theater} screen={seat.screen} seat={cleanSeat || seat.seat} testId="payment-seat-badge" />
        </div>

        <section className="mt-6 rounded-2xl bg-[#141414] border border-white/10 p-5 cb-enter-delay-1" data-testid="customer-details">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-4 h-4 text-[#F5C518]" />
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Customer phone</p>
          </div>
          <input
            data-testid="customer-phone-input"
            value={customerPhone || ""}
            onChange={(e) => setCustomerPhone(e.target.value.replace(/[^\d+ ]/g, "").slice(0, 14))}
            inputMode="tel"
            placeholder="9876543210"
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl h-12 px-4 text-sm text-white placeholder:text-white/30 focus:border-[#F5C518]/50 focus:ring-1 focus:ring-[#F5C518]/30 outline-none font-mono"
          />

          <div className="mt-5 flex items-center gap-2 mb-3">
            <Armchair className="w-4 h-4 text-[#E50914]" />
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Delivery seat</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-[9px] uppercase tracking-[0.18em] text-white/35 mb-1">Row</span>
              <input
                data-testid="payment-seat-row-input"
                value={seatRowInput}
                onChange={(e) => setSeatRowInput(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3))}
                inputMode="text"
                placeholder="A"
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl h-12 px-4 text-sm text-white placeholder:text-white/30 focus:border-[#E50914]/60 focus:ring-1 focus:ring-[#E50914]/30 outline-none uppercase font-mono"
              />
            </label>
            <label className="block">
              <span className="block text-[9px] uppercase tracking-[0.18em] text-white/35 mb-1">Seat #</span>
              <input
                data-testid="payment-seat-number-input"
                value={seatNumberInput}
                onChange={(e) => setSeatNumberInput(e.target.value.replace(/\D/g, "").slice(0, 3))}
                inputMode="numeric"
                placeholder="11"
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl h-12 px-4 text-sm text-white placeholder:text-white/30 focus:border-[#E50914]/60 focus:ring-1 focus:ring-[#E50914]/30 outline-none font-mono"
              />
            </label>
          </div>
          <p className="mt-2 text-[10px] text-white/35">Example: Row A + Seat 11</p>
        </section>

        <section className="mt-6 cb-enter-delay-1">
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold mb-3">Payment method</p>
          <div className="space-y-3" data-testid="payment-methods">
            <MethodBtn active={method === "upi"} onClick={() => setMethod("upi")} testId="pay-upi-btn" label="UPI" subtitle="GPay, PhonePe, Paytm" Icon={Smartphone} />
            <MethodBtn active={method === "card"} onClick={() => setMethod("card")} testId="pay-card-btn" label="Credit / Debit Card" subtitle="Visa, Mastercard, RuPay" Icon={CreditCard} />
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
        <PrimaryButton testId="place-order-btn" onClick={startRazorpayPayment} disabled={placing}>
          {placing ? "Opening Razorpay..." : `Pay with Razorpay · ₹${grandTotal.toFixed(0)}`}
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
