import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Film, ChefHat, Bike, Check, RefreshCw, LogOut } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

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

export default function StaffConsole() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user, activeRole, staffLogin, activate, logout } = useAuth();
  const [info, setInfo] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    api.get(`/m/${slug}/info`).then((r) => setInfo(r.data)).catch(() => setInfo({ name: slug }));
    // try activating cached staff token
    const u = user?.role === "staff" && user.multiplex_slug === slug ? user : activate("staff");
    if (u && u.role === "staff" && u.multiplex_slug === slug) setAuthed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submitPin = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await staffLogin(slug, pin);
      setAuthed(true);
    } catch (e) { setErr(formatApiError(e)); }
    finally { setLoading(false); }
  };

  const onLogout = () => { logout("staff"); setAuthed(false); setPin(""); };

  if (!authed) {
    return (
      <div className="min-h-screen cb-grain flex items-center justify-center px-5">
        <form onSubmit={submitPin} className="w-full max-w-md rounded-3xl bg-[#141414] border border-white/10 p-8 cb-enter" data-testid="staff-login-form">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 flex items-center justify-center">
              <Film className="w-5 h-5 text-[#E50914]" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914] font-semibold">Staff Access</p>
              <h1 className="font-display text-2xl leading-tight">{info?.name || slug}</h1>
            </div>
          </div>
          <p className="text-sm text-white/60 mb-6">Enter the staff PIN to view incoming orders.</p>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold mb-1.5">Staff PIN</label>
          <input data-testid="staff-pin-input" type="password" inputMode="numeric" pattern="[0-9]*" value={pin} onChange={(e) => setPin(e.target.value)}
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl h-14 px-4 text-center text-xl font-mono tracking-[0.5em] text-white focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none" placeholder="····" required autoFocus />
          {err && <p className="mt-4 text-sm text-[#E50914]" data-testid="staff-login-error">{err}</p>}
          <button type="submit" disabled={loading} data-testid="staff-login-submit"
            className="mt-6 w-full h-[56px] rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white font-medium tracking-wide cb-glow transition-all active:scale-[0.98] disabled:opacity-60">
            {loading ? "Verifying…" : "Unlock Console"}
          </button>
          <div className="mt-6 flex justify-between text-xs text-white/40">
            <Link to="/" className="hover:text-white/70">← Home</Link>
            <Link to="/owner/login" className="hover:text-white/70">Owner login →</Link>
          </div>
        </form>
      </div>
    );
  }

  return <StaffOrdersList slug={slug} info={info} onLogout={onLogout} />;
}

const StaffOrdersList = ({ slug, info, onLogout }) => {
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
  const counts = {
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
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914]/80 font-semibold">Kitchen Console</p>
            <h1 className="font-display text-lg leading-tight">{info?.name || slug}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchOrders} data-testid="refresh-orders-btn" className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm transition-all">
            <RefreshCw className="w-3.5 h-3.5" /><span>Refresh</span>
          </button>
          <button onClick={onLogout} data-testid="staff-logout-btn" className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm transition-all">
            <LogOut className="w-3.5 h-3.5" /><span>Lock</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 cb-enter">
          <BigStat label="Preparing" value={counts.preparing} color="#F5C518" Icon={ChefHat} />
          <BigStat label="On the way" value={counts.out_for_delivery} color="#3B82F6" Icon={Bike} />
          <BigStat label="Delivered" value={counts.delivered} color="#10B981" Icon={Check} />
        </section>

        <div className="mt-8 flex gap-2 overflow-x-auto" data-testid="staff-filters">
          {["all", "preparing", "out_for_delivery", "delivered"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} data-testid={`filter-${f}-btn`}
              className={`rounded-full px-5 py-2 text-sm font-medium border transition-all active:scale-95 whitespace-nowrap ${
                filter === f ? "bg-[#E50914] text-white border-[#E50914]" : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
              }`}>
              {f === "all" ? "All" : STATUS_META[f]?.label}
            </button>
          ))}
        </div>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="orders-grid">
          {loading && <p className="text-white/50">Loading…</p>}
          {!loading && filtered.length === 0 && <p className="col-span-full text-center py-12 text-white/50" data-testid="no-orders">No orders yet.</p>}
          {filtered.map((o) => {
            const meta = STATUS_META[o.status];
            const { Icon } = meta;
            return (
              <article key={o.id} className="rounded-2xl bg-[#141414] border border-white/10 p-5 flex flex-col gap-4 cb-enter" data-testid={`staff-order-${o.id}`}>
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
                    <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">Seat</p>
                    <p className="font-display text-base mt-0.5">
                      S{o.screen} - Seat {o.seat}
                      {o.additional_seats && o.additional_seats.length > 0 && (
                        <span className="text-xs text-white/40 block mt-0.5 font-normal">
                          + Seats: {o.additional_seats.join(", ")}
                        </span>
                      )}
                    </p>
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
                    <p className="text-sm text-white/90 italic" data-testid={`staff-order-notes-${o.id}`}>"{o.notes}"</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-white/50">Total</span>
                  <span className="font-display text-lg">₹{o.total.toFixed(0)}</span>
                </div>
                {o.status === "preparing" && (
                  <button onClick={() => updateStatus(o.id, "out_for_delivery")} data-testid={`mark-out-${o.id}`}
                    className="w-full rounded-full bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 border border-[#3B82F6]/40 text-[#3B82F6] py-2.5 text-sm font-medium transition-all active:scale-95">
                    Mark Out for Delivery
                  </button>
                )}
                {o.status === "out_for_delivery" && (
                  <button onClick={() => updateStatus(o.id, "delivered")} data-testid={`mark-delivered-${o.id}`}
                    className="w-full rounded-full bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/40 text-[#10B981] py-2.5 text-sm font-medium transition-all active:scale-95">
                    Mark Delivered
                  </button>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
};

const BigStat = ({ label, value, color, Icon }) => (
  <div className="rounded-2xl bg-[#141414] border border-white/10 p-5">
    <div className="flex items-center justify-between">
      <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">{label}</p>
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <p className="font-display text-4xl mt-3" style={{ color }}>{value}</p>
  </div>
);
