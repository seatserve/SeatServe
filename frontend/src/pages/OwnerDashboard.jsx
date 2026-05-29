import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Store, LogOut, ShoppingBag, TrendingUp, Package, ChefHat, Bike, Check, RefreshCw, IndianRupee, BarChart3, Clock, Award, Settings, Plus, Trash2, Download, QrCode, Shield, Save } from "lucide-react";
import QRCode from "react-qr-code";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
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

// Utility to convert an SVG element into a PNG Data URL
const svgToPngDataUrl = (svgElement) => {
  return new Promise((resolve) => {
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      
      // Paint background white
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, 512, 512);
      
      // Draw QR centered with safe margins
      context.drawImage(image, 32, 32, 448, 448);
      URL.revokeObjectURL(blobURL);
      resolve(canvas.toDataURL("image/png"));
    };
    image.src = blobURL;
  });
};

export default function OwnerDashboard() {
  const { user, activate, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("sales");
  const [ready, setReady] = useState(false);
  const [slug, setSlug] = useState(null);

  useEffect(() => {
    let u = user;
    if (!u) {
      u = activate("owner") || activate("super_admin");
    }
    if (!u || (u.role !== "owner" && u.role !== "super_admin")) {
      nav("/owner/login"); return;
    }
    setSlug(u.multiplex_slug || "amb-cinemas");
    setReady(true);
  }, [user, activate, nav]);

  const onLogout = () => { logout(user?.role); nav("/"); };

  // Exit Impersonation Mode
  const isImpersonating = localStorage.getItem("cinebites_auth_super_admin_saved") !== null;
  const isMasterAdmin = user?.role === "super_admin" || user?.is_impersonating || isImpersonating;

  const exitImpersonate = () => {
    localStorage.removeItem("cinebites_auth_owner");
    const sa = localStorage.getItem("cinebites_auth_super_admin_saved");
    if (sa) {
      localStorage.setItem("cinebites_auth_super_admin", sa);
      localStorage.removeItem("cinebites_auth_super_admin_saved");
    }
    window.location.href = "/super-admin";
  };

  if (!ready || !slug) return null;

  return (
    <div className="min-h-screen cb-grain flex flex-col font-sans">
      
      {/* Impersonation override banner */}
      {isImpersonating && (
        <div className="bg-[#E50914] text-white text-xs font-semibold py-2 px-5 flex items-center justify-between shadow-md z-50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 animate-pulse" />
            <span>Super Admin Override Mode: Managing <strong>{user?.name || slug}</strong></span>
          </div>
          <button 
            onClick={exitImpersonate}
            className="bg-black/25 hover:bg-black/45 border border-white/20 rounded-full px-3.5 py-1 text-[11px] transition-all font-bold active:scale-95"
          >
            Exit & Return to Super Admin
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E50914]/15 flex items-center justify-center">
            <Store className="w-5 h-5 text-[#E50914]" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914]/90 font-semibold">Multiplex Dashboard</p>
            <h1 className="font-display text-lg leading-tight" data-testid="owner-theater-name">{user?.name || slug}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/m/${slug}/order?screen=1&seat=A1`} target="_blank" rel="noreferrer"
            className="text-xs text-white/50 hover:text-white/80 transition-colors mr-2">Customer view →</Link>
          <button onClick={onLogout} data-testid="owner-logout-btn" className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm transition-all">
            <LogOut className="w-3.5 h-3.5" /><span>Sign out</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 pt-6 w-full">
        <nav className="flex gap-2 overflow-x-auto pb-1 border-b border-white/5" data-testid="owner-tabs">
          <TabBtn active={tab === "sales"} onClick={() => setTab("sales")} testId="tab-sales" Icon={BarChart3} label="Sales" />
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")} testId="tab-orders" Icon={ShoppingBag} label="Orders" />
          <TabBtn active={tab === "menu"} onClick={() => setTab("menu")} testId="tab-menu" Icon={Package} label="Menu" />
          {isMasterAdmin && (
            <TabBtn active={tab === "settings"} onClick={() => setTab("settings")} testId="tab-settings" Icon={Settings} label="Screens & Settings" />
          )}
        </nav>
      </div>

      <main className="max-w-7xl mx-auto px-5 py-6 flex-1 w-full">
        {tab === "sales" && <SalesTab slug={slug} />}
        {tab === "orders" && <OrdersTab slug={slug} />}
        {tab === "menu" && <InventoryManager slug={slug} />}
        {tab === "settings" && isMasterAdmin && <SettingsTab slug={slug} />}
      </main>
    </div>
  );
}

const TabBtn = ({ active, onClick, testId, Icon, label }) => (
  <button onClick={onClick} data-testid={testId}
    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium tracking-wide border transition-all active:scale-95 ${
      active ? "bg-[#E50914] text-white border-[#E50914] cb-glow animate-pulse-once" : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
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
    <div className="space-y-8 animate-fade-in" data-testid="sales-tab">
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
  <div className="rounded-2xl bg-[#141414] border border-white/10 p-5">
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
    <div data-testid="orders-tab" className="space-y-6">
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

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="flex flex-col items-end gap-1.5">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 border" style={{ background: meta.color + "22", borderColor: meta.color + "55" }}>
            <Icon className="w-3 h-3" style={{ color: meta.color }} />
            <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.payment_status === "paid" ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"}`}>
            {o.payment_status === "paid" ? "PAID" : "UNPAID"}
          </span>
        </div>
      </div>
      <div className="rounded-xl bg-[#0A0A0A] border border-white/10 p-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">Deliver to</p>
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

// ---------- SETTINGS & SCREENS TAB ----------
const SettingsTab = ({ slug }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // Screens & Seating specific state
  const [selectedScreenName, setSelectedScreenName] = useState("");
  const [newScreenName, setNewScreenName] = useState("");
  const [genMode, setGenMode] = useState("range"); // range or manual
  const [genRow, setGenRow] = useState("A");
  const [genStart, setGenStart] = useState("1");
  const [genEnd, setGenEnd] = useState("20");
  const [genManual, setGenManual] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const r = await api.get(`/m/${slug}/settings`);
      setSettings(r.data);
      if (r.data.screens && r.data.screens.length > 0 && !selectedScreenName) {
        setSelectedScreenName(r.data.screens[0].name);
      }
      setLoading(false);
    } catch (e) {
      setErr(formatApiError(e));
      setLoading(false);
    }
  }, [slug, selectedScreenName]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveIdentitySettings = async (e) => {
    e.preventDefault();
    setErr(""); setSuccess(""); setSaving(true);
    try {
      await api.patch(`/m/${slug}/settings`, {
        name: settings.name,
        logo: settings.logo || null,
        staff_pin: settings.staff_pin,
        primary_color: settings.primary_color,
        minimum_order_value: parseFloat(settings.minimum_order_value) || 0,
      });
      setSuccess("Identity settings saved successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setErr(formatApiError(e));
    } finally { setSaving(false); }
  };

  // Add Screen
  const addScreen = async (e) => {
    e.preventDefault();
    if (!newScreenName.trim()) return;
    const name = newScreenName.trim();
    if (settings.screens.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      alert("Screen name already exists.");
      return;
    }
    
    const updated = [...(settings.screens || []), { name, seats: [] }];
    setSaving(true);
    try {
      await api.patch(`/m/${slug}/settings`, { screens: updated });
      setSettings({ ...settings, screens: updated });
      setSelectedScreenName(name);
      setNewScreenName("");
    } catch (e) {
      alert(formatApiError(e));
    } finally { setSaving(false); }
  };

  // Delete Screen
  const deleteScreen = async (screenName) => {
    if (!window.confirm(`Delete screen "${screenName}" and all its QR codes?`)) return;
    const updated = settings.screens.filter((s) => s.name !== screenName);
    setSaving(true);
    try {
      await api.patch(`/m/${slug}/settings`, { screens: updated });
      setSettings({ ...settings, screens: updated });
      if (selectedScreenName === screenName) {
        setSelectedScreenName(updated.length > 0 ? updated[0].name : "");
      }
    } catch (e) {
      alert(formatApiError(e));
    } finally { setSaving(false); }
  };

  // Generate seats bulk
  const generateSeats = async (e) => {
    e.preventDefault();
    if (!selectedScreenName) return;
    
    let seatsList = [];
    if (genMode === "range") {
      const rows = genRow.split(",").map(r => r.trim().toUpperCase()).filter(Boolean);
      const startNum = parseInt(genStart) || 1;
      const endNum = parseInt(genEnd) || 1;
      
      for (const row of rows) {
        for (let i = startNum; i <= endNum; i++) {
          seatsList.push(`${row}${i}`);
        }
      }
    } else {
      seatsList = genManual.split(/[,\n]/).map(s => s.trim().toUpperCase()).filter(Boolean);
    }
    
    if (seatsList.length === 0) {
      alert("Please specify rows/ranges or manual list.");
      return;
    }

    const updated = settings.screens.map((s) => {
      if (s.name === selectedScreenName) {
        // Union sets to prevent duplicates
        const union = Array.from(new Set([...(s.seats || []), ...seatsList]));
        return { ...s, seats: union };
      }
      return s;
    });

    setSaving(true);
    try {
      await api.patch(`/m/${slug}/settings`, { screens: updated });
      setSettings({ ...settings, screens: updated });
      setGenManual("");
      alert(`Successfully generated and saved ${seatsList.length} seat QR codes!`);
    } catch (e) {
      alert(formatApiError(e));
    } finally { setSaving(false); }
  };

  // Delete specific seat
  const deleteSeat = async (seatName) => {
    if (!window.confirm(`Remove seat ${seatName}?`)) return;
    const updated = settings.screens.map((s) => {
      if (s.name === selectedScreenName) {
        return { ...s, seats: s.seats.filter((seat) => seat !== seatName) };
      }
      return s;
    });
    setSaving(true);
    try {
      await api.patch(`/m/${slug}/settings`, { screens: updated });
      setSettings({ ...settings, screens: updated });
    } catch (e) {
      alert(formatApiError(e));
    } finally { setSaving(false); }
  };

  // ZIP Download of QR Codes
  const downloadQrsZip = async () => {
    const activeScreen = settings.screens.find(s => s.name === selectedScreenName);
    if (!activeScreen || !activeScreen.seats || activeScreen.seats.length === 0) return;
    
    setZipLoading(true);
    try {
      const zip = new JSZip();
      
      for (const seat of activeScreen.seats) {
        const svgId = `qr-svg-${selectedScreenName.replace(/\s+/g, "-")}-${seat}`;
        const svgElement = document.getElementById(svgId);
        if (svgElement) {
          const pngUrl = await svgToPngDataUrl(svgElement);
          const base64Data = pngUrl.split(",")[1];
          zip.file(`Screen_${selectedScreenName.replace(/\s+/g, "_")}_Seat_${seat}.png`, base64Data, { base64: true });
        }
      }
      
      const blob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}_${selectedScreenName.replace(/\s+/g, "_")}_qrs.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("ZIP generation failed: " + e.message);
    } finally {
      setZipLoading(false);
    }
  };

  // PDF Download of Catalog
  const downloadQrsPdf = async () => {
    const activeScreen = settings.screens.find(s => s.name === selectedScreenName);
    if (!activeScreen || !activeScreen.seats || activeScreen.seats.length === 0) return;
    
    setPdfLoading(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const theaterName = settings.name || "SeatServe Multiplex";
      let col = 0;
      let row = 0;
      
      for (let i = 0; i < activeScreen.seats.length; i++) {
        const seat = activeScreen.seats[i];
        const svgId = `qr-svg-${selectedScreenName.replace(/\s+/g, "-")}-${seat}`;
        const svgElement = document.getElementById(svgId);
        if (!svgElement) continue;
        
        // Add new A4 page if grid fills up (2 columns, 3 rows = 6 items per page)
        if (i > 0 && col === 0 && row === 0) {
          pdf.addPage();
        }
        
        const pngData = await svgToPngDataUrl(svgElement);
        
        // Coordinate placement (safe margins for A4)
        const x = 12 + col * 95;
        const y = 15 + row * 90;
        
        // Card Border
        pdf.setDrawColor(229, 9, 20); // CineBites brand red
        pdf.setLineWidth(0.5);
        pdf.setFillColor(250, 250, 250);
        pdf.rect(x, y, 90, 80, "FD");
        
        // Card Title (Theater Name)
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(20, 20, 20);
        pdf.text(theaterName, x + 45, y + 10, { align: "center" });
        
        // Card Subtitle (Screen & Seat)
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`${selectedScreenName} · Seat ${seat}`, x + 45, y + 16, { align: "center" });
        
        // QR Code Image
        pdf.addImage(pngData, "PNG", x + 20, y + 20, 50, 50);
        
        // Footer CTA instruction
        pdf.setFontSize(7.5);
        pdf.setTextColor(140, 140, 140);
        pdf.text("Scan to order delicious food right to your seat!", x + 45, y + 75, { align: "center" });
        
        col++;
        if (col === 2) {
          col = 0;
          row++;
          if (row === 3) {
            row = 0;
          }
        }
      }
      
      pdf.save(`${slug}_${selectedScreenName.replace(/\s+/g, "_")}_print.pdf`);
    } catch (e) {
      alert("PDF generation failed: " + e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <p className="text-white/50">Loading settings…</p>;
  if (!settings) return <p className="text-white/50">Unable to load settings.</p>;

  const activeScreen = settings.screens?.find(s => s.name === selectedScreenName) || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" data-testid="settings-tab">
      
      {/* Identity Profile Columns */}
      <section className="lg:col-span-1 space-y-6">
        <form onSubmit={saveIdentitySettings} className="rounded-2xl bg-[#141414] border border-white/10 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-2">
            <Settings className="w-4 h-4 text-[#E50914]" />
            <h3 className="font-display text-base font-semibold">Theater settings</h3>
          </div>
          
          <label className="block">
            <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-bold">Multiplex Name *</span>
            <input type="text" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} required className="cb-input" />
          </label>
          
          <label className="block">
            <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-bold">Minimum Order Value (₹) *</span>
            <input type="number" min="0" value={settings.minimum_order_value} onChange={(e) => setSettings({ ...settings, minimum_order_value: e.target.value })} required className="cb-input" />
          </label>

          <label className="block">
            <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-bold">Staff PIN *</span>
            <input type="text" value={settings.staff_pin} onChange={(e) => setSettings({ ...settings, staff_pin: e.target.value })} required className="cb-input font-mono" />
          </label>

          <label className="block">
            <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-bold">Theme Primary Color *</span>
            <div className="flex gap-2 items-center">
              <input type="color" value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} required className="w-10 h-10 p-1 bg-black/30 border border-white/10 rounded-xl cursor-pointer" />
              <input type="text" value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} required className="cb-input font-mono" />
            </div>
          </label>

          <label className="block">
            <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 font-bold">Logo URL (optional)</span>
            <input type="text" value={settings.logo || ""} onChange={(e) => setSettings({ ...settings, logo: e.target.value })} placeholder="https://..." className="cb-input" />
          </label>

          {err && <p className="text-xs text-[#E50914]">{err}</p>}
          {success && <p className="text-xs text-[#10B981]">{success}</p>}

          <button type="submit" disabled={saving} className="w-full h-11 rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors mt-2 active:scale-95 disabled:opacity-60">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </section>

      {/* Screens & Seating Manager */}
      <section className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl bg-[#141414] border border-white/10 p-6 flex flex-col md:flex-row gap-6 min-h-[450px]">
          
          {/* Screens Sidebar List */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#E50914]" />
                <h3 className="font-display text-base font-semibold">Screens</h3>
              </div>
              
              <div className="space-y-1.5 overflow-y-auto max-h-[250px]">
                {(!settings.screens || settings.screens.length === 0) ? (
                  <p className="text-xs text-white/40">No screens yet. Add one below.</p>
                ) : (
                  settings.screens.map((scr) => (
                    <div key={scr.name} className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium border cursor-pointer transition-all ${selectedScreenName === scr.name ? "bg-[#E50914]/15 border-[#E50914] text-white" : "bg-black/20 border-white/5 text-white/60 hover:bg-white/5 hover:text-white"}`} onClick={() => setSelectedScreenName(scr.name)}>
                      <span>{scr.name} <span className="text-[10px] text-white/40">({scr.seats?.length || 0} seats)</span></span>
                      <button onClick={(e) => { e.stopPropagation(); deleteScreen(scr.name); }} className="text-white/30 hover:text-[#E50914] transition-colors p-0.5" title="Delete Screen">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Screen Form */}
            <form onSubmit={addScreen} className="mt-4 pt-4 border-t border-white/5">
              <label className="block">
                <span className="block text-[9px] uppercase tracking-wider text-white/30 mb-1.5 font-bold">Add Screen</span>
                <div className="flex gap-2">
                  <input type="text" value={newScreenName} onChange={(e) => setNewScreenName(e.target.value)} placeholder="Screen 2" required className="cb-input h-10 flex-1 px-3" />
                  <button type="submit" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </label>
            </form>
          </div>

          {/* Seating QR Grid & Generator */}
          <div className="flex-1 flex flex-col justify-between">
            {activeScreen ? (
              <div className="space-y-6 flex flex-col h-full justify-between">
                
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/5">
                  <div>
                    <h3 className="font-display text-lg font-bold">{activeScreen.name} Seating</h3>
                    <p className="text-xs text-white/50">{activeScreen.seats?.length || 0} total QR codes</p>
                  </div>
                  {activeScreen.seats && activeScreen.seats.length > 0 && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={downloadQrsZip} disabled={zipLoading} className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 text-xs text-white transition-all">
                        <Download className="w-3.5 h-3.5" />
                        <span>{zipLoading ? "Zipping..." : "ZIP QRs"}</span>
                      </button>
                      <button onClick={downloadQrsPdf} disabled={pdfLoading} className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-full bg-[#E50914]/20 hover:bg-[#E50914]/30 border border-[#E50914]/40 px-3.5 py-1.5 text-xs text-[#FFF] transition-all">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{pdfLoading ? "PDF-ing..." : "Print PDF"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* QR Codes Visual Grid */}
                <div className="flex-1 overflow-y-auto max-h-[300px] border border-white/5 rounded-2xl bg-black/30 p-4 my-4">
                  {(!activeScreen.seats || activeScreen.seats.length === 0) ? (
                    <div className="flex flex-col items-center justify-center text-center py-12 text-white/40">
                      <QrCode className="w-8 h-8 opacity-25 mb-2" />
                      <p className="text-xs">No seats generated yet. Use the bulk generator below.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {activeScreen.seats.map((seat) => {
                        const qrUrl = `${window.location.origin}/m/${slug}/order?screen=${encodeURIComponent(selectedScreenName)}&seat=${encodeURIComponent(seat)}`;
                        const svgId = `qr-svg-${selectedScreenName.replace(/\s+/g, "-")}-${seat}`;
                        return (
                          <div key={seat} className="rounded-xl border border-white/5 bg-[#141414] p-3 flex flex-col items-center gap-2 relative group hover:border-[#E50914]/30 transition-all">
                            <span className="text-xs font-bold text-white/80">{seat}</span>
                            <div className="bg-white p-1.5 rounded-lg">
                              <QRCode id={svgId} value={qrUrl} size={64} level="H" />
                            </div>
                            <button onClick={() => deleteSeat(seat)} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-white/40 hover:text-[#E50914] transition-all p-0.5" title="Remove Seat">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bulk Seating Generator */}
                <form onSubmit={generateSeats} className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Bulk QR Generator</span>
                    <div className="flex bg-[#0A0A0A] border border-white/10 rounded-lg p-0.5 text-[10px] font-semibold text-white/60">
                      <button type="button" onClick={() => setGenMode("range")} className={`px-2.5 py-1 rounded-md transition-colors ${genMode === "range" ? "bg-[#E50914] text-white" : "hover:text-white"}`}>Range</button>
                      <button type="button" onClick={() => setGenMode("manual")} className={`px-2.5 py-1 rounded-md transition-colors ${genMode === "manual" ? "bg-[#E50914] text-white" : "hover:text-white"}`}>Manual list</button>
                    </div>
                  </div>

                  {genMode === "range" ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="block text-[8px] text-white/40 mb-1">Rows (e.g. A, B)</span>
                        <input type="text" value={genRow} onChange={(e) => setGenRow(e.target.value)} placeholder="A" required className="cb-input h-9 px-2 text-xs text-center uppercase" />
                      </div>
                      <div>
                        <span className="block text-[8px] text-white/40 mb-1">Start Seat #</span>
                        <input type="number" min="1" value={genStart} onChange={(e) => setGenStart(e.target.value)} required className="cb-input h-9 px-2 text-xs text-center" />
                      </div>
                      <div>
                        <span className="block text-[8px] text-white/40 mb-1">End Seat #</span>
                        <input type="number" min="1" value={genEnd} onChange={(e) => setGenEnd(e.target.value)} required className="cb-input h-9 px-2 text-xs text-center" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="block text-[8px] text-white/40 mb-1">Seats (separated by commas or newlines)</span>
                      <textarea value={genManual} onChange={(e) => setGenManual(e.target.value)} placeholder="A1, A2, B5, C12..." rows={2} required className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all placeholder:text-white/20 resize-none font-mono" />
                    </div>
                  )}

                  <button type="submit" className="w-full h-9 rounded-xl bg-white/5 hover:bg-[#E50914] hover:text-white border border-white/10 hover:border-[#E50914] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Generate & Save Seats</span>
                  </button>
                </form>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 text-white/30 h-full">
                <Store className="w-12 h-12 opacity-20 mb-2" />
                <h4 className="font-display font-semibold text-sm">No Screen Selected</h4>
                <p className="text-xs max-w-xs mt-1 leading-relaxed">Create a Screen on the left sidebar to generate seat QR codes.</p>
              </div>
            )}
          </div>

        </div>
      </section>

      <style>{`
        .cb-input {
          width: 100%;
          background: #070707;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0 14px;
          height: 44px;
          color: white;
          font-size: 13px;
          transition: all 200ms;
        }
        .cb-input:focus {
          outline: none;
          border-color: #E50914;
          box-shadow: 0 0 0 2px rgba(229, 9, 20, 0.15);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes pulseOnce {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .animate-pulse-once {
          animation: pulseOnce 300ms ease-in-out;
        }
      `}</style>
    </div>
  );
};
