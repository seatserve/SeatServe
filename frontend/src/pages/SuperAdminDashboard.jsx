import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { Shield, Plus, Trash2, ExternalLink, LogOut, Building2, IndianRupee, ShoppingBag, Utensils, Copy, Check } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function SuperAdminDashboard() {
  const { user, activate, logout } = useAuth();
  const nav = useNavigate();
  const [multiplexes, setMultiplexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const u = user || activate("super_admin");
    if (!u || u.role !== "super_admin") { nav("/super-admin/login"); return; }
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const r = await api.get("/super-admin/multiplexes");
      setMultiplexes(r.data);
    } finally { setLoading(false); }
  }, []);

  const onLogout = () => { logout("super_admin"); nav("/"); };

  const totals = multiplexes.reduce((acc, m) => {
    acc.orders += m.total_orders; acc.revenue += m.total_revenue; return acc;
  }, { orders: 0, revenue: 0 });

  return (
    <div className="min-h-screen cb-grain">
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F5C518]/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#F5C518]" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#F5C518]/90 font-semibold">CineBites · Platform</p>
            <h1 className="font-display text-lg leading-tight">Super Admin Console</h1>
          </div>
        </div>
        <button onClick={onLogout} data-testid="sa-logout-btn" className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm transition-all">
          <LogOut className="w-3.5 h-3.5" /><span>Sign out</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 cb-enter">
          <StatCard label="Multiplexes" value={multiplexes.length} Icon={Building2} accent="#FFFFFF" />
          <StatCard label="Total Orders" value={totals.orders} Icon={ShoppingBag} accent="#F5C518" />
          <StatCard label="Total GMV" value={`₹${totals.revenue.toFixed(0)}`} Icon={IndianRupee} accent="#10B981" />
        </section>

        <div className="mt-8 flex justify-between items-center cb-enter-delay-1">
          <h2 className="font-display text-2xl">Multiplexes</h2>
          <button onClick={() => setShowForm(true)} data-testid="create-multiplex-btn"
            className="inline-flex items-center gap-2 rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white px-5 py-2.5 text-sm font-medium cb-glow transition-all active:scale-95">
            <Plus className="w-4 h-4" /><span>Add Multiplex</span>
          </button>
        </div>

        {showForm && <CreateMultiplexForm onDone={() => { setShowForm(false); fetchAll(); }} onCancel={() => setShowForm(false)} />}

        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="multiplexes-grid">
          {loading && <p className="text-white/50">Loading…</p>}
          {!loading && multiplexes.length === 0 && !showForm && (
            <p className="col-span-full text-center py-12 text-white/50">No multiplexes yet. Click "Add Multiplex" to onboard your first customer.</p>
          )}
          {multiplexes.map((m) => (
            <MultiplexCard key={m.id} mx={m} onChanged={fetchAll} />
          ))}
        </section>
      </main>
    </div>
  );
}

const StatCard = ({ label, value, accent, Icon }) => (
  <div className="rounded-2xl bg-[#141414] border border-white/10 p-5">
    <div className="flex items-center justify-between">
      <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">{label}</p>
      <Icon className="w-4 h-4" style={{ color: accent }} />
    </div>
    <p className="font-display text-4xl mt-3" style={{ color: accent }}>{value}</p>
  </div>
);

