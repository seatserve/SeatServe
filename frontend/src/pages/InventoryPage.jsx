import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Film, Plus, Pencil, Trash2, Check, X, Package, AlertTriangle, ListOrdered } from "lucide-react";
import { api } from "../lib/api";

const CATEGORIES = ["Popcorn", "Beverages", "Snacks", "Combos"];

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "Popcorn",
  image: "",
  is_available: true,
  stock_count: "",
};

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = useCallback(async () => {
    const r = await api.get("/menu");
    setItems(r.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowAdd(false); setError(""); };

  const startEdit = (item) => {
    setEditingId(item.id);
    setShowAdd(false);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      category: item.category,
      image: item.image,
      is_available: item.is_available !== false,
      stock_count: item.stock_count ?? "",
    });
    setError("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Name required";
    if (!form.image.trim()) return "Image URL required";
    const price = parseFloat(form.price);
    if (!price || price <= 0) return "Price must be positive";
    if (form.stock_count !== "" && (isNaN(parseInt(form.stock_count)) || parseInt(form.stock_count) < 0)) return "Stock must be 0 or more";
    return "";
  };

  const submit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      category: form.category,
      image: form.image.trim(),
      is_available: form.is_available,
      stock_count: form.stock_count === "" ? null : parseInt(form.stock_count),
    };
    try {
      if (editingId) {
        await api.patch(`/menu/${editingId}`, body);
      } else {
        await api.post("/menu", body);
      }
      await fetchItems();
      resetForm();
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to save");
    }
  };

  const toggleAvailable = async (item) => {
    await api.patch(`/menu/${item.id}`, { is_available: !item.is_available });
    fetchItems();
  };

  const del = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    await api.delete(`/menu/${item.id}`);
    fetchItems();
  };

  const stats = {
    total: items.length,
    available: items.filter((i) => i.is_available !== false).length,
    unavailable: items.filter((i) => i.is_available === false).length,
    lowStock: items.filter((i) => i.stock_count !== null && i.stock_count !== undefined && i.stock_count > 0 && i.stock_count <= 5).length,
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
            <h1 className="font-display text-lg leading-tight">Inventory Manager</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin" data-testid="nav-orders-link" className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm transition-all">
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Orders</span>
          </Link>
          <Link to="/" className="text-xs text-white/50 hover:text-white/80 transition-colors">← Home</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8">
        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 cb-enter">
          <Stat label="Total Items" value={stats.total} color="#FFFFFF" Icon={Package} />
          <Stat label="Available" value={stats.available} color="#10B981" Icon={Check} />
          <Stat label="Sold Out" value={stats.unavailable} color="#E50914" Icon={X} />
          <Stat label="Low Stock (≤5)" value={stats.lowStock} color="#F5C518" Icon={AlertTriangle} />
        </section>

        {/* Add button + Filters */}
        <div className="mt-8 flex items-center justify-between gap-3 flex-wrap cb-enter-delay-1">
          <div className="flex gap-2 overflow-x-auto">
            {["all", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                data-testid={`inv-filter-${c.toLowerCase()}-btn`}
                className={`rounded-full px-5 py-2 text-sm font-medium tracking-wide border transition-all active:scale-95 whitespace-nowrap ${
                  filter === c
                    ? "bg-[#E50914] text-white border-[#E50914]"
                    : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
                }`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
          <button
            onClick={() => { resetForm(); setShowAdd(true); }}
            data-testid="add-item-btn"
            className="inline-flex items-center gap-2 rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white px-5 py-2.5 text-sm font-medium cb-glow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <ItemForm
            form={form}
            setForm={setForm}
            onSubmit={submit}
            onCancel={resetForm}
            title="Add New Item"
            error={error}
            submitLabel="Create Item"
            testIdPrefix="add"
          />
        )}

        {/* Grid */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="inventory-grid">
          {loading && <p className="text-white/50">Loading…</p>}
          {!loading && filtered.length === 0 && <p className="text-white/50 col-span-full text-center py-12">No items in this category.</p>}
          {filtered.map((item) => {
            const isEditing = editingId === item.id;
            if (isEditing) {
              return (
                <div key={item.id} className="md:col-span-2 lg:col-span-3">
                  <ItemForm
                    form={form}
                    setForm={setForm}
                    onSubmit={submit}
                    onCancel={resetForm}
                    title={`Edit: ${item.name}`}
                    error={error}
                    submitLabel="Save Changes"
                    testIdPrefix="edit"
                  />
                </div>
              );
            }
            const soldOut = item.is_available === false;
            return (
              <article
                key={item.id}
                data-testid={`inv-item-${item.id}`}
                className={`rounded-2xl bg-[#141414] border border-white/10 overflow-hidden flex flex-col cb-enter ${soldOut ? "opacity-70" : ""}`}
              >
                <div className="h-36 bg-[#0A0A0A] relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  {soldOut && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-xs tracking-[0.2em] uppercase font-bold text-[#E50914]">Sold Out</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 rounded-full bg-black/70 backdrop-blur px-3 py-1 text-[10px] tracking-[0.2em] uppercase font-semibold text-white/90">
                    {item.category}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <h3 className="font-display text-base leading-tight">{item.name}</h3>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{item.description || "—"}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono text-base">₹{item.price.toFixed(0)}</span>
                    <span className="text-xs text-white/60 font-mono">
                      {item.stock_count === null || item.stock_count === undefined ? "∞ stock" : `${item.stock_count} left`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => toggleAvailable(item)}
                      data-testid={`toggle-avail-${item.id}`}
                      className={`flex-1 rounded-full text-xs font-medium py-2 transition-all active:scale-95 border ${
                        item.is_available !== false
                          ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/25"
                          : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {item.is_available !== false ? "Available" : "Re-enable"}
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      data-testid={`edit-${item.id}`}
                      className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all active:scale-90"
                      aria-label="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => del(item)}
                      data-testid={`delete-${item.id}`}
                      className="w-9 h-9 rounded-full bg-white/5 hover:bg-[#E50914]/20 border border-white/10 hover:border-[#E50914]/40 flex items-center justify-center transition-all active:scale-90"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}

const Stat = ({ label, value, color, Icon }) => (
  <div className="rounded-2xl bg-[#141414] border border-white/10 p-5">
    <div className="flex items-center justify-between">
      <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">{label}</p>
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <p className="font-display text-4xl mt-3" style={{ color }}>{value}</p>
  </div>
);

const ItemForm = ({ form, setForm, onSubmit, onCancel, title, error, submitLabel, testIdPrefix }) => {
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <section
      className="mt-6 rounded-2xl bg-[#141414] border border-[#E50914]/30 p-6 cb-enter"
      data-testid={`${testIdPrefix}-item-form`}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl">{title}</h2>
        <button onClick={onCancel} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name *">
          <input
            data-testid={`${testIdPrefix}-name-input`}
            value={form.name}
            onChange={on("name")}
            className="inv-input"
            placeholder="e.g. Chicken Popcorn"
          />
        </Field>
        <Field label="Category *">
          <select
            data-testid={`${testIdPrefix}-category-select`}
            value={form.category}
            onChange={on("category")}
            className="inv-input"
          >
            {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#141414]">{c}</option>)}
          </select>
        </Field>
        <Field label="Price (₹) *">
          <input
            data-testid={`${testIdPrefix}-price-input`}
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={on("price")}
            className="inv-input"
            placeholder="299"
          />
        </Field>
        <Field label="Stock (empty = unlimited)">
          <input
            data-testid={`${testIdPrefix}-stock-input`}
            type="number"
            min="0"
            value={form.stock_count}
            onChange={on("stock_count")}
            className="inv-input"
            placeholder="Leave blank for unlimited"
          />
        </Field>
        <Field label="Image URL *" full>
          <input
            data-testid={`${testIdPrefix}-image-input`}
            value={form.image}
            onChange={on("image")}
            className="inv-input"
            placeholder="https://…"
          />
        </Field>
        <Field label="Description" full>
          <textarea
            data-testid={`${testIdPrefix}-description-input`}
            value={form.description}
            onChange={on("description")}
            rows={2}
            className="inv-input resize-none py-3"
            placeholder="Short description shown under the name"
          />
        </Field>

        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, is_available: !form.is_available })}
            data-testid={`${testIdPrefix}-toggle-available`}
            className={`rounded-full px-4 py-2 text-sm font-medium border transition-all active:scale-95 ${
              form.is_available
                ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40"
                : "bg-white/5 text-white/50 border-white/10"
            }`}
          >
            {form.is_available ? "✓ Available" : "✗ Hidden"}
          </button>
          <span className="text-xs text-white/40">Hidden items won't appear on the customer menu.</span>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-[#E50914]" data-testid={`${testIdPrefix}-form-error`}>{error}</p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onSubmit}
          data-testid={`${testIdPrefix}-submit-btn`}
          className="rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white px-6 py-3 text-sm font-medium cb-glow transition-all active:scale-95"
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          data-testid={`${testIdPrefix}-cancel-btn`}
          className="rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 text-sm font-medium transition-all active:scale-95"
        >
          Cancel
        </button>
      </div>

      <style>{`
        .inv-input {
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
        .inv-input:focus {
          outline: none;
          border-color: #E50914;
          box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.15);
        }
        textarea.inv-input { height: auto; min-height: 72px; }
      `}</style>
    </section>
  );
};

const Field = ({ label, children, full = false }) => (
  <label className={`flex flex-col gap-1.5 ${full ? "md:col-span-2" : ""}`}>
    <span className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold">{label}</span>
    {children}
  </label>
);
