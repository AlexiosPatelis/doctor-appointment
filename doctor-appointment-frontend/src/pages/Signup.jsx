// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth?.() || {};

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      // create account
      await api.post("/auth/signup", {
        username: form.username.trim(),
        password: form.password,
      });

      // login: prefer context if it exists, else direct API call
      if (typeof login === "function") {
        await login({ username: form.username, password: form.password });
      } else {
        await api.post("/auth/login", {
          username: form.username,
          password: form.password,
        });
      }

      navigate("/");
    } catch (err) {
      const m = err?.response?.data?.error || "Sign up failed";
      setMsg(m);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }} className="card">
      <h2>Sign up</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 10 }}>
        <input
          name="username"
          placeholder="Choose a username"
          value={form.username}
          onChange={onChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Choose a password"
          value={form.password}
          onChange={onChange}
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
      <p style={{ marginTop: 10 }}>
        Have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
