import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setAuthToken } from "../lib/api";

const AuthContext = createContext(null);

const keyFor = (role) => `cinebites_auth_${role}`;

// Persist tokens separately per role so owner/super-admin/staff don't clobber each other.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (usernameOrEmail, password) => {
    const r = await api.post("/auth/login", { username_or_email: usernameOrEmail, password });
    const { token, user: u } = r.data;
    localStorage.setItem(keyFor(u.role), JSON.stringify({ token, user: u }));
    setAuthToken(token);
    setUser(u);
    setActiveRole(u.role);
    return u;
  }, []);

  const staffLogin = useCallback(async (slug, pin) => {
    const r = await api.post("/auth/staff-login", { slug, pin });
    const { token, user: u } = r.data;
    localStorage.setItem(keyFor("staff"), JSON.stringify({ token, user: u }));
    setAuthToken(token);
    setUser(u);
    setActiveRole("staff");
    return u;
  }, []);

  const logout = useCallback((role) => {
    const target = role || activeRole;
    if (target) localStorage.removeItem(keyFor(target));
    if (target === activeRole) {
      setAuthToken(null);
      setUser(null);
      setActiveRole(null);
    }
  }, [activeRole]);

  const activate = useCallback((role) => {
    const raw = localStorage.getItem(keyFor(role));
    if (!raw) return null;
    try {
      const { token, user: u } = JSON.parse(raw);
      setAuthToken(token);
      setUser(u);
      setActiveRole(role);
      return u;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, activeRole, loading, login, staffLogin, logout, activate, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const getStoredAuth = (role) => {
  try {
    const raw = localStorage.getItem(keyFor(role));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
