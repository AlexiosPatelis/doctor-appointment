// models/Slot.js
const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    start:   { type: Date, required: true },
    end:     { type: Date, required: true },
    doctor:  { type: String, default: "Dr. Smith", trim: true },
    status:  { type: String, enum: ["available", "booked", "cancelled"], default: "available" },
  },
  { timestamps: true }
);

// one doctor cannot have two slots starting at the same moment
slotSchema.index({ doctor: 1, start: 1 }, { unique: true });

// fast range queries
slotSchema.index({ start: 1 });

// safety: end must be after start
slotSchema.pre("validate", function (next) {
  if (this.start && this.end && this.end <= this.start) {
    this.invalidate("end", "end must be after start");
  }
  next();
});

module.exports = mongoose.model("Slot", slotSchema);
