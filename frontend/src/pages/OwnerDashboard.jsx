import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Store, LogOut, ShoppingBag, TrendingUp, Package, ChefHat, Bike, Check, RefreshCw, IndianRupee, BarChart3, Clock, Award } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import InventoryManager from "../components/InventoryManager";

const STATUS_META = {
  preparing: { label: "Preparing", color: "#F5C518", Icon: ChefHat },
  out_for_delivery: { label: "On the way", color: "#3B82F6", Icon: Bike },
  delivered: { label: "Delivered", color: "#10B981", Icon: Check },
};

const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

export default function OwnerDashboard() {
  const { user, activate, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("sales");
  const [ready, setReady] = useState(false);
  const [slug, setSlug] = useState(null);

  useEffect(() => {
    // allow super-admin OR owner
    let u = user;
    if (!u) {
      u = activate("owner") || activate("super_admin");
    }
    if (!u || (u.role !== "owner" && u.role !== "super_admin")) {
      nav("/owner/login"); return;
    }
    setSlug(u.multiplex_slug || "amb-cinemas");
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLogout = () => { logout(user?.role); nav("/"); };
  if (!ready || !slug) return null;

  return (
    <div className="min-h-screen cb-grain">
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E50914]/15 flex items-center justify-center">
            <Store className="w-5 h-5 text-[#E50914]" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914]/90 font-semibold">Owner Console</p>
            <h1 className="font-display text-lg leading-tight" data-testid="owner-theater-name">{user?.name || slug}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/m/${slug}/order?screen=1&seat=A1`} target="_blank" rel="noreferrer"
            className="text-xs text-white/50 hover:text-white/80 transition-colors">Customer view →</Link>
          <button onClick={onLogout} data-testid="owner-logout-btn" className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm transition-all">
            <LogOut className="w-3.5 h-3.5" /><span>Sign out</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 pt-6">
        <nav className="flex gap-2 overflow-x-auto" data-testid="owner-tabs">
          <TabBtn active={tab === "sales"} onClick={() => setTab("sales")} testId="tab-sales" Icon={BarChart3} label="Sales" />
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")} testId="tab-orders" Icon={ShoppingBag} label="Orders" />
          <TabBtn active={tab === "menu"} onClick={() => setTab("menu")} testId="tab-menu" Icon={Package} label="Menu" />
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-5 py-6">
        {tab === "sales" && <SalesTab slug={slug} />}
        {tab === "orders" && <OrdersTab slug={slug} />}
        {tab === "menu" && <InventoryManager slug={slug} />}
      </main>
    </div>
  );
}

const TabBtn = ({ active, onClick, testId, Icon, label }) => (
  <button onClick={onClick} data-testid={testId}
    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium tracking-wide border transition-all active:scale-95 ${
      active ? "bg-[#E50914] text-white border-[#E50914] cb-glow" : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
    }`}>
    <Icon className="w-4 h-4" /><span>{label}</span>
  </button>
);

// ---------- SALES TAB ----------
const SalesTab = ({ slug }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const r = await api.get(`/m/${slug}/sales`);
      setData(r.data); setLoading(false);
    } catch { setLoading(false); }
  }, [slug]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 10000); return () => clearInterval(i); }, [fetchData]);

  if (loading) return <p className="text-white/50">Loading…</p>;
  if (!data) return <p className="text-white/50">Unable to load sales data.</p>;

  return (
    <div className="space-y-8" data-testid="sales-tab">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 cb-enter">
        <BigStat label="Today" orders={data.today.orders} revenue={data.today.revenue} accent="#F5C518" Icon={Clock} />
        <BigStat label="Last 7 days" orders={data.last_7_days.orders} revenue={data.last_7_days.revenue} accent="#3B82F6" Icon={TrendingUp} />
        <BigStat label="Lifetime" orders={data.lifetime.orders} revenue={data.lifetime.revenue} accent="#10B981" Icon={IndianRupee} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 cb-enter-delay-1">
        <div className="rounded-2xl bg-[#141414] border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-[#F5C518]" />
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Top selling items</p>
          </div>
          {data.top_items.length === 0 ? (
            <p className="text-sm text-white/50 py-8 text-center">No orders yet. Sales will appear here.</p>
          ) : (
            <ul className="space-y-3">
              {data.top_items.map((it, i) => (
                <li key={it.name} className="flex items-center gap-3" data-testid={`top-item-${i}`}>
                  <span className="w-8 h-8 rounded-full bg-[#F5C518]/10 border border-[#F5C518]/30 text-[#F5C518] flex items-center justify-center text-sm font-mono">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm truncate">{it.name}</p>
                    <p className="text-xs text-white/50 font-mono">{it.qty} sold</p>
                  </div>
                  <span className="font-mono text-sm text-[#10B981]">₹{it.revenue.toFixed(0)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-[#141414] border border-white/10 p-6">
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold mb-4">Order status breakdown</p>
          {Object.keys(data.status_breakdown).length === 0 ? (
            <p className="text-sm text-white/50 py-8 text-center">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {Object.entries(STATUS_META).map(([key, meta]) => {
                const count = data.status_breakdown[key] || 0;
                const total = Object.values(data.status_breakdown).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const { Icon } = meta;
                return (
                  <li key={key} data-testid={`status-bar-${key}`}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="inline-flex items-center gap-2"><Icon className="w-3.5 h-3.5" style={{ color: meta.color }} /> {meta.label}</span>
                      <span className="font-mono text-white/70">{count} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

const BigStat = ({ label, orders, revenue, accent, Icon }) => (
  <div className="rounded-2xl bg-[#141414] border border-white/10 p-6">
    <div className="flex items-center justify-between">
      <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">{label}</p>
      <Icon className="w-4 h-4" style={{ color: accent }} />
    </div>
    <p className="font-display text-4xl mt-3" style={{ color: accent }}>₹{revenue.toFixed(0)}</p>
    <p className="text-xs text-white/50 mt-1 font-mono">{orders} orders</p>
  </div>
);

// ---------- ORDERS TAB ----------
const OrdersTab = ({ slug }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchOrders = useCallback(async () => {
    try { const r = await api.get(`/m/${slug}/orders`); setOrders(r.data); setLoading(false); }
    catch { setLoading(false); }
  }, [slug]);

  useEffect(() => { fetchOrders(); const i = setInterval(fetchOrders, 5000); return () => clearInterval(i); }, [fetchOrders]);

  const updateStatus = async (id, status) => {
    await api.patch(`/m/${slug}/orders/${id}/status`, { status });
    fetchOrders();
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div data-testid="orders-tab">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 overflow-x-auto">
          {["all", "preparing", "out_for_delivery", "delivered"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} data-testid={`orders-filter-${f}`}
              className={`rounded-full px-5 py-2 text-sm font-medium border transition-all active:scale-95 whitespace-nowrap ${
                filter === f ? "bg-[#E50914] text-white border-[#E50914]" : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
              }`}>
              {f === "all" ? "All" : STATUS_META[f]?.label || f}
            </button>
          ))}
        </div>
        <button onClick={fetchOrders} data-testid="refresh-orders-btn" className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm transition-all">
          <RefreshCw className="w-3.5 h-3.5" /><span>Refresh</span>
        </button>
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <p className="text-white/50">Loading…</p>}
        {!loading && filtered.length === 0 && <p className="col-span-full text-center py-12 text-white/50" data-testid="no-orders">No orders yet.</p>}
        {filtered.map((o) => <OrderCard key={o.id} o={o} onUpdate={updateStatus} />)}
      </section>
    </div>
  );
};

const OrderCard = ({ o, onUpdate }) => {
  const meta = STATUS_META[o.status];
  const { Icon } = meta;
  return (
    <article className="rounded-2xl bg-[#141414] border border-white/10 p-5 flex flex-col gap-4 cb-enter" data-testid={`order-card-${o.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">Order</p>
          <p className="font-mono text-sm text-[#F5C518] mt-0.5">#{o.short_id}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 border" style={{ background: meta.color + "22", borderColor: meta.color + "55" }}>
          <Icon className="w-3 h-3" style={{ color: meta.color }} />
          <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
        </div>
      </div>
      <div className="rounded-xl bg-[#0A0A0A] border border-white/10 p-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">Deliver to</p>
          <p className="font-display text-base mt-0.5">S{o.screen}-{o.seat}</p>
        </div>
        <p className="text-xs text-white/50 font-mono">{timeAgo(o.created_at)}</p>
      </div>
      <ul className="space-y-1 text-sm text-white/75">
        {o.items.map((it) => (
          <li key={it.item_id} className="flex justify-between">
            <span><span className="text-white/40 font-mono">{it.quantity}×</span> {it.name}</span>
            <span className="font-mono text-white/50">₹{(it.price * it.quantity).toFixed(0)}</span>
          </li>
        ))}
      </ul>
      {o.notes && (
        <div className="rounded-xl bg-[#F5C518]/5 border border-[#F5C518]/20 p-3">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#F5C518] font-semibold mb-1">Customer note</p>
          <p className="text-sm text-white/80 italic" data-testid={`order-notes-${o.id}`}>"{o.notes}"</p>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-xs text-white/50">Total</span>
        <span className="font-display text-lg">₹{o.total.toFixed(0)}</span>
      </div>
      {o.status === "preparing" && (
        <button onClick={() => onUpdate(o.id, "out_for_delivery")} data-testid={`mark-out-${o.id}`}
          className="w-full rounded-full bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 border border-[#3B82F6]/40 text-[#3B82F6] py-2.5 text-sm font-medium transition-all active:scale-95">
          Mark Out for Delivery
        </button>
      )}
      {o.status === "out_for_delivery" && (
        <button onClick={() => onUpdate(o.id, "delivered")} data-testid={`mark-delivered-${o.id}`}
          className="w-full rounded-full bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/40 text-[#10B981] py-2.5 text-sm font-medium transition-all active:scale-95">
          Mark Delivered
        </button>
      )}
    </article>
  );
};
