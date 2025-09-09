import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const displayName = user?.username || user?.name || user?.email || "User";

  async function onLogout() {
    try {
      await logout?.();
    } finally {
      navigate("/");
      setOpen(false);
    }
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "saturate(1)",
        background: "#ffffff",
        borderBottom: "1px solid var(--card-border)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          <div
            aria-hidden
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background:
                "conic-gradient(from 220deg at 50% 50%, var(--brand-blue), var(--brand-green), var(--brand-purple), var(--brand-blue))",
              filter: "saturate(1)",
            }}
          />
          <span style={{ fontWeight: 700, letterSpacing: 0.2, color: "var(--brand-blue)" }}>
            DocApp
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="primary"
          style={{ marginLeft: "auto", display: "none", gap: 8 }}
          className="__nav-desktop"
        >
          <NavItem to="/" label="Calendar" />
          <NavItem to="/cancel" label="Cancel" />
          {isAdmin && <NavItem to="/admin" label="Admin" />}

          {user ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
              <span
                title={displayName}
                style={{
                  color: "var(--muted)",
                  fontSize: 14,
                  maxWidth: 180,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Hello, <strong style={{ color: "var(--text)" }}>{displayName}</strong>
              </span>
              <button onClick={onLogout} style={btn("solid")}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "inline-flex", gap: 8, marginLeft: 8 }}>
              <Link to="/login" style={btn("ghost")}>
                Login
              </Link>
              <Link to="/signup" style={btn("solid")}>
                Sign up
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 10,
            border: "1px solid var(--card-border)",
            background: "#ffffff",
            color: "var(--text)",
          }}
          className="__nav-toggle"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          style={{
            borderTop: "1px solid var(--card-border)",
            background: "#ffffff",
            backdropFilter: "none",
          }}
          className="__nav-mobile"
        >
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 16px", display: "grid", gap: 8 }}>
            <NavMobileItem to="/" label="Calendar" onClick={() => setOpen(false)} />
            <NavMobileItem to="/cancel" label="Cancel" onClick={() => setOpen(false)} />
            {isAdmin && <NavMobileItem to="/admin" label="Admin" onClick={() => setOpen(false)} />}

            {user ? (
              <>
                <div style={{ color: "var(--muted)", padding: "6px 0" }}>{displayName}</div>
                <button
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  style={btn("solid")}
                >
                  Logout
                </button>
              </>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <Link to="/login" onClick={() => setOpen(false)} style={btn("ghost")}>
                  Login
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)} style={btn("solid")}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .__nav-desktop { display: inline-flex !important; }
          .__nav-toggle, .__nav-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      style={({ isActive }) => ({
        padding: "8px 12px",
        borderRadius: 8,
        textDecoration: "none",
        color: "var(--text)",
        fontWeight: 500,
        background: isActive ? "rgba(0,116,255,0.08)" : "#ffffff",
        border: `1px solid ${isActive ? "var(--brand-blue)" : "var(--card-border)"}`,
      })}
    >
      {label}
    </NavLink>
  );
}

function NavMobileItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      style={({ isActive }) => ({
        display: "block",
        padding: "10px 12px",
        borderRadius: 10,
        color: "var(--text)",
        textDecoration: "none",
        background: isActive ? "rgba(199,74,227,0.10)" : "#ffffff",
        border: `1px solid ${isActive ? "var(--brand-purple)" : "var(--card-border)"}`,
      })}
    >
      {label}
    </NavLink>
  );
}

function btn(variant = "ghost") {
  if (variant === "solid") {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px 12px",
      borderRadius: 10,
      background: "var(--brand-blue)",
      border: "1px solid #0057c7",
      color: "#ffffff",
      textDecoration: "none",
      fontWeight: 600,
    };
  }
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid var(--card-border)",
    color: "var(--text)",
    textDecoration: "none",
    fontWeight: 600,
  };
}
