import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return (
      <main className="auth-loading">
        <div className="loading-orb" />
        <p>Opening your studio...</p>
      </main>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
