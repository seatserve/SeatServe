import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Film } from "lucide-react";

export const AppHeader = ({ title, backTo, testId = "app-header" }) => {
  return (
    <header
      data-testid={testId}
      className="sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center gap-3"
    >
      {backTo ? (
        <Link
          to={backTo}
          data-testid="header-back-btn"
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#E50914]/15 flex items-center justify-center">
          <Film className="w-5 h-5 text-[#E50914]" />
        </div>
      )}
      <div className="flex-1">
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914]/80 font-semibold">CineBites</p>
        <h1 className="font-display text-lg leading-tight" data-testid="header-title">{title}</h1>
      </div>
    </header>
  );
};

export const SeatBadge = ({ theater, screen, seat, compact = false, testId = "seat-badge" }) => {
  if (compact) {
    return (
      <div
        data-testid={testId}
        className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] cb-pulse" />
        <span className="text-xs font-mono tracking-wide text-white/80">
          S{screen}·{seat}
        </span>
      </div>
    );
  }
  return (
    <div data-testid={testId} className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 cb-seat-glow">
      <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-semibold mb-2">
        Delivering to
      </p>
      <p className="font-display text-2xl leading-tight">{theater}</p>
      <div className="flex items-center gap-3 mt-3">
        <div className="rounded-lg bg-[#E50914]/15 border border-[#E50914]/30 px-3 py-1.5">
          <span className="font-mono text-sm text-[#E50914]">Screen {screen}</span>
        </div>
        <div className="rounded-lg bg-white/10 border border-white/15 px-3 py-1.5">
          <span className="font-mono text-sm">Seat {seat}</span>
        </div>
      </div>
    </div>
  );
};

export const PrimaryButton = ({ children, className = "", testId, ...rest }) => (
  <button
    data-testid={testId}
    className={`w-full min-h-[56px] rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white font-medium text-base tracking-wide transition-all active:scale-[0.98] cb-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:cb-glow-none ${className}`}
    {...rest}
  >
    {children}
  </button>
);

export const SecondaryButton = ({ children, className = "", testId, ...rest }) => (
  <button
    data-testid={testId}
    className={`w-full min-h-[56px] rounded-full bg-white/10 hover:bg-white/15 text-white font-medium tracking-wide transition-all active:scale-[0.98] border border-white/10 ${className}`}
    {...rest}
  >
    {children}
  </button>
);
