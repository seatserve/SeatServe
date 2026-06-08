import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { PrimaryButton } from "../components/Shared";
import { Armchair, Ticket, Plus, Check } from "lucide-react";

export default function SeatLandingPage() {
  const { slug } = useParams();
  const [params, setSearchParams] = useSearchParams();
  const screen = params.get("screen") || "1";
  const seat = params.get("seat") || "A1";
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const { setSeat, clearCart, seat: storedSeat } = useCart();
  const navigate = useNavigate();

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

  const activeScreen = info?.screens?.find(s => s.name === screen);
  const allSeats = activeScreen ? activeScreen.seats : [];

  const handleStartOrdering = () => {
    setSeat({
      ...info,
      slug,
      additional_seats: []
    });
    navigate(`/m/${slug}/menu`);
  };

  const toggleSeat = (s) => {
    if (additionalSeats.includes(s)) {
      setAdditionalSeats(additionalSeats.filter(x => x !== s));
    } else {
      setAdditionalSeats([...additionalSeats, s]);
    }
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
          {!loading && !err && info?.screens && allSeats.length > 0 && (
            <div className="mt-5 pt-5 border-t border-white/5 space-y-3">
              <div>
                <p className="text-[10px] tracking-[0.15em] uppercase text-white/50 font-bold">
                  Order to another seat?
                </p>
                <p className="text-[11px] text-white/40 leading-relaxed mt-0.5">
                  Not sitting in {seat}? Change your seat number manually below.
                </p>
              </div>
              
              <div className="flex gap-2">
                <select
                  data-testid="change-seat-select"
                  value={seat}
                  onChange={(e) => setSearchParams({ screen, seat: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 h-12 text-sm text-white focus:border-[#E50914] outline-none transition-all cursor-pointer"
                >
                  {allSeats.map((s) => (
                    <option key={s} value={s} className="bg-[#141414] text-white">
                      Seat {s} {s === seat ? " (Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
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
