import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Film, ChefHat, Bike, Check, RefreshCw, ListOrdered, Package } from "lucide-react";
import { api } from "../lib/api";

const STATUS_META = {
  preparing: { label: "Preparing", color: "text-[#F5C518]", bg: "bg-[#F5C518]/10", border: "border-[#F5C518]/30", Icon: ChefHat },
  out_for_delivery: { label: "On the way", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10", border: "border-[#3B82F6]/30", Icon: Bike },
  delivered: { label: "Delivered", color: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "border-[#10B981]/30", Icon: Check },
};

const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchOrders = useCallback(async () => {
    const r = await api.get("/orders");
    setOrders(r.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const int = setInterval(fetchOrders, 5000);
    return () => clearInterval(int);
  }, [fetchOrders]);

  const updateStatus = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { status });
    fetchOrders();
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const stats = {
    preparing: orders.filter((o) => o.status === "preparing").length,
    out_for_delivery: orders.filter((o) => o.status === "out_for_delivery").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <div className="min-h-screen cb-grain">
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E50914]/15 flex items-center justify-center">
            <Film className="w-5 h-5 text-[#E50914]" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914]/80 font-semibold">CineBites · Staff</p>
            <h1 className="font-display text-lg leading-tight">Live Orders Console</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/menu"
            data-testid="nav-inventory-link"
            className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm transition-all"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventory</span>
          </Link>
          <button
            onClick={fetchOrders}
            data-testid="refresh-orders-btn"
            className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link to="/" data-testid="admin-home-link" className="text-xs text-white/50 hover:text-white/80 transition-colors">← Home</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8">
        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 cb-enter" data-testid="admin-stats">
          <StatCard label="Total Orders" value={orders.length} accent="#FFFFFF" IconEl={ListOrdered} />
          <StatCard label="Preparing" value={stats.preparing} accent="#F5C518" IconEl={ChefHat} />
          <StatCard label="Out for Delivery" value={stats.out_for_delivery} accent="#3B82F6" IconEl={Bike} />
          <StatCard label="Delivered" value={stats.delivered} accent="#10B981" IconEl={Check} />
        </section>

        {/* Filters */}
        <div className="mt-8 flex gap-2 overflow-x-auto cb-enter-delay-1" data-testid="admin-filters">
          {[
            { k: "all", l: "All" },
            { k: "preparing", l: "Preparing" },
            { k: "out_for_delivery", l: "On the way" },
            { k: "delivered", l: "Delivered" },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              data-testid={`filter-${f.k}-btn`}
              className={`rounded-full px-5 py-2 text-sm font-medium tracking-wide border transition-all active:scale-95 whitespace-nowrap ${
                filter === f.k
                  ? "bg-[#E50914] text-white border-[#E50914]"
                  : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

        {/* Orders grid */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="orders-grid">
          {loading && <p className="text-white/50">Loading orders…</p>}
          {!loading && filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-white/50" data-testid="no-orders">
              No orders here yet.
            </div>
          )}
          {filtered.map((o) => {
            const meta = STATUS_META[o.status];
            const { Icon } = meta;
            return (
              <article
                key={o.id}
                data-testid={`admin-order-${o.id}`}
                className="rounded-2xl bg-[#141414] border border-white/10 p-5 flex flex-col gap-4 cb-enter"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">Order</p>
                    <p className="font-mono text-sm text-[#F5C518] mt-0.5" data-testid={`order-id-${o.id}`}>#{o.short_id}</p>
                  </div>
                  <div className={`inline-flex items-center gap-2 rounded-full ${meta.bg} ${meta.border} border px-3 py-1`} data-testid={`order-status-${o.id}`}>
                    <Icon className={`w-3 h-3 ${meta.color}`} />
                    <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                  </div>
                </div>

                <div className="rounded-xl bg-[#0A0A0A] border border-white/10 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">Deliver to</p>
                    <p className="font-display text-base mt-0.5" data-testid={`order-seat-${o.id}`}>S{o.screen}-{o.seat}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">{o.theater}</p>
                    <p className="text-xs text-white/50 mt-0.5 font-mono">{timeAgo(o.created_at)}</p>
                  </div>
                </div>

                <ul className="space-y-1 text-sm text-white/75" data-testid={`order-items-${o.id}`}>
                  {o.items.map((it) => (
                    <li key={it.item_id} className="flex justify-between">
                      <span><span className="text-white/40 font-mono">{it.quantity}×</span> {it.name}</span>
                      <span className="font-mono text-white/50">₹{(it.price * it.quantity).toFixed(0)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-white/50">Total</span>
                  <span className="font-display text-lg" data-testid={`order-total-${o.id}`}>₹{o.total.toFixed(0)}</span>
                </div>

                <div className="flex gap-2">
                  {o.status === "preparing" && (
                    <button
                      onClick={() => updateStatus(o.id, "out_for_delivery")}
                      data-testid={`mark-out-${o.id}`}
                      className="flex-1 rounded-full bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 border border-[#3B82F6]/40 text-[#3B82F6] py-2.5 text-sm font-medium transition-all active:scale-95"
                    >
                      Mark Out for Delivery
                    </button>
                  )}
                  {o.status === "out_for_delivery" && (
                    <button
                      onClick={() => updateStatus(o.id, "delivered")}
                      data-testid={`mark-delivered-${o.id}`}
                      className="flex-1 rounded-full bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/40 text-[#10B981] py-2.5 text-sm font-medium transition-all active:scale-95"
                    >
                      Mark Delivered
                    </button>
                  )}
                  {o.status === "preparing" && (
                    <button
                      onClick={() => updateStatus(o.id, "preparing")}
                      data-testid={`mark-preparing-${o.id}`}
                      className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-white/60 transition-all active:scale-95"
                      disabled
                    >
                      Preparing
                    </button>
                  )}
                  {o.status === "delivered" && (
                    <span className="flex-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] py-2.5 text-sm font-medium text-center">
                      ✓ Completed
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}

const StatCard = ({ label, value, accent, IconEl }) => (
  <div className="rounded-2xl bg-[#141414] border border-white/10 p-5" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
    <div className="flex items-center justify-between">
      <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">{label}</p>
      <IconEl className="w-4 h-4" style={{ color: accent }} />
    </div>
    <p className="font-display text-4xl mt-3" style={{ color: accent }}>{value}</p>
  </div>
);
