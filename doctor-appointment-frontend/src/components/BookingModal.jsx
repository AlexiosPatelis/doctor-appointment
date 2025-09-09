import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function BookingModal({ open, event, onClose, onBooked }) {
  if (!open || !event) return null;

  const { user } = useAuth();
  const navigate = useNavigate();

  const slot = event.resource;
  const [form, setForm] = useState({ patientName: "", contact: "", reason: "" });
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refCode, setRefCode] = useState(null);

  function onChange(e) { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    if (!user) { navigate("/login", { state: { flash: "Login required to book." } }); return; }
    setSubmitting(true);
    try {
      const res = await api.post("/appointments/book", {
        slotId: slot._id,
        patientName: form.patientName.trim(),
        contact: form.contact.trim(),
        reason: form.reason.trim(),
      });
      const ref =
        res.data?.data?.appointment?.reference ||
        res.data?.appointment?.reference ||
        res.data?.reference || null;

      setRefCode(ref);
      setMsg(ref ? `Booked! Your reference code: ${ref}` : "Booked! (No reference code returned)");
    } catch (err) {
      setMsg(err.response?.data?.error || "Booking failed. Are you logged in as patient?");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyRef() {
    if (!refCode) return;
    try { await navigator.clipboard.writeText(refCode); setMsg(`Reference copied: ${refCode}`); }
    catch { setMsg("Could not copy to clipboard."); }
  }

  function handleDone() { if (onBooked) onBooked(); }

  if (!user && !refCode) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Login required</h3>
          <p style={{ marginTop: 0, color: "var(--muted)" }}>
            You must log in to book this slot.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => navigate("/login", { state: { flash: "Please log in to book." } })}
              style={{ background: "var(--brand-blue)", color: "#fff", borderColor: "#0057c7" }}
            >
              Go to Login
            </button>
            <button type="button" onClick={onClose} style={{ marginLeft: "auto" }}>
              Close
            </button>
          </div>
          {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Book Appointment</h3>

        {!refCode && (
          <p style={{ marginTop: 0, color: "var(--muted)" }}>
            {slot.doctor} — {new Date(slot.start).toLocaleString()} –{" "}
            {new Date(slot.end).toLocaleTimeString()}
          </p>
        )}

        {!refCode ? (
          <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
            <input name="patientName" placeholder="Your full name" value={form.patientName} onChange={onChange} required />
            <input name="contact" placeholder="Email or phone" value={form.contact} onChange={onChange} required />
            <textarea name="reason" placeholder="Reason (optional)" rows={3} value={form.reason} onChange={onChange} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" disabled={submitting} style={{ background: "var(--brand-green)", color: "#0b3b33", borderColor: "#0b3b33" }}>
                {submitting ? "Booking…" : "Book"}
              </button>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <strong>Booking successful!</strong>
              <div style={{ marginTop: 6 }}>
                <span>Your reference code: </span>
                <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>
                  {refCode}
                </code>
              </div>
              <small style={{ display: "block", marginTop: 6, color: "var(--muted)" }}>
                Save this code. You’ll need it to cancel your appointment.
              </small>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={copyRef} disabled={!refCode} style={{ background: "var(--brand-purple)", color: "#ffffff", borderColor: "#7b2a98" }}>
                Copy code
              </button>
              <button type="button" onClick={handleDone} style={{ background: "var(--brand-blue)", color: "#ffffff", borderColor: "#0057c7" }}>
                Done
              </button>
            </div>
          </div>
        )}

        {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(17,24,39,.25)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const modalStyle = {
  width: 420,
  maxWidth: "90vw",
  background: "white",
  color: "#111827",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,.2)",
};
