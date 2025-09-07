// models/Appointment.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true, index: true },
    patientName: { type: String, required: true },
    contact: { type: String, required: true, index: true },
    reason: { type: String },
    status: { type: String, enum: ["booked", "cancelled", "completed"], default: "booked", index: true },
    reference: { type: String, unique: true, index: true } // short booking code
  },
  { timestamps: true }
);

// Generate a short, human-friendly reference if not set
appointmentSchema.pre("save", function (next) {
  if (!this.reference) {
    this.reference = Math.random().toString(36).slice(2, 10).toUpperCase();
  }
  next();
});

module.exports = mongoose.model("Appointment", appointmentSchema);
