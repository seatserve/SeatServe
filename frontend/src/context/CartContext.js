import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";

const CartContext = createContext(null);

const LS_CART = "cinebites_cart_v1";
const LS_SEAT = "cinebites_seat_v1";

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_CART)) || []; } catch { return []; }
  });
  const [seat, setSeatState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_SEAT)) || null; } catch { return null; }
  });

  useEffect(() => { localStorage.setItem(LS_CART, JSON.stringify(items)); }, [items]);
  useEffect(() => {
    if (seat) localStorage.setItem(LS_SEAT, JSON.stringify(seat));
  }, [seat]);

  const setSeat = useCallback((s) => setSeatState(s), []);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.item_id === item.id);
      if (existing) {
        return prev.map((p) => p.item_id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { item_id: item.id, name: item.name, price: item.price, quantity: 1, image: item.image }];
    });
  }, []);

  const decrementItem = useCallback((itemId) => {
    setItems((prev) => prev
      .map((p) => p.item_id === itemId ? { ...p, quantity: p.quantity - 1 } : p)
      .filter((p) => p.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((itemId) => {
    setItems((prev) => prev.filter((p) => p.item_id !== itemId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const { totalCount, totalPrice } = useMemo(() => {
    const totalCount = items.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = items.reduce((s, i) => s + i.quantity * i.price, 0);
    return { totalCount, totalPrice };
  }, [items]);

  const value = { items, seat, setSeat, addItem, decrementItem, removeItem, clearCart, totalCount, totalPrice };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
