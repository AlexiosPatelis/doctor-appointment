// controllers/appointmentController.js
const Slot = require("../models/Slot");
const Appointment = require("../models/Appointment");

/* ----------------------- helpers ----------------------- */
function genRef(len = 8) {
  // friendly code (no O/0/1/I)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[(Math.random() * chars.length) | 0];
  return out;
}

function parseRange(query) {
  const { from, to } = query || {};
  const q = {};
  if (from || to) {
    q.start = {};
    if (from) q.start.$gte = new Date(from);
    if (to) q.start.$lte = new Date(to);
  }
  return q;
}

function pageOpts(query) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(500, Math.max(1, Number(query.limit || 200)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/* ------------------- public list endpoints ------------------- */
// Only available slots
exports.getAvailableAppointments = async (req, res) => {
  try {
    const base = parseRange(req.query);
    const { page, limit, skip } = pageOpts(req.query);
    const q = { ...base, status: "available" };

    const [items, total] = await Promise.all([
      Slot.find(q).sort({ start: 1 }).skip(skip).limit(limit),
      Slot.countDocuments(q),
    ]);

    return res.json({
      ok: true,
      data: { items, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// ALL slots (available + booked + cancelled)
exports.listSlots = async (req, res) => {
  try {
    const q = parseRange(req.query);
    const { page, limit, skip } = pageOpts(req.query);

    const [items, total] = await Promise.all([
      Slot.find(q).sort({ start: 1 }).skip(skip).limit(limit),
      Slot.countDocuments(q),
    ]);

    return res.json({
      ok: true,
      data: { items, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/* ---------------- booking & cancellation ----------------- */
// Book an appointment (atomic flip available -> booked)
exports.bookAppointment = async (req, res) => {
  try {
    const { slotId, patientName, contact, reason } = req.body;
    if (!slotId || !patientName || !contact) {
      return res.status(400).json({
        ok: false,
        error: "slotId, patientName and contact are required",
      });
    }

    // atomically set status from available -> booked so no race conditions
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, status: "available" },
      { $set: { status: "booked" } },
      { new: true }
    );
    if (!slot) {
      return res.status(409).json({ ok: false, error: "Slot not available" });
    }

    const appointment = await Appointment.create({
      slotId,
      patientName,
      contact,
      reason,
      status: "booked",
      reference: genRef(),
    });

    return res.json({
      ok: true,
      data: { message: "Appointment booked successfully", appointment },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Public cancel by reference + contact (no auth)
exports.userCancelByReference = async (req, res) => {
  try {
    let { reference, contact } = req.body || {};
    if (!reference || !contact) {
      return res.status(400).json({ ok: false, error: "reference and contact are required" });
    }
    reference = String(reference).trim().toUpperCase();
    contact = String(contact).trim();

    const appt = await Appointment.findOne({ reference, contact, status: "booked" });
    if (!appt) {
      return res.status(404).json({ ok: false, error: "No matching active appointment" });
    }

    appt.status = "cancelled";
    await appt.save();

    const slot = await Slot.findById(appt.slotId);
    if (slot) {
      slot.status = "available";
      await slot.save();
    }

    return res.json({ ok: true, data: { message: "Appointment cancelled successfully" } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/* ------------------- admin views & actions ------------------- */
// Admin: all appointments (populated)
exports.getAllAppointments = async (_req, res) => {
  try {
    const items = await Appointment.find().sort({ createdAt: -1 }).populate("slotId");
    return res.json({ ok: true, data: items });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Admin: cancel by appointment _id
exports.cancelAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ ok: false, error: "Appointment not found" });
    if (appt.status === "cancelled") {
      return res.json({ ok: true, data: { message: "Already cancelled" } });
    }

    appt.status = "cancelled";
    await appt.save();

    const slot = await Slot.findById(appt.slotId);
    if (slot) {
      slot.status = "available";
      await slot.save();
    }

    return res.json({ ok: true, data: { message: "Appointment cancelled" } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Admin: add new slot (validates start/end strongly)
exports.addSlot = async (req, res) => {
  try {
    const { start, end, doctor = "Dr. Smith" } = req.body;

    if (!start || !end) {
      return res.status(400).json({ ok: false, error: "start and end are required ISO dates" });
    }

    const s = new Date(start);
    const e = new Date(end);

    // robust validity checks
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      return res.status(400).json({ ok: false, error: "Invalid date format" });
    }
    if (e <= s) {
      return res.status(400).json({ ok: false, error: "end must be after start" });
    }

    // (optional) prevent past slots
    // if (s < new Date()) return res.status(400).json({ ok: false, error: "Cannot create slots in the past" });

    const slot = await Slot.create({ start: s, end: e, doctor, status: "available" });
    return res.json({ ok: true, data: slot });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        ok: false,
        error: "Slot already exists for this doctor at this time",
      });
    }
    return res.status(500).json({ ok: false, error: err.message });
  }
};
