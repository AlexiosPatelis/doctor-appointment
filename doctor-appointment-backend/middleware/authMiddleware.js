// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

/**
 * Auth middleware that accepts token from:
 * 1) Authorization: Bearer <token>
 * 2) HTTP-only cookie: access_token
 *
 * Optionally enforces roles: auth(["admin"]) or auth(["patient"])
 */
exports.auth = (roles = []) => {
  return (req, res, next) => {
    try {
      let token = null;

      // 1) Try Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }

      // 2) Fallback to cookie
      if (!token && req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
      }

      if (!token) {
        return res.status(401).json({ ok: false, error: "Unauthorized. No token provided." });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ ok: false, error: "Forbidden. You do not have access." });
      }

      req.user = decoded; // { id, role, username, iat, exp }
      next();
    } catch (err) {
      return res.status(401).json({ ok: false, error: "Invalid or expired token" });
    }
  };
};
