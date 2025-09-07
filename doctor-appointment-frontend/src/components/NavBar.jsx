import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkStyle = (to) =>
    "px-3 py-2 rounded " + (pathname === to ? "bg-gray-200" : "hover:bg-gray-100");

  async function onLogout() {
    await logout();
    navigate("/"); // back to calendar
  }

  return (
    <nav style={{ display: "flex", gap: 8, padding: 12, borderBottom: "1px solid #eee" }}>
      <Link className={linkStyle("/")} to="/">Calendar</Link>
      <Link className={linkStyle("/cancel")} to="/cancel">Cancel</Link>
      <span style={{ flex: 1 }} />

      {/* show Admin only if user is admin */}
      {user?.role === "admin" && (
        <Link className={linkStyle("/admin")} to="/admin">Admin</Link>
      )}

      {user ? (
        <>
          <span style={{ padding: "6px 8px", color: "#374151" }}>
            Hello, <strong>{user.username}</strong>
          </span>
          <button onClick={onLogout}>Logout</button>
        </>
      ) : (
        <Link className={linkStyle("/login")} to="/login">Login</Link>
      )}
    </nav>
  );
}
