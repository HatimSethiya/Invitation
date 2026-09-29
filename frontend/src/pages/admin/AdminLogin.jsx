import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AdminLogin() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/admin/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  if (loading) return <main className="auth-loading"><div className="loading-orb" /><p>Preparing secure login...</p></main>;
  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="login-card">
        <div className="login-mark">✦</div>
        <span className="eyebrow">Wedding Invitation Studio</span>
        <h1>Welcome back</h1>
        <p className="login-subtitle">Sign in to manage your invitations, themes and guests.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@example.com" required />
          </label>

          <label>
            Password
            <span className="password-field">
              <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
            </span>
          </label>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button className="login-button" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Enter Studio"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminLogin;
