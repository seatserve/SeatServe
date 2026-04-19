import React, { useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { Film, ScanLine, Shield } from "lucide-react";

const SEATS = [
  { screen: "1", seat: "A5", label: "Screen 1 · A5" },
  { screen: "2", seat: "B12", label: "Screen 2 · B12" },
  { screen: "2", seat: "B13", label: "Screen 2 · B13" },
  { screen: "3", seat: "C5", label: "Screen 3 · C5" },
  { screen: "3", seat: "C6", label: "Screen 3 · C6" },
  { screen: "4", seat: "D8", label: "Screen 4 · D8" },
];

export default function QRDemoPage() {
  const origin = window.location.origin;
  const [active, setActive] = useState(SEATS[1]);
  const activeUrl = `${origin}/order?screen=${active.screen}&seat=${active.seat}`;

  return (
    <div className="min-h-screen cb-grain relative">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E50914]/15 flex items-center justify-center">
            <Film className="w-5 h-5 text-[#E50914]" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914]/80 font-semibold">CineBites</p>
            <h1 className="font-display text-lg leading-tight">Demo Hub</h1>
          </div>
        </div>
        <Link
          to="/admin"
          data-testid="nav-admin-link"
          className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm transition-all"
        >
          <Shield className="w-4 h-4" />
          <span>Staff</span>
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10 md:py-16">
        <section className="cb-enter">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs tracking-[0.2em] uppercase text-white/70 font-semibold">
            <ScanLine className="w-3.5 h-3.5 text-[#F5C518]" />
            Prototype · In-seat ordering
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mt-5 max-w-3xl">
            Scan. Snack. <span className="text-[#E50914]">Screen.</span>
          </h2>
          <p className="text-white/60 max-w-xl mt-4 leading-relaxed">
            Every seat has its own QR. Scan on your phone to open a frictionless ordering flow that
            already knows your theater, screen and seat — no signup, no waiting.
          </p>
        </section>

        <section className="mt-12 grid lg:grid-cols-2 gap-10 items-start cb-enter-delay-1">
          {/* QR preview */}
          <div className="rounded-3xl bg-[#141414] border border-white/10 p-6 md:p-8">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Seat QR preview</p>
            <h3 className="font-display text-2xl mt-2">AMB Cinemas · {active.label}</h3>

            <div className="mt-6 rounded-2xl bg-white p-6 flex items-center justify-center" data-testid="qr-preview">
              <QRCode value={activeUrl} size={220} bgColor="#FFFFFF" fgColor="#0A0A0A" level="M" />
            </div>

            <div className="mt-5 rounded-xl bg-[#0A0A0A] border border-white/10 px-4 py-3 font-mono text-xs text-white/70 break-all" data-testid="qr-url">
              {activeUrl}
            </div>

            <Link
              to={`/order?screen=${active.screen}&seat=${active.seat}`}
              data-testid="qr-open-btn"
              className="mt-6 inline-flex items-center justify-center w-full min-h-[56px] rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white font-medium tracking-wide transition-all active:scale-[0.98] cb-glow"
            >
              Open this seat's order page
            </Link>
          </div>

          {/* Seat picker */}
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold mb-4">Choose a sample seat</p>
            <div className="grid grid-cols-2 gap-3">
              {SEATS.map((s) => {
                const isActive = s.screen === active.screen && s.seat === active.seat;
                return (
                  <button
                    key={`${s.screen}-${s.seat}`}
                    data-testid={`seat-btn-${s.screen}-${s.seat}`}
                    onClick={() => setActive(s)}
                    className={`text-left rounded-2xl border p-4 transition-all active:scale-[0.98] ${
                      isActive
                        ? "bg-[#E50914]/10 border-[#E50914]/60"
                        : "bg-[#141414] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <p className="text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold">Screen {s.screen}</p>
                    <p className="font-display text-xl mt-1">Seat {s.seat}</p>
                    <p className="text-xs text-white/40 mt-2 font-mono truncate">/order?screen={s.screen}&seat={s.seat}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl bg-white/[0.03] border border-white/10 p-5">
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#F5C518] font-semibold">How the demo works</p>
              <ol className="mt-3 space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
                <li>Pick any seat above — each one has its own QR.</li>
                <li>Scan the QR with your phone, or tap "Open this seat's order page".</li>
                <li>Browse the menu, add items, pay (mock) and track your order.</li>
                <li>Staff manage incoming orders from the <Link to="/admin" className="underline text-white">/admin</Link> dashboard.</li>
              </ol>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
