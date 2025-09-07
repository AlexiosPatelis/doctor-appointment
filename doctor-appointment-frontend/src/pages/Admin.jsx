import { useEffect, useState } from "react";
import api from "../api/axios";

function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "-";
  }
}

export default function Admin() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // new slot form
  const [slotForm, setSlotForm] = useState({
    date: "",          // yyyy-mm-dd
    time: "09:00",     // HH:mm
    duration: 30,      // minutes
    doctor: "Dr. Smith",
  });

  async function loadAll() {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/appointments/all"); // requires admin
      // backend returns { ok, data: [...] }
      setAppointments(res.data?.data || []);
    } catch (err) {
      const e = err.response?.data?.error || "Failed to load appointments";
      setMsg(e);
      // If 401, our axios interceptor will redirect to /login automatically
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function cancelAppointment(id) {
    const yes = window.confirm("Cancel this appointment?");
    if (!yes) return;
    try {
      await api.delete(`/appointments/${id}`); // admin cancel endpoint
      setMsg("Appointment cancelled.");
      loadAll();
    } catch (err) {
      setMsg(err.response?.data?.error || "Cancel failed");
    }
  }

  function onSlotChange(e) {
    setSlotForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function createSlot(e) {
    e.preventDefault();
    setMsg("");
    try {
      const startLocal = new Date(`${slotForm.date}T${slotForm.time}`);
      if (isNaN(+startLocal)) throw new Error("Invalid date/time");
      const endLocal = new Date(startLocal.getTime() + Number(slotForm.duration) * 60000);

      const body = {
        start: startLocal.toISOString(),
        end: endLocal.toISOString(),
        doctor: slotForm.doctor,
      };

      const res = await api.post("/appointments/slots", body); // admin add slot
      const when = res.data?.data?.start || body.start;
      setMsg(`Slot created for ${new Date(when).toLocaleString()}.`);
    } catch (err) {
      setMsg(err.response?.data?.error || err.message || "Failed to create slot");
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Admin</h2>
      <p>Manage appointments and create new slots.</p>

      <section style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Add New Slot</h3>
        <form
          onSubmit={createSlot}
          style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
        >
          <label>
            Date:
            <input type="date" name="date" value={slotForm.date} onChange={onSlotChange} required />
          </label>
          <label>
            Start time:
            <input type="time" name="time" value={slotForm.time} onChange={onSlotChange} required />
          </label>
          <label>
            Duration (min):
            <input
              type="number"
              min="5"
              step="5"
              name="duration"
              value={slotForm.duration}
              onChange={onSlotChange}
            />
          </label>
          <label>
            Doctor:
            <input name="doctor" value={slotForm.doctor} onChange={onSlotChange} />
          </label>
          <button type="submit">Create slot</button>
        </form>
      </section>

      <section style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Booked Appointments</h3>
          <button onClick={loadAll}>Refresh</button>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={th}>Patient</th>
                  <th style={th}>Contact</th>
                  <th style={th}>Reference</th>
                  <th style={th}>Doctor</th>
                  <th style={th}>Start</th>
                  <th style={th}>End</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: 8 }}>
                      No appointments.
                    </td>
                  </tr>
                )}
                {appointments.map((a) => (
                  <tr key={a._id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>{a.patientName}</td>
                    <td style={td}>{a.contact}</td>
                    <td style={td}><code>{a.reference || "-"}</code></td>
                    <td style={td}>{a.slotId?.doctor || "-"}</td>
                    <td style={td}>{a.slotId?.start ? fmt(a.slotId.start) : "-"}</td>
                    <td style={td}>{a.slotId?.end ? fmt(a.slotId.end) : "-"}</td>
                    <td style={td}>{a.status}</td>
                    <td style={td}>
                      {a.status === "booked" ? (
                        <button onClick={() => cancelAppointment(a._id)}>Cancel</button>
                      ) : (
                        <span style={{ color: "#6b7280" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}

const th = { padding: "8px 6px", fontWeight: 600, fontSize: 14 };
const td = { padding: "8px 6px", fontSize: 14 };