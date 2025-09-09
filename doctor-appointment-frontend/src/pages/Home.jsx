// src/pages/Home.jsx
// Enforce login before booking:
// - Home.onSelectEvent checks AuthContext.user. If missing → redirect to /login with a flash.
// - InlineBookingModal shows “Login required” UI when no user, and blocks submit.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// Magic Bento layout
import MagicBento, { BentoCard } from "../components/MagicBento";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth(); // null/undefined when logged out

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.WEEK);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const now = new Date();

  const range = useMemo(() => {
    if (view === Views.DAY) return { from: startOfDay(date), to: endOfDay(date) };
    if (view === Views.MONTH) return { from: startOfMonth(date), to: endOfMonth(date) };
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  }, [date, view]);

  async function loadSlots() {
    setLoading(true);
    try {
      const res = await api.get("/appointments/slots", {
        params: { from: range.from.toISOString(), to: range.to.toISOString(), limit: 500 },
      });
      const items = res.data?.data?.items ?? [];
      const mapped = items.map((s) => {
        const start = new Date(s.start);
        const end = new Date(s.end);
        const isPast = start < now;
        return {
          id: s._id,
          title:
            s.status === "booked"
              ? s.doctor
                ? `Booked — ${s.doctor}`
                : "Booked"
              : s.doctor || "Available",
          start,
          end,
          status: s.status,
          isPast,
          resource: s,
        };
      });
      setEvents(mapped);
    } catch (e) {
      console.error("loadSlots error:", e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from.getTime(), range.to.getTime()]);

  function onSelectEvent(evt) {
    if (evt.isPast || evt.status !== "available") return;

    if (!user) {
      navigate("/login", { state: { flash: "Please log in to book an appointment." } });
      return;
    }

    setSelected(evt);
    setModalOpen(true);
  }

  function eventPropGetter(evt) {
    let backgroundColor = "#00e8b4"; // available
    if (evt.isPast) backgroundColor = "#d1d5db"; // past
    else if (evt.status === "booked") backgroundColor = "#c74ae3"; // booked
    return {
      style: {
        backgroundColor,
        color: "#111827",
        border: "none",
        borderRadius: 6,
        opacity: 1,
        cursor: evt.isPast || evt.status !== "available" ? "not-allowed" : "pointer",
      },
      title: `${evt.title}`,
    };
  }

  return (
    <div style={{ padding: 16 }}>
      <MagicBento>
        <BentoCard col={4} row={3}>
          <h2 style={{ margin: 0, marginBottom: 12 }}>Calendar</h2>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={[Views.DAY, Views.WEEK, Views.MONTH]}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            style={{ height: "calc(100% - 40px)", borderRadius: 8 }}
            onSelectEvent={onSelectEvent}
            eventPropGetter={eventPropGetter}
          />
        </BentoCard>

        <BentoCard col={2} row={1}>
          <h3 style={{ marginTop: 0 }}>Legend</h3>
          <Legend />
        </BentoCard>

        <BentoCard col={2} row={1}>
          <h3 style={{ marginTop: 0 }}>Status</h3>
          {loading ? <p>Loading slots…</p> : <p>Ready</p>}
          <p style={{ marginTop: 8, opacity: 0.8 }}>Week view is default. Click a green slot to book.</p>
        </BentoCard>

        <BentoCard col={2} row={1}>
          <h3 style={{ marginTop: 0 }}>Tips</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Login required to book</li>
            <li>Past slots are disabled</li>
            <li>Red means booked</li>
          </ul>
        </BentoCard>
      </MagicBento>

      {modalOpen && selected && (
        <InlineBookingModal
          slot={selected}
          onClose={() => {
            setModalOpen(false);
            setSelected(null);
          }}
          onBooked={() => {
            // refresh calendar but keep modal open so user can copy the code
            loadSlots();
          }}
        />
      )}
    </div>
  );
}

function Legend() {
  const item = (color, label) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 12, height: 12, background: color, borderRadius: 3, display: "inline-block" }} />
      <span>{label}</span>
    </span>
  );
  return (
    <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
      {item("#00e8b4", "Available")}
      {item("#c74ae3", "Booked")}
      {item("#d1d5db", "Past")}
    </div>
  );
}

function InlineBookingModal({ slot, onClose, onBooked }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState("");
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [refCode, setRefCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function book() {
    setMsg("");

    if (!user) {
      navigate("/login", { state: { flash: "Login required to book." } });
      return;
    }

    setBusy(true);
    try {
      const res = await api.post("/appointments/book", {
        slotId: slot.id,
        patientName,
        contact,
        reason,
      });
      const ref = res.data?.data?.appointment?.reference;
      setRefCode(ref || "");
      setDone(true);
      setMsg(ref ? "Booked successfully." : "Booked successfully (no reference returned).");
      onBooked?.();
    } catch (e) {
      const err = e.response?.data?.error || "Booking failed";
      setMsg(err);
    } finally {
      setBusy(false);
    }
  }

  async function copyRef() {
    if (!refCode) return;
    try {
      await navigator.clipboard.writeText(refCode);
      setMsg("Reference copied to clipboard.");
    } catch {
      setMsg("Could not copy to clipboard.");
    }
  }

  const cancelUrl = refCode
    ? `/cancel?ref=${encodeURIComponent(refCode)}&contact=${encodeURIComponent(contact)}`
    : "/cancel";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 16,
          borderRadius: 8,
          width: 380,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Book appointment</h3>
        <p style={{ margin: "4px 0 12px" }}>
          {slot.title} — {format(slot.start, "PPpp")} to {format(slot.end, "p")}
        </p>

        {!user ? (
          <div style={{ display: "grid", gap: 10 }}>
            <strong>Login required</strong>
            <p style={{ margin: 0, color: "#6b7280" }}>You must log in to book this slot.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => navigate("/login", { state: { flash: "Please log in to book." } })}>
                Go to Login
              </button>
              <button onClick={onClose} style={{ marginLeft: "auto" }}>
                Close
              </button>
            </div>
            {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
          </div>
        ) : !done ? (
          <div style={{ display: "grid", gap: 8 }}>
            <input
              placeholder="Your name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              autoFocus
              required
            />
            <input
              placeholder="Email or phone"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
            <input
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={book} disabled={busy}>
                {busy ? "Booking…" : "Book"}
              </button>
              <button onClick={onClose} style={{ marginLeft: "auto" }}>
                Close
              </button>
            </div>
            {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Your reference code:</div>
              <code
                style={{
                  padding: "6px 8px",
                  background: "#f3f4f6",
                  borderRadius: 6,
                  display: "inline-block",
                }}
              >
                {refCode || "(none)"}
              </code>
              <button onClick={copyRef} style={{ marginLeft: 10 }}>
                Copy
              </button>
            </div>
            <p style={{ margin: 0, color: "#6b7280" }}>
              Keep this code. You’ll need it (plus your contact) to cancel the appointment.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <a href={cancelUrl}>
                <button type="button">Go to Cancel page</button>
              </a>
              <button onClick={onClose} style={{ marginLeft: "auto" }}>
                Done
              </button>
            </div>
            {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
