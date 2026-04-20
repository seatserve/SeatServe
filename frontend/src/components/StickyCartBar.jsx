import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

export const StickyCartBar = ({ slug }) => {
  const { totalCount, totalPrice } = useCart();
  if (totalCount === 0) return null;
  return (
    <div data-testid="sticky-cart-bar" className="fixed bottom-4 left-4 right-4 md:max-w-md md:mx-auto z-40">
      <Link to={`/m/${slug}/cart`} data-testid="sticky-cart-link"
        className="flex items-center justify-between gap-3 rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white px-5 py-3.5 cb-glow transition-all active:scale-[0.98]">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
            <span data-testid="cart-count-badge"
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#F5C518] text-black text-[10px] font-bold px-1 flex items-center justify-center font-mono">
              {totalCount}
            </span>
          </div>
          <span className="font-medium tracking-wide">View Cart</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono" data-testid="sticky-cart-total">₹{totalPrice.toFixed(0)}</span>
          <span className="opacity-70">→</span>
        </div>
      </Link>
    </div>
  );
};
