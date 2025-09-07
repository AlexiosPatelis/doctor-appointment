// index.js
// Entry point for the Express API server.
// Provides security middleware, CORS, JSON parsing, routes, error handling,
// and MongoDB connection (database: `doctor`).

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// ---------- sanity checks for required envs
// JWT secret is required for auth cookie signing
if (!process.env.JWT_SECRET) {
  console.error("❌ Missing JWT_SECRET");
  process.exit(1);
}
// Mongo connection string. Example for your DB name `doctor`:
// MONGO_URI=mongodb://localhost:27017/doctor
if (!process.env.MONGO_URI) {
  console.error("❌ Missing MONGO_URI");
  process.exit(1);
}

const app = express();

// If behind a proxy (nginx, render, etc.) trust X-Forwarded-* headers in prod
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ---------- security & parsers
app.use(
  helmet({
    // Allow embedding if you later host frontend and backend on same origin via nginx
    crossOriginEmbedderPolicy: false,
  })
);

// Frontend origins allowed to call this API.
// You can pass a single origin or comma-separated list via FRONTEND_ORIGIN.
// Fallbacks cover local dev.
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = FRONTEND_ORIGINS.length ? FRONTEND_ORIGINS : DEFAULT_ORIGINS;

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (no Origin header) and allowed origins list
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: Origin not allowed: ${origin}`));
    },
    credentials: true, // allow cookies for auth
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// JSON body parser and cookie parser
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ---------- basic global rate limiter (tune as needed)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // max requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ---------- routes
const appointmentRoutes = require("./routes/appointments");
const authRoutes = require("./routes/auth");

// Mount feature routes
app.use("/appointments", appointmentRoutes);
app.use("/auth", authRoutes);

// ---------- health / readiness
app.get("/", (_req, res) => res.send("Doctor Appointment API is running 🚀"));
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.get("/readyz", (_req, res) => res.json({ ok: true }));

// ---------- 404 fallback
app.use((req, res) => {
  res
    .status(404)
    .json({ ok: false, error: `Not found: ${req.method} ${req.originalUrl}` });
});

// ---------- centralized error handler
// Any route calling next(err) will end up here
app.use((err, _req, res, _next) => {
  // Log full error server-side; return minimal message to client
  console.error("💥 Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({ ok: false, error: err.message || "Server error" });
});

// ---------- Mongo connection (database name: `doctor`)
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.MONGO_URI /* e.g. mongodb://localhost:27017/doctor */)
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Ensure indexes are created at startup. Safe to run repeatedly.
    try {
      const Slot = require("./models/Slot");
      const Appointment = require("./models/Appointment");
      const User = require("./models/User");
      await Promise.all([
        Slot.syncIndexes(),
        Appointment.syncIndexes(),
        User.syncIndexes(),
      ]);
      console.log("✅ Indexes synced");
    } catch (e) {
      console.warn("⚠️ Index sync warning:", e.message);
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ---------- start HTTP server
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
