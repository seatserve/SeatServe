import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, ChefHat, Bike, PartyPopper } from "lucide-react";
import { api } from "../lib/api";
import { AppHeader, SeatBadge } from "../components/Shared";

const STATUS_FLOW = [
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "out_for_delivery", label: "On the way", icon: Bike },
  { key: "delivered", label: "Delivered", icon: Check },
];

export default function OrderConfirmationPage() {
  const { slug, orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let alive = true;
    const fetchOrder = async () => {
      try {
        const r = await api.get(`/m/${slug}/orders/${orderId}`);
        if (alive) setOrder(r.data);
      } catch { /* noop */ }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 4000);
    return () => { alive = false; clearInterval(interval); };
  }, [slug, orderId]);

  const currentStep = order ? STATUS_FLOW.findIndex((s) => s.key === order.status) : 0;

  return (
    <div className="min-h-screen cb-grain pb-20">
      <AppHeader title="Order Status" backTo="/" testId="confirmation-header" />
      <main className="max-w-md mx-auto px-5 pt-6">
        <section className="rounded-3xl bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-white/10 p-7 text-center cb-enter" data-testid="confirmation-hero">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center">
            <PartyPopper className="w-7 h-7 text-[#10B981]" />
          </div>
          <h2 className="font-display text-3xl mt-4 tracking-tight">Order Confirmed</h2>
          <p className="text-white/60 text-sm mt-2">Sit back. We'll tiptoe to your seat.</p>
          {order && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Order</span>
              <span className="font-mono text-sm text-[#F5C518]" data-testid="order-short-id">#{order.short_id}</span>
            </div>
          )}
        </section>

        {order && (
          <div className="mt-5 cb-enter-delay-1">
            <SeatBadge theater={order.theater} screen={order.screen} seat={order.seat} testId="confirmation-seat" />
          </div>
        )}

        <section className="mt-6 rounded-2xl bg-[#141414] border border-white/10 p-5 cb-enter-delay-2" data-testid="status-tracker">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Live status</p>
            <p className="text-xs text-white/40 font-mono">ETA ~{order?.eta_minutes ?? 10} min</p>
          </div>
          <div className="mt-5 relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-white/10" />
            <div className="absolute left-5 top-5 w-0.5 bg-[#E50914] transition-all duration-700"
              style={{ height: `${Math.max(0, currentStep) * 50}%` }} />
            <ul className="space-y-6">
              {STATUS_FLOW.map((s, idx) => {
                const Icon = s.icon;
                const reached = idx <= currentStep;
                const current = idx === currentStep;
                return (
                  <li key={s.key} className="flex items-center gap-4" data-testid={`status-step-${s.key}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                      reached ? "bg-[#E50914] border-[#E50914] text-white" : "bg-[#0A0A0A] border-white/15 text-white/40"
                    } ${current ? "cb-pulse" : ""}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`font-display text-base ${reached ? "text-white" : "text-white/50"}`}>{s.label}</p>
                      {current && order && <p className="text-xs text-[#F5C518] mt-0.5">In progress…</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {order && order.notes && (
          <section className="mt-5 rounded-2xl bg-[#F5C518]/5 border border-[#F5C518]/20 p-4 cb-enter-delay-3">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#F5C518] font-semibold mb-1">Your note to the kitchen</p>
            <p className="text-sm text-white/80 italic" data-testid="confirmation-notes">"{order.notes}"</p>
          </section>
        )}

        {order && (
          <section className="mt-5 rounded-2xl bg-[#141414] border border-white/10 p-5 cb-enter-delay-3" data-testid="order-items-summary">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Your order</p>
            <ul className="mt-3 space-y-2 text-sm">
              {order.items.map((it) => (
                <li key={it.item_id} className="flex justify-between text-white/80">
                  <span><span className="text-white/50 font-mono">{it.quantity}×</span> {it.name}</span>
                  <span className="font-mono">₹{(it.price * it.quantity).toFixed(0)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/10 my-3" />
            <div className="flex justify-between items-baseline">
              <span className="font-display text-sm">Total paid</span>
              <span className="font-display text-xl" data-testid="confirmation-total">₹{order.total.toFixed(0)}</span>
            </div>
          </section>
        )}

        <div className="mt-7">
          <Link to={`/m/${slug}/menu`} data-testid="order-more-link"
            className="block w-full min-h-[56px] rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium tracking-wide transition-all active:scale-[0.98] flex items-center justify-center">
            Order Something Else
          </Link>
        </div>
      </main>
    </div>
  );
}
