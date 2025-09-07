import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Cancel from "./pages/Cancel";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAuth } from "./context/AuthContext";

function AdminGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!user || user.role !== "admin") return <div style={{ padding: 16 }}>Forbidden</div>;
  return children;
}

export default function App() {
  return (
    <div>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <Admin />
            </AdminGuard>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  );
}
