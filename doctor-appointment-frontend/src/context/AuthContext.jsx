// src/context/AuthContext.jsx
// Keeps user in context. Restores session on reload via /auth/refresh.
// Requires axios instance with `withCredentials: true`.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthCtx = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // { id, username, role } | null
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    const res = await api.get("/auth/me");
    const u = res.data?.data?.user || res.data?.user || null;
    setUser(u);
    return u;
  }

  useEffect(() => {
    (async () => {
      try {
        // Try to renew cookie if present. Ignore errors.
        await api.post("/auth/refresh").catch(() => {});
        await fetchMe().catch(() => setUser(null));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login({ username, password }) {
    const res = await api.post("/auth/login", { username, password });
    const u = res.data?.data?.user || res.data?.user || null;
    if (u) setUser(u);
    else await fetchMe().catch(() => setUser(null));
    return res;
  }

  async function logout() {
    try { await api.post("/auth/logout"); } catch {}
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, logout, fetchMe, setUser }),
    [user, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
