import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { PrimaryButton } from "../components/Shared";
import { Armchair, Ticket, Check } from "lucide-react";

const parseSeatParts = (value = "") => {
  const match = value.trim().toUpperCase().match(/^([A-Z]{1,3})([0-9]{1,3})$/);
  return {
    row: match ? match[1] : "",
    number: match ? match[2] : "",
  };
};

const buildSeat = (row, number) => `${row.trim().toUpperCase()}${number.trim()}`;

export default function SeatLandingPage() {
  const { slug } = useParams();
  const [params, setSearchParams] = useSearchParams();
  const screen = params.get("screen") || "1";
  const seat = params.get("seat") || "A1";
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const initialSeatParts = parseSeatParts(seat);
  const [seatRowInput, setSeatRowInput] = useState(initialSeatParts.row);
  const [seatNumberInput, setSeatNumberInput] = useState(initialSeatParts.number);
  const [seatInputError, setSeatInputError] = useState("");
  const { setSeat, clearCart, seat: storedSeat } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const nextSeatParts = parseSeatParts(seat);
    setSeatRowInput(nextSeatParts.row);
    setSeatNumberInput(nextSeatParts.number);
    setSeatInputError("");
  }, [seat]);

  useEffect(() => {
    let cancelled = false;
    api.get(`/m/${slug}/theater-info`, { params: { screen, seat } }).then((r) => {
      if (cancelled) return;
      setInfo(r.data);
      if (storedSeat && (storedSeat.slug !== slug || storedSeat.screen !== screen || storedSeat.seat !== seat)) {
        clearCart();
      }
      // Initialize with base data
      setSeat({ ...r.data, slug, additional_seats: [] });
      setLoading(false);
    }).catch((e) => {
      if (!cancelled) { setErr("Multiplex not found or QR invalid."); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [screen, seat, slug, clearCart, setSeat, storedSeat]);

  const handleStartOrdering = () => {
    setSeat({
      ...info,
      slug,
      additional_seats: []
    });
    navigate(`/m/${slug}/menu`);
  };

  const applySeatChange = () => {
    const nextSeat = buildSeat(seatRowInput, seatNumberInput);
    if (!/^[A-Z]{1,3}[0-9]{1,3}$/.test(nextSeat)) {
      setSeatInputError("Enter the row letter and exact seat number, for example row A and seat 11.");
      return;
    }
    setSeatInputError("");
    setSearchParams({ screen, seat: nextSeat });
  };

  return (
    <div className="min-h-screen relative cb-grain font-sans">
      <div className="absolute inset-0 pointer-events-none">
        <img src="https://images.pexels.com/photos/7991127/pexels-photo-7991127.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="" className="w-full h-[55vh] object-cover opacity-30 animate-fade-in" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/50 via-[#0A0A0A]/85 to-[#0A0A0A]" />
      </div>

      <main className="relative max-w-md mx-auto px-5 pt-10 pb-10 min-h-screen flex flex-col justify-between">
        
        <div className="cb-enter">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase text-[#F5C518] font-semibold">
            <Ticket className="w-3.5 h-3.5" />
            QR verified
          </span>
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914]/80 font-semibold mt-8">SeatServe</p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight mt-2">
            Welcome to<br />
            <span className="text-white/90">the movies.</span>
          </h1>
          <p className="text-white/60 mt-4 leading-relaxed text-sm">
            Your seat just unlocked the menu. We'll deliver right to you — quietly.
          </p>
        </div>

        <div className="mt-8 rounded-3xl bg-white/[0.04] border border-white/10 p-6 cb-seat-glow cb-enter-delay-1" data-testid="seat-landing-card">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center">
              <Armchair className="w-5 h-5 text-[#E50914]" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Delivering to</p>
              <p className="font-display text-xl leading-tight text-white" data-testid="landing-theater-name">
                {loading ? "Loading..." : err ? "—" : info?.theater}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 rounded-xl bg-[#0A0A0A] border border-white/10 p-4">
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">Screen</p>
              <p className="font-display text-3xl mt-1 text-white" data-testid="landing-screen">{screen}</p>
            </div>
            <div className="flex-1 rounded-xl bg-[#0A0A0A] border border-white/10 p-4">
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">Seat</p>
              <p className="font-display text-3xl mt-1 text-white" data-testid="landing-seat">{seat}</p>
            </div>
          </div>

          {/* Order to another seat option */}
          {!loading && !err && (
            <div className="mt-5 pt-5 border-t border-white/5 space-y-3">
              <div>
                <p className="text-[10px] tracking-[0.15em] uppercase text-white/50 font-bold">
                  Order to another seat?
                </p>
                <p className="text-[11px] text-white/40 leading-relaxed mt-0.5">
                  Not sitting in {seat}? Enter your exact row and seat number below.
                </p>
              </div>
              
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_48px] gap-2">
                <label className="block">
                  <span className="sr-only">Seat row</span>
                  <input
                    data-testid="change-seat-row-input"
                    value={seatRowInput}
                    onChange={(e) => setSeatRowInput(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3))}
                    onKeyDown={(e) => { if (e.key === "Enter") applySeatChange(); }}
                    placeholder="Row"
                    aria-label="Seat row"
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 h-12 text-sm text-white placeholder:text-white/30 focus:border-[#E50914] outline-none transition-all uppercase font-mono"
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Seat number</span>
                  <input
                    data-testid="change-seat-number-input"
                    value={seatNumberInput}
                    onChange={(e) => setSeatNumberInput(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    onKeyDown={(e) => { if (e.key === "Enter") applySeatChange(); }}
                    inputMode="numeric"
                    placeholder="Seat #"
                    aria-label="Seat number"
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 h-12 text-sm text-white placeholder:text-white/30 focus:border-[#E50914] outline-none transition-all font-mono"
                  />
                </label>
                <button
                  type="button"
                  onClick={applySeatChange}
                  data-testid="apply-seat-btn"
                  className="w-12 h-12 rounded-xl bg-[#E50914]/15 hover:bg-[#E50914]/25 border border-[#E50914]/40 text-[#E50914] flex items-center justify-center transition-all active:scale-95"
                  aria-label="Apply seat"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-white/35">Example: Row A + Seat 11</p>
              {seatInputError && <p className="text-xs text-[#E50914]" data-testid="seat-input-error">{seatInputError}</p>}
            </div>
          )}

          {err && <p className="mt-3 text-center text-sm text-[#E50914]" data-testid="landing-error">{err}</p>}
        </div>

        <div className="mt-8 pt-6">
          <PrimaryButton testId="start-ordering-btn" onClick={handleStartOrdering} disabled={loading || !!err}>
            Start Ordering
          </PrimaryButton>
        </div>

      </main>
    </div>
  );
}
