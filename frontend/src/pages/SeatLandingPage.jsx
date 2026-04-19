import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { PrimaryButton } from "../components/Shared";
import { Armchair, Ticket } from "lucide-react";

export default function SeatLandingPage() {
  const [params] = useSearchParams();
  const screen = params.get("screen") || "2";
  const seat = params.get("seat") || "B12";
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setSeat, clearCart, seat: storedSeat } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api.get("/theater-info", { params: { screen, seat } }).then((r) => {
      if (!cancelled) {
        setInfo(r.data);
        // If seat changed (different scan), reset cart
        if (storedSeat && (storedSeat.screen !== screen || storedSeat.seat !== seat)) {
          clearCart();
        }
        setSeat(r.data);
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, seat]);

  return (
    <div className="min-h-screen relative cb-grain">
      {/* Hero backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="https://images.pexels.com/photos/7991127/pexels-photo-7991127.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt=""
          className="w-full h-[55vh] object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/50 via-[#0A0A0A]/85 to-[#0A0A0A]" />
      </div>

      <main className="relative max-w-md mx-auto px-5 pt-10 pb-10 min-h-screen flex flex-col">
        <div className="cb-enter">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase text-[#F5C518] font-semibold">
            <Ticket className="w-3.5 h-3.5" />
            QR verified
          </span>
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914]/80 font-semibold mt-8">CineBites</p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight mt-2">
            Welcome to<br />
            <span className="text-white/90">the movies.</span>
          </h1>
          <p className="text-white/60 mt-4 leading-relaxed">
            Your seat just unlocked the menu. We'll deliver right to you — quietly.
          </p>
        </div>

        <div className="mt-10 rounded-3xl bg-white/[0.04] border border-white/10 p-6 cb-seat-glow cb-enter-delay-1" data-testid="seat-landing-card">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center">
              <Armchair className="w-5 h-5 text-[#E50914]" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Delivering to</p>
              <p className="font-display text-xl leading-tight" data-testid="landing-theater-name">
                {loading ? "Loading..." : info?.theater}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 rounded-xl bg-[#0A0A0A] border border-white/10 p-4">
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">Screen</p>
              <p className="font-display text-3xl mt-1" data-testid="landing-screen">{screen}</p>
            </div>
            <div className="flex-1 rounded-xl bg-[#0A0A0A] border border-white/10 p-4">
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">Seat</p>
              <p className="font-display text-3xl mt-1" data-testid="landing-seat">{seat}</p>
            </div>
          </div>
          <p className="mt-5 text-center text-sm text-white/60" data-testid="landing-delivery-msg">
            You are ordering to <span className="text-white font-semibold">Seat {seat}</span>
          </p>
        </div>

        <div className="mt-auto pt-10 cb-enter-delay-2">
          <PrimaryButton
            testId="start-ordering-btn"
            onClick={() => navigate("/menu")}
            disabled={loading}
          >
            Start Ordering
          </PrimaryButton>
          <Link
            to="/"
            data-testid="wrong-seat-link"
            className="mt-4 block text-center text-xs tracking-[0.15em] uppercase text-white/40 hover:text-white/70 transition-colors"
          >
            Wrong seat? Rescan
          </Link>
        </div>
      </main>
    </div>
  );
}
