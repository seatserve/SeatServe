import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, MessageSquare, AlertCircle } from "lucide-react";
import { useCart } from "../context/CartContext";
import { AppHeader, SeatBadge, PrimaryButton } from "../components/Shared";

export default function CartPage() {
  const { slug } = useParams();
  const { items, addItem, decrementItem, removeItem, totalPrice, seat, notes, setNotes } = useCart();
  const navigate = useNavigate();

  if (!seat || seat.slug !== slug) { navigate("/"); return null; }

  const taxes = totalPrice * 0.05;
  const grandTotal = totalPrice + taxes;

  const minValue = parseFloat(seat.minimum_order_value) || 0;
  const isBelowMin = totalPrice < minValue;
  const diff = minValue - totalPrice;

  return (
    <div className="min-h-screen cb-grain pb-48 font-sans">
      <AppHeader title="Your Cart" backTo={`/m/${slug}/menu`} testId="cart-header" />
      
      <main className="max-w-md mx-auto px-5 pt-5">
        <div className="cb-enter">
          <SeatBadge theater={seat.theater} screen={seat.screen} seat={seat.seat} testId="cart-seat-badge" />
          {seat.additional_seats && seat.additional_seats.length > 0 && (
            <div className="mt-2 text-center text-xs text-white/60 font-semibold uppercase tracking-wider bg-white/5 border border-white/5 rounded-full py-1">
              + Additional Seats: {seat.additional_seats.join(", ")}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-16 text-center cb-enter-delay-1" data-testid="cart-empty">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white/50" />
            </div>
            <h2 className="font-display text-2xl mt-5">Your cart is empty</h2>
            <p className="text-sm text-white/50 mt-2">Browse the menu and add something delicious.</p>
            <button onClick={() => navigate(`/m/${slug}/menu`)} data-testid="back-to-menu-btn"
              className="mt-6 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 px-6 py-3 text-sm transition-all active:scale-95">
              Back to Menu
            </button>
          </div>
        ) : (
          <>
            <section className="mt-6 space-y-3" data-testid="cart-items">
              {items.map((it) => (
                <article key={it.item_id} data-testid={`cart-item-${it.item_id}`}
                  className="rounded-2xl bg-[#141414] border border-white/5 p-3 flex gap-3 cb-enter">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#0A0A0A]">
                    <img src={it.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3">
                      <h3 className="font-display text-sm leading-tight text-white/90">{it.name}</h3>
                      <button onClick={() => removeItem(it.item_id)} data-testid={`remove-${it.item_id}`}
                        className="text-white/40 hover:text-[#E50914] transition-colors" aria-label="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 rounded-full bg-white/10 border border-white/10">
                        <button onClick={() => decrementItem(it.item_id)} data-testid={`cart-dec-${it.item_id}`}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all text-white/60" aria-label="Decrease">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-sm w-5 text-center text-white" data-testid={`cart-qty-${it.item_id}`}>{it.quantity}</span>
                        <button onClick={() => addItem({ id: it.item_id, name: it.name, price: it.price, image: it.image })} data-testid={`cart-inc-${it.item_id}`}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all text-white/60" aria-label="Increase">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-mono text-sm text-white/90">₹{(it.price * it.quantity).toFixed(0)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {/* Special instructions */}
            <section className="mt-6 rounded-2xl bg-[#141414] border border-white/10 p-5 cb-enter-delay-1" data-testid="cart-notes">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-[#F5C518]" />
                <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Special Instructions (optional)</p>
              </div>
              <textarea data-testid="cart-notes-input" value={notes || ""} onChange={(e) => setNotes(e.target.value)}
                rows={3} maxLength={500}
                placeholder="e.g. Extra spicy, no onions, knock softly — film is on…"
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:border-[#F5C518]/50 focus:ring-1 focus:ring-[#F5C518]/30 outline-none resize-none transition-all" />
              <p className="text-[10px] text-white/40 mt-2 text-right font-mono" data-testid="notes-char-count">
                {(notes || "").length}/500
              </p>
            </section>

            {/* Minimum Order Value Alert Banner */}
            {isBelowMin && (
              <section className="mt-6 rounded-2xl bg-[#E50914]/15 border border-[#E50914]/40 p-4 text-xs text-white leading-relaxed flex items-start gap-3 cb-enter">
                <AlertCircle className="w-4 h-4 text-[#E50914] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#E50914] uppercase tracking-wider text-[9px] mb-0.5">Minimum Order Constraint</p>
                  <span>Your subtotal of <strong>₹{totalPrice.toFixed(0)}</strong> does not meet the minimum order value of <strong>₹{minValue.toFixed(0)}</strong> for {seat.theater}. Add <strong>₹{diff.toFixed(0)}</strong> worth of items to proceed.</span>
                </div>
              </section>
            )}

            <section className="mt-6 rounded-2xl bg-[#141414] border border-white/10 p-5 cb-enter-delay-2" data-testid="cart-summary">
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Bill summary</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Subtotal</span>
                  <span className="font-mono" data-testid="subtotal">₹{totalPrice.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Taxes & service (5%)</span>
                  <span className="font-mono" data-testid="taxes">₹{taxes.toFixed(0)}</span>
                </div>
                <div className="border-t border-white/10 my-3" />
                <div className="flex justify-between items-baseline">
                  <span className="font-display text-base text-white">Total</span>
                  <span className="font-display text-2xl text-white" data-testid="cart-total">₹{grandTotal.toFixed(0)}</span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:max-w-md md:mx-auto z-40">
          <PrimaryButton 
            testId="proceed-payment-btn" 
            onClick={() => navigate(`/m/${slug}/payment`)}
            disabled={isBelowMin}
          >
            {isBelowMin 
              ? `Min order constraint (Add ₹${diff.toFixed(0)})` 
              : `Proceed to Payment · ₹${grandTotal.toFixed(0)}`
            }
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
