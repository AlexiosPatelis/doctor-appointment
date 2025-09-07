// src/pages/Cancel.jsx
import { useState } from "react";
import api from "../api/axios";

export default function Cancel() {
  const [form, setForm] = useState({ reference: "", contact: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState(null); // "ok" | "error" | null

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setStatus(null);
    setLoading(true);
    try {
      // public endpoint in your backend
      const res = await api.post("/appointments/cancel", {
        reference: form.reference.trim(),
        contact: form.contact.trim(),
      });
      setStatus("ok");
      setMsg(res.data?.data?.message || "Appointment cancelled");
    } catch (err) {
      setStatus("error");
      setMsg(err.response?.data?.error || "Unable to cancel appointment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 480 }}>
      <h2>Cancel Appointment</h2>
      <p>Enter your reference code and the same contact you used when booking.</p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          name="reference"
          placeholder="Reference code (e.g., FMICJG8E)"
          value={form.reference}
          onChange={onChange}
          required
        />
        <input
          name="contact"
          placeholder="Email or phone used for booking"
          value={form.contact}
          onChange={onChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Cancelling…" : "Cancel appointment"}
        </button>
      </form>

      {msg && (
        <p style={{ marginTop: 10, color: status === "ok" ? "#16a34a" : "#dc2626" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
