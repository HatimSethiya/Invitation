function AdminLogin() {
  return (
    <main className="page-shell">
      <section className="page-card">
        <span className="eyebrow">Admin</span>
        <h1>Welcome back</h1>
        <p>Admin authentication will be connected in the next phase.</p>
        <a className="primary-button" href="/admin/dashboard">
          Open Dashboard
        </a>
      </section>
    </main>
  );
}

export default AdminLogin;
