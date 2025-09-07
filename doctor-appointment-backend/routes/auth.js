const express = require("express");
const { register, login, me, logout, refresh } = require("../controllers/authController");
const { auth } = require("../middleware/authMiddleware");

const router = express.Router();

// Register a new user (admin or patient)
router.post("/register", register);

// Login and set cookie (and also return token for tooling)
router.post("/login", login);

// NEW: refresh cookie-based JWT (no auth middleware here)
router.post("/refresh", refresh);

// Who am I (requires valid auth)
router.get("/me", auth(), me);

// Logout (clear cookie)
router.post("/logout", auth(), logout);

module.exports = router;
