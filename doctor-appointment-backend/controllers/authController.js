const User = require("../models/User");
const jwt = require("jsonwebtoken");

/** helper to set the http-only cookie */
function setAuthCookie(res, token) {
  res.cookie("access_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,              // set true + sameSite:'none' behind HTTPS in prod
    maxAge: 60 * 60 * 1000,     // 1h
  });
}

// Register new user — ALWAYS as "patient"
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "Username and password are required" });
    }

    const user = new User({ username, password, role: "patient" }); // force patient
    await user.save();

    return res.json({ ok: true, data: { message: "User registered successfully" } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ ok: false, error: "Username already exists" });
    }
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Login user (sets cookie and returns user info)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ ok: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    setAuthCookie(res, token);

    return res.json({
      ok: true,
      data: {
        message: "Logged in",
        user: { id: user._id, username: user.username, role: user.role },
        token, // handy for Postman
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Who am I
exports.me = async (req, res) => {
  try {
    const { id, username, role } = req.user || {};
    if (!id) return res.status(401).json({ ok: false, error: "Unauthorized" });
    return res.json({ ok: true, data: { user: { id, username, role } } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Logout (clear cookie)
exports.logout = async (_req, res) => {
  try {
    res.clearCookie("access_token", { httpOnly: true, sameSite: "lax", secure: false });
    return res.json({ ok: true, data: { message: "Logged out" } });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Refresh (reissue cookie if current JWT is valid)
exports.refresh = (req, res) => {
  const token = req.cookies?.access_token;               // cookie name used in your app
  if (!token) return res.status(401).json({ ok: false, error: "No token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // throws if expired/invalid

    // keep same claims; renew for 1h
    const newToken = jwt.sign(
      { id: payload.id, role: payload.role, username: payload.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    setAuthCookie(res, newToken);

    return res.json({
      ok: true,
      data: {
        message: "Refreshed",
        user: { id: payload.id, username: payload.username, role: payload.role },
      },
    });
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
};
