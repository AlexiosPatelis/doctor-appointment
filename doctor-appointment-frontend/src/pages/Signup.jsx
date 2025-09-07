// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    try {
      // Backend will force role = "patient" (even if someone tries to send something else)
      await api.post("/auth/register", {
        username: form.username.trim(),
        password: form.password,
      });

      // Auto-login
      await login({ username: form.username, password: form.password });
      navigate("/"); // to Calendar
    } catch (err) {
      setMsg(err.response?.data?.error || "Sign up failed");
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Sign Up</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 320 }}>
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
        <button type="submit">Create account</button>
      </form>
      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
      <p style={{ marginTop: 10, color: "#6b7280" }}>
        Note: Accounts created here are <strong>patient</strong> accounts.
      </p>
    </div>
  );
}
