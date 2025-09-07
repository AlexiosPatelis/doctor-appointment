// src/pages/Login.jsx
// Shows flash message from navigation state, logs in via AuthContext,
// redirects to previous page if provided, else to "/".

import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Flash from redirect: navigate("/login", { state: { flash: "..." , redirectTo: "/somewhere" } })
  const initFlash = location.state?.flash || "";
  const redirectTo = location.state?.redirectTo || "/";

  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState(initFlash); // show flash first
  const [submitting, setSubmitting] = useState(false);

  // Optional: clear the history state so flash doesn't reappear on back/forward
  useEffect(() => {
    if (initFlash) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setSubmitting(true);
    try {
      // AuthContext.login should POST /auth/login and set user in context
      await login({ username: form.username.trim(), password: form.password });
      navigate(redirectTo); // go back to intended page or home
    } catch (err) {
      setMsg(err?.response?.data?.error || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Login</h2>

      {/* Flash / error banner */}
      {msg && (
        <div style={{
          margin: "8px 0 12px",
          padding: "8px 10px",
          background: "#FEF3C7",
          border: "1px solid #F59E0B",
          borderRadius: 6,
          color: "#92400E"
        }}>
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 320 }}>
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={onChange}
          autoComplete="username"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={onChange}
          autoComplete="current-password"
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Login"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        No account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}
