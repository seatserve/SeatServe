import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Film, Shield, Store, ScanLine, ArrowRight, ExternalLink, MapPin } from "lucide-react";
import { api } from "../lib/api";

export default function QRDemoPage() {
  const [multiplexes, setMultiplexes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Public: no super-admin auth. Fetch via a small public listing workaround —
    // we only expose per-slug info publicly, so for demo we hit a known slug.
    // Instead, expose a public "featured multiplexes" via menu items scope; fallback to AMB.
    api.get("/m/amb-cinemas/info").then((r) => setMultiplexes([r.data])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen cb-grain relative">
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E50914]/15 flex items-center justify-center">
            <Film className="w-5 h-5 text-[#E50914]" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914]/80 font-semibold">CineBites</p>
            <h1 className="font-display text-lg leading-tight">Platform</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/owner/login" data-testid="nav-owner-login" className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm transition-all">
            <Store className="w-3.5 h-3.5" /><span>Owner</span>
          </Link>
          <Link to="/super-admin/login" data-testid="nav-sa-login" className="inline-flex items-center gap-2 rounded-full bg-[#F5C518]/10 hover:bg-[#F5C518]/20 border border-[#F5C518]/30 text-[#F5C518] px-4 py-2 text-sm transition-all">
            <Shield className="w-3.5 h-3.5" /><span>Admin</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-12 md:py-20">
        <section className="cb-enter">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs tracking-[0.2em] uppercase text-white/70 font-semibold">
            <ScanLine className="w-3.5 h-3.5 text-[#F5C518]" />
            Multi-tenant · In-seat ordering
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mt-5 max-w-3xl">
            Every seat. Every snack. <span className="text-[#E50914]">One scan away.</span>
          </h2>
          <p className="text-white/60 max-w-xl mt-4 leading-relaxed">
            CineBites powers in-seat ordering for multiplex chains across India. Each seat has a
            unique QR that opens a frictionless ordering flow — no login, no waiting.
          </p>
        </section>

        <section className="mt-14 grid md:grid-cols-2 gap-6 cb-enter-delay-1">
          <Link to="/owner/login" data-testid="cta-owner"
            className="group rounded-3xl bg-[#141414] border border-white/10 hover:border-[#E50914]/40 p-7 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center mb-5">
              <Store className="w-5 h-5 text-[#E50914]" />
            </div>
            <h3 className="font-display text-xl">I run a multiplex</h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Sign in as owner to view live sales, manage your menu and process orders.
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm text-[#E50914] font-medium">
              Owner login <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link to="/super-admin/login" data-testid="cta-sa"
            className="group rounded-3xl bg-[#141414] border border-white/10 hover:border-[#F5C518]/40 p-7 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#F5C518]/15 border border-[#F5C518]/30 flex items-center justify-center mb-5">
              <Shield className="w-5 h-5 text-[#F5C518]" />
            </div>
            <h3 className="font-display text-xl">I sell CineBites</h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Platform super-admin console to onboard new multiplexes and track GMV.
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm text-[#F5C518] font-medium">
              Super admin <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </section>

        <section className="mt-14 cb-enter-delay-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold">Live demo</p>
              <h3 className="font-display text-2xl mt-1">Try a customer flow</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading && <p className="text-white/50">Loading…</p>}
            {multiplexes.map((m) => (
              <div key={m.slug} className="rounded-2xl bg-[#141414] border border-white/10 p-6 flex flex-col gap-4" data-testid={`demo-mx-${m.slug}`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: m.primary_color + "22", border: `1px solid ${m.primary_color}55` }}>
                    <MapPin className="w-5 h-5" style={{ color: m.primary_color }} />
                  </div>
                  <div>
                    <h4 className="font-display text-lg">{m.name}</h4>
                    <p className="text-xs text-white/50 font-mono">/m/{m.slug}</p>
                  </div>
                </div>
                <p className="text-sm text-white/60">Scan a seat QR — or just click below to simulate:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { s: "1", t: "A5" }, { s: "2", t: "B12" }, { s: "3", t: "C5" },
                  ].map((seat) => (
                    <Link key={seat.s + seat.t}
                      to={`/m/${m.slug}/order?screen=${seat.s}&seat=${seat.t}`}
                      data-testid={`seat-btn-${m.slug}-${seat.s}-${seat.t}`}
                      className="rounded-xl bg-[#0A0A0A] border border-white/10 hover:border-white/20 py-3 text-center transition-all active:scale-95">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/50">Screen {seat.s}</p>
                      <p className="font-display text-base mt-0.5">Seat {seat.t}</p>
                    </Link>
                  ))}
                </div>
                <Link to={`/m/${m.slug}/staff`} data-testid={`staff-link-${m.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 text-sm transition-all">
                  <ExternalLink className="w-3.5 h-3.5" /> Kitchen console
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-white/10 p-7 cb-enter-delay-3">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#F5C518] font-semibold">Try it yourself</p>
          <h3 className="font-display text-2xl mt-2">Demo credentials</h3>
          <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-[#0A0A0A] border border-white/10 p-4">
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#F5C518] font-semibold">Super Admin</p>
              <p className="font-mono text-xs mt-2 text-white/80 break-all">owner@cinebites.in</p>
              <p className="font-mono text-xs text-white/80">owner123</p>
            </div>
            <div className="rounded-xl bg-[#0A0A0A] border border-white/10 p-4">
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914] font-semibold">AMB Owner</p>
              <p className="font-mono text-xs mt-2 text-white/80 break-all">manager@amb.in</p>
              <p className="font-mono text-xs text-white/80">amb123</p>
            </div>
            <div className="rounded-xl bg-[#0A0A0A] border border-white/10 p-4">
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#3B82F6] font-semibold">AMB Staff PIN</p>
              <p className="font-mono text-xs mt-2 text-white/80">at /m/amb-cinemas/staff</p>
              <p className="font-mono text-xs text-white/80">PIN: 1234</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
