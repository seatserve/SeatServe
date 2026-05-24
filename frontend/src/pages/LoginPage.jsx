import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Film, Shield, Store, ArrowRight, Eye, EyeOff, Lock, User, HelpCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  
  const [loginStr, setLoginStr] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Load remembered username/email
  useEffect(() => {
    const saved = localStorage.getItem("seatserve_remember_me");
    if (saved) {
      setLoginStr(saved);
      setRememberMe(true);
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); 
    setLoading(true);
    
    try {
      const u = await login(loginStr, password);
      
      // Save or remove login string from remember me
      if (rememberMe) {
        localStorage.setItem("seatserve_remember_me", loginStr);
      } else {
        localStorage.removeItem("seatserve_remember_me");
      }
      
      // Route based on role
      if (u.role === "super_admin") {
        nav("/super-admin");
      } else if (u.role === "owner") {
        nav("/owner");
      } else {
        setErr("Access denied: Invalid account type.");
      }
    } catch (e) {
      setErr(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-5 cb-grain py-12 overflow-hidden bg-[#0A0A0A] font-sans">
      {/* Background visual accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#E50914]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#F5C518]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-[#141414]/90 border border-white/10 p-8 md:p-10 shadow-2xl backdrop-blur-xl cb-enter z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#E50914] flex items-center justify-center shadow-lg shadow-[#E50914]/25 mb-4 transform hover:scale-105 transition-transform duration-300">
            <Film className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight mb-2">
            Seat<span className="text-[#E50914]">Serve</span>
          </h1>
          <p className="text-white/50 text-sm max-w-xs">
            Enter your credentials to manage menus, orders, screens and seating.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-5" data-testid="login-form">
          
          {/* Username/Email Input */}
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Username or Email
            </label>
            <input 
              data-testid="login-username-input" 
              type="text" 
              value={loginStr} 
              onChange={(e) => setLoginStr(e.target.value)}
              className="w-full bg-[#070707] border border-white/10 rounded-xl h-12 px-4 text-white focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all placeholder:text-white/20"
              placeholder="e.g. Apsara or owner@cinebites.in" 
              required 
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] tracking-[0.2em] uppercase text-white/50 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-white/40 hover:text-[#E50914] transition-colors focus:outline-none flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" /> Forgot password?
              </button>
            </div>
            <div className="relative">
              <input 
                data-testid="login-password-input" 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#070707] border border-white/10 rounded-xl h-12 pl-4 pr-12 text-white focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all placeholder:text-white/20"
                placeholder="••••••••" 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me checkbox */}
          <div className="flex items-center">
            <label className="relative flex items-center cursor-pointer select-none text-xs text-white/60 hover:text-white/90 transition-colors">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-4 h-4 bg-[#070707] border border-white/10 rounded peer-checked:bg-[#E50914] peer-checked:border-[#E50914] transition-all flex items-center justify-center mr-2">
                <div className="w-1.5 h-1.5 bg-white rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              Remember me
            </label>
          </div>

          {/* Error Message */}
          {err && (
            <div className="bg-[#E50914]/10 border border-[#E50914]/20 rounded-xl p-3 text-xs text-[#F0131E] leading-relaxed cb-enter" data-testid="login-error">
              {err}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading} 
            data-testid="login-submit"
            className="w-full h-[54px] rounded-full bg-[#E50914] hover:bg-[#F0131E] text-white font-medium tracking-wide flex items-center justify-center gap-2 cb-glow transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none mt-2"
          >
            {loading ? "Signing you in..." : <>Sign In <ArrowRight className="w-4 h-4" /></>}
          </button>

        </form>

        {/* Footer shortcuts */}
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between text-xs text-white/30">
          <Link to="/super-admin/login" className="hover:text-white/60 transition-colors flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Super Admin Portal
          </Link>
          <Link to="/owner/login" className="hover:text-white/60 transition-colors flex items-center gap-1">
            <Store className="w-3.5 h-3.5" /> Owner Portal
          </Link>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-5 z-50 cb-enter">
          <div className="w-full max-w-sm rounded-3xl bg-[#141414] border border-white/10 p-6 relative">
            <button 
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#0A0A0A] border border-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-full bg-[#F5C518]/15 border border-[#F5C518]/30 flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6 text-[#F5C518]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Reset Password</h3>
            <p className="text-white/60 text-xs leading-relaxed mb-4">
              For security, credentials can only be reset by your platform administrator.
            </p>
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-white/40">Master Email:</span>
                <span className="text-[#E50914] font-medium">owner@cinebites.in</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Support Response:</span>
                <span className="text-white/80">Typically &lt; 2 hours</span>
              </div>
            </div>
            <button 
              onClick={() => setShowForgotModal(false)}
              className="w-full h-11 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-full mt-5 transition-colors"
            >
              Got it, close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
