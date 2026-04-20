import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { AppHeader, SeatBadge } from "../components/Shared";
import { StickyCartBar } from "../components/StickyCartBar";

const CATEGORIES = ["Popcorn", "Beverages", "Snacks", "Combos"];

export default function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(true);
  const { items, addItem, decrementItem, seat } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!seat) { navigate("/"); return; }
    api.get("/menu").then((r) => { setMenu(r.data); setLoading(false); });
  }, [seat, navigate]);

  const byCategory = useMemo(() => menu.filter((m) => m.category === category), [menu, category]);
  const qtyOf = (id) => items.find((i) => i.item_id === id)?.quantity || 0;

  if (!seat) return null;

  return (
    <div className="min-h-screen cb-grain pb-28 relative">
      <AppHeader title="Menu" backTo="/" testId="menu-header" />

      <main className="max-w-md mx-auto px-5 pt-5">
        <div className="flex justify-between items-center cb-enter">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">In-seat delivery</p>
            <p className="font-display text-sm mt-1" data-testid="menu-seat-summary">
              {seat.theater} · Screen {seat.screen} · Seat {seat.seat}
            </p>
          </div>
          <SeatBadge compact screen={seat.screen} seat={seat.seat} testId="menu-seat-compact" />
        </div>

        {/* Categories */}
        <div className="mt-6 -mx-5 px-5 overflow-x-auto scrollbar-none" data-testid="category-tabs">
          <div className="flex gap-2 w-max">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                data-testid={`category-${c.toLowerCase()}-btn`}
                onClick={() => setCategory(c)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium tracking-wide transition-all active:scale-95 border whitespace-nowrap ${
                  category === c
                    ? "bg-[#E50914] text-white border-[#E50914] cb-glow"
                    : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        <section className="mt-6 space-y-3" data-testid="menu-list">
          {loading && <div className="text-white/50 text-sm">Loading menu…</div>}
          {!loading && byCategory.map((item, idx) => {
            const qty = qtyOf(item.id);
            const soldOut = item.is_available === false || item.stock_count === 0;
            return (
              <article
                key={item.id}
                data-testid={`menu-item-${item.id}`}
                className={`rounded-2xl bg-[#141414] border border-white/5 overflow-hidden flex gap-4 p-3 transition-all hover:bg-white/[0.03] cb-enter ${soldOut ? "opacity-50" : ""}`}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#0A0A0A] relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  {soldOut && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#E50914]">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-base leading-tight">{item.name}</h3>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{item.description}</p>
                    {item.stock_count !== null && item.stock_count !== undefined && item.stock_count > 0 && item.stock_count <= 5 && (
                      <p className="text-[10px] text-[#F5C518] mt-1 font-semibold">Only {item.stock_count} left</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-sm" data-testid={`price-${item.id}`}>₹{item.price.toFixed(0)}</span>
                    {soldOut ? (
                      <span className="text-xs text-white/40 font-semibold tracking-[0.15em] uppercase" data-testid={`soldout-${item.id}`}>Unavailable</span>
                    ) : qty === 0 ? (
                      <button
                        onClick={() => addItem(item)}
                        data-testid={`add-btn-${item.id}`}
                        className="rounded-full bg-[#E50914]/10 hover:bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] px-4 py-2 text-sm font-medium tracking-wide transition-all active:scale-95"
                      >
                        + Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 rounded-full bg-[#E50914] text-white" data-testid={`qty-stepper-${item.id}`}>
                        <button
                          onClick={() => decrementItem(item.id)}
                          data-testid={`dec-btn-${item.id}`}
                          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:scale-90 transition-all"
                          aria-label="Decrease"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-sm w-5 text-center" data-testid={`qty-${item.id}`}>{qty}</span>
                        <button
                          onClick={() => addItem(item)}
                          data-testid={`inc-btn-${item.id}`}
                          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:scale-90 transition-all"
                          aria-label="Increase"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <StickyCartBar />
    </div>
  );
}
