// index.js
// Express API for Doctor Appointment.
// Security, CORS, JSON parsing, routes, errors, Mongo connection.

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// ----- required env
if (!process.env.JWT_SECRET) {
  console.error("❌ Missing JWT_SECRET");
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error("❌ Missing MONGO_URI");
  process.exit(1);
}

const app = express();
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

// ----- security
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

// ----- CORS
// Accept from FRONTEND_ORIGIN (comma-separated) or sane local defaults.
const DEFAULT_ORIGINS = [
  "http://localhost:5173", // Vite dev default
  "http://127.0.0.1:5173",
  "http://localhost:5174", // Vite alt when 5173 busy
  "http://127.0.0.1:5174",
  "http://localhost:8080", // Docker nginx suggestion
  "http://127.0.0.1:8080",
];
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = new Set(
  FRONTEND_ORIGINS.length ? FRONTEND_ORIGINS : DEFAULT_ORIGINS
);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl or same-origin
      if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
      return cb(new Error(`CORS: Origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// ----- parsers
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ----- rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ----- routes
const appointmentRoutes = require("./routes/appointments");
const authRoutes = require("./routes/auth");

app.use("/appointments", appointmentRoutes);
app.use("/auth", authRoutes);

// health
app.get("/", (_req, res) => res.send("Doctor Appointment API is running 🚀"));
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.get("/readyz", (_req, res) => res.json({ ok: true }));

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Not found: ${req.method} ${req.originalUrl}` });
});

// central error handler
app.use((err, _req, res, _next) => {
  console.error("💥 Unhandled error:", err);
  res.status(err.status || 500).json({ ok: false, error: err.message || "Server error" });
});

// ----- Mongo
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    try {
      const Slot = require("./models/Slot");
      const Appointment = require("./models/Appointment");
      const User = require("./models/User");
      await Promise.all([Slot.syncIndexes(), Appointment.syncIndexes(), User.syncIndexes()]);
      console.log("✅ Indexes synced");
    } catch (e) {
      console.warn("⚠️ Index sync warning:", e.message);
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ----- listen
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
