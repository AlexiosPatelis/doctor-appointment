// routes/appointments.js
const express = require("express");
const router = express.Router();

const {
  // lists
  getAvailableAppointments,   // only available
  listSlots,                  // all slots (available + booked + cancelled)
  // booking & cancel
  bookAppointment,
  userCancelByReference,
  cancelAppointment,          // admin cancels by appointment _id
  // admin views & slot mgmt
  getAllAppointments,
  addSlot,
} = require("../controllers/appointmentController");

const { auth } = require("../middleware/authMiddleware");

// ---- public
router.get("/available", getAvailableAppointments);  // only available
router.get("/slots", listSlots);                      // ALL slots in range

// ---- patient
router.post("/book", auth(["patient"]), bookAppointment);

// ---- optional public cancel (by reference + contact)
router.post("/cancel", userCancelByReference);

// ---- admin
router.get("/all", auth(["admin"]), getAllAppointments);
router.delete("/:id", auth(["admin"]), cancelAppointment);
router.post("/slots", auth(["admin"]), addSlot);

module.exports = router;
