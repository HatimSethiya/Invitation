import { useAuth } from "../../context/AuthContext";

function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <span className="eyebrow">Admin Dashboard</span>
        <h1>Wedding Invitation Studio</h1>
        <p>Welcome, {user?.name || "Admin"}. Your invitation workspace is ready.</p>
        <div className="dashboard-actions">
          <button className="primary-button" type="button">Create Invitation</button>
          <button className="secondary-button" type="button" onClick={logout}>Logout</button>
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;
