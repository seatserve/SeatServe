import React, { useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Store, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../lib/api";

export default function OwnerLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const u = await login(email, password);
      if (u.role === "owner" || u.role === "super_admin") {
        nav("/owner");
      } else {
        setErr("This account can't access the owner console");
      }
    } catch (e) {
      setErr(formatApiError(e));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen cb-grain flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-[#141414] border border-white/10 p-8 cb-enter" data-testid="owner-login-form">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 flex items-center justify-center">
            <Store className="w-5 h-5 text-[#E50914]" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#E50914] font-semibold">Multiplex Owner</p>
            <h1 className="font-display text-2xl leading-tight">Owner Login</h1>
          </div>
        </div>
        <p className="text-sm text-white/60 mb-6">View sales, manage menu and orders for your multiplex.</p>

        <label className="block text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold mb-1.5">Email</label>
        <input data-testid="owner-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl h-12 px-4 text-white focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none"
          placeholder="manager@yourmultiplex.in" required />
        <label className="block text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold mb-1.5 mt-4">Password</label>
        <input data-testid="owner-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl h-12 px-4 text-white focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none"
          placeholder="••••••••" required />

        {err && <p className="mt-4 text-sm text-[#E50914]" data-testid="owner-login-error">{err}</p>}

        <button type="submit" disabled={loading} data-testid="owner-login-submit"
          className="mt-6 w-full h-[56px] rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white font-medium tracking-wide flex items-center justify-center gap-2 cb-glow transition-all active:scale-[0.98] disabled:opacity-60">
          {loading ? "Signing in…" : <>Sign in <ArrowRight className="w-4 h-4" /></>}
        </button>

        <div className="mt-6 flex justify-between text-xs text-white/40">
          <Link to="/" className="hover:text-white/70 transition-colors">← Home</Link>
          <Link to="/super-admin/login" className="hover:text-white/70 transition-colors">Platform admin →</Link>
        </div>
      </form>
    </div>
  );
}
