import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../lib/api";

export default function SuperAdminLogin() {
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
      if (u.role !== "super_admin") { setErr("This account is not a super-admin"); return; }
      nav("/super-admin");
    } catch (e) {
      setErr(formatApiError(e));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen cb-grain flex items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-[#141414] border border-white/10 p-8 cb-enter" data-testid="super-admin-login-form">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-[#F5C518]/15 border border-[#F5C518]/40 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#F5C518]" />
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#F5C518] font-semibold">Platform Owner</p>
            <h1 className="font-display text-2xl leading-tight">Super Admin</h1>
          </div>
        </div>
        <p className="text-sm text-white/60 mb-6">Manage all multiplexes using CineBites.</p>

        <label className="block text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold mb-1.5">Email</label>
        <input data-testid="sa-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl h-12 px-4 text-white focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all"
          required />
        <label className="block text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold mb-1.5 mt-4">Password</label>
        <input data-testid="sa-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl h-12 px-4 text-white focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all"
          placeholder="••••••••" required />

        {err && <p className="mt-4 text-sm text-[#E50914]" data-testid="sa-login-error">{err}</p>}

        <button type="submit" disabled={loading} data-testid="sa-login-submit"
          className="mt-6 w-full h-[56px] rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white font-medium tracking-wide flex items-center justify-center gap-2 cb-glow transition-all active:scale-[0.98] disabled:opacity-60">
          {loading ? "Signing in…" : <>Sign in <ArrowRight className="w-4 h-4" /></>}
        </button>

        <div className="mt-6 flex justify-between text-xs text-white/40">
          <Link to="/" className="hover:text-white/70 transition-colors">← Home</Link>
          <Link to="/owner/login" className="hover:text-white/70 transition-colors">Owner login →</Link>
        </div>
      </form>
    </div>
  );
}