const MultiplexCard = ({ mx, onChanged }) => {
  const [copied, setCopied] = useState(false);
  const del = async () => {
    if (!window.confirm(`Delete "${mx.name}"? This permanently removes their menu, orders, and owner login.`)) return;
    await api.delete(`/super-admin/multiplexes/${mx.slug}`);
    onChanged();
  };
  const copyOwnerUrl = () => {
    const url = `${window.location.origin}/owner/login`;
    navigator.clipboard.writeText(`${url}\nEmail: ${mx.owner_email}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const impersonate = () => {
    // Save current super admin session for return
    const saSession = localStorage.getItem("cinebites_auth_super_admin");
    if (saSession) {
      localStorage.setItem("cinebites_auth_super_admin_saved", saSession);
    }
    
    // Create temporary owner session for the multiplex
    const ownerSession = {
      token: JSON.parse(saSession).token,
      user: {
        id: mx.id,
        email: mx.owner_email,
        username: mx.owner_username || mx.slug,
        role: "owner",
        multiplex_id: mx.id,
        multiplex_slug: mx.slug,
        name: mx.name + " (Super Admin)",
        is_impersonating: true
      }
    };
    
    localStorage.setItem("cinebites_auth_owner", JSON.stringify(ownerSession));
    
    // Redirect to the owner dashboard
    window.location.href = "/owner";
  };

  return (
    <article className="rounded-2xl bg-[#141414] border border-white/10 p-5 flex flex-col gap-4 cb-enter" data-testid={`mx-card-${mx.slug}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: mx.primary_color + "22", border: `1px solid ${mx.primary_color}55` }}>
            <Building2 className="w-5 h-5" style={{ color: mx.primary_color }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg leading-tight truncate">{mx.name}</h3>
            <p className="text-xs text-white/50 font-mono truncate">/m/{mx.slug}</p>
          </div>
        </div>
        <button onClick={del} data-testid={`delete-mx-${mx.slug}`} className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#E50914]/20 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#E50914] transition-all" title="Delete Multiplex">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-[#0A0A0A] border border-white/10 p-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold">Orders</p>
          <p className="font-display text-xl mt-1">{mx.total_orders}</p>
        </div>
        <div className="rounded-xl bg-[#0A0A0A] border border-white/10 p-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold">Revenue</p>
          <p className="font-display text-lg mt-1 text-[#10B981]">₹{mx.total_revenue.toFixed(0)}</p>
        </div>
        <div className="rounded-xl bg-[#0A0A0A] border border-white/10 p-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold">Min Order</p>
          <p className="font-display text-lg mt-1 text-white/90">₹{mx.minimum_order_value || 150}</p>
        </div>
      </div>

      <div className="rounded-xl bg-[#0A0A0A] border border-white/10 p-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-white/40 font-semibold uppercase tracking-wider text-[9px]">Admin Username</span>
          <span className="text-white/80 font-mono font-bold">{mx.owner_username || mx.slug}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/40 font-semibold uppercase tracking-wider text-[9px]">Admin Email</span>
          <span className="text-white/70 font-mono truncate max-w-[170px]">{mx.owner_email}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={impersonate} className="flex-1 rounded-full bg-[#E50914]/90 hover:bg-[#E50914] text-white py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-[#E50914]/25">
          <Shield className="w-3 h-3" /> Manage Dashboard
        </button>
        <Link to={`/m/${mx.slug}/order?screen=1&seat=A1`} target="_blank" rel="noreferrer"
          className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 w-10 h-10 flex items-center justify-center transition-all" title="Customer View">
          <ExternalLink className="w-4 h-4 text-white/70" />
        </Link>
        <button onClick={copyOwnerUrl} className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 w-10 h-10 flex items-center justify-center transition-all" title="Copy Login Details">
          {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-white/70" />}
        </button>
      </div>
    </article>
  );
};

const CreateMultiplexForm = ({ onDone, onCancel }) => {
  const [form, setForm] = useState({
    name: "", slug: "", owner_email: "", owner_username: "", owner_password: "",
    owner_name: "", staff_pin: "1234", primary_color: "#E50914", logo: "",
    minimum_order_value: "150",
  });
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setSubmitting(true);
    try {
      const body = { ...form };
      if (!body.slug.trim()) delete body.slug;
      if (!body.logo.trim()) delete body.logo;
      body.minimum_order_value = parseFloat(body.minimum_order_value) || 150;
      await api.post("/super-admin/multiplexes", body);
      onDone();
    } catch (e) {
      setErr(formatApiError(e));
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl bg-[#141414] border border-[#E50914]/30 p-6 cb-enter" data-testid="create-mx-form">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl">Onboard New Multiplex</h3>
        <button type="button" onClick={onCancel} className="text-white/50 hover:text-white text-sm">Cancel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Multiplex Name *">
          <input data-testid="mx-name-input" value={form.name} onChange={on("name")} required className="sa-input" placeholder="e.g. Apsara Cinemas" />
        </Field>
        <Field label="URL slug (optional, auto-generated)">
          <input data-testid="mx-slug-input" value={form.slug} onChange={on("slug")} className="sa-input" placeholder="apsara-cinemas" />
        </Field>
        <Field label="Multiplex Admin Username *">
          <input data-testid="mx-owner-username-input" value={form.owner_username} onChange={on("owner_username")} required className="sa-input" placeholder="e.g. Apsara" />
        </Field>
        <Field label="Multiplex Admin Email *">
          <input data-testid="mx-owner-email-input" type="email" value={form.owner_email} onChange={on("owner_email")} required className="sa-input" placeholder="e.g. admin@apsara.in" />
        </Field>
        <Field label="Multiplex Admin Password *">
          <input data-testid="mx-owner-password-input" type="text" value={form.owner_password} onChange={on("owner_password")} required minLength={6} className="sa-input" placeholder="min 6 chars" />
        </Field>
        <Field label="Admin Contact Name">
          <input data-testid="mx-owner-name-input" value={form.owner_name} onChange={on("owner_name")} className="sa-input" placeholder="e.g. Rahul Kumar" />
        </Field>
        <Field label="Staff PIN (for kitchen)">
          <input data-testid="mx-pin-input" value={form.staff_pin} onChange={on("staff_pin")} className="sa-input" placeholder="1234" />
        </Field>
        <Field label="Minimum Order Value (₹) *">
          <input data-testid="mx-min-order-input" type="number" min="0" value={form.minimum_order_value} onChange={on("minimum_order_value")} required className="sa-input" placeholder="150" />
        </Field>
        <Field label="Primary Theme Color">
          <input data-testid="mx-color-input" type="color" value={form.primary_color} onChange={on("primary_color")} className="sa-input h-12 p-1.5 bg-[#0A0A0A] border border-white/10 rounded-xl cursor-pointer w-full" />
        </Field>
        <Field label="Logo URL (optional)">
          <input data-testid="mx-logo-input" value={form.logo} onChange={on("logo")} className="sa-input" placeholder="https://…" />
        </Field>
      </div>

      {err && <p className="mt-4 text-sm text-[#E50914]" data-testid="mx-form-error">{err}</p>}

      <div className="mt-6 flex gap-3">
        <button type="submit" disabled={submitting} data-testid="mx-create-submit"
          className="rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white px-6 py-3 text-sm font-medium cb-glow transition-all active:scale-95 disabled:opacity-60">
          {submitting ? "Creating…" : "Create Multiplex"}
        </button>
      </div>

      <style>{`
        .sa-input {
          width: 100%;
          background: #0A0A0A;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 0 14px;
          height: 48px;
          color: white;
          font-size: 14px;
          transition: all 200ms;
        }
        .sa-input:focus {
          outline: none;
          border-color: #E50914;
          box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.15);
        }
      `}</style>
    </form>
  );
};

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold">{label}</span>
    {children}
  </label>
);
