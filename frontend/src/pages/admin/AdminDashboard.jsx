import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState({ stats: { total: 0, published: 0, drafts: 0, archived: 0 }, invitations: [] });
  const [loading, setLoading] = useState(true);

  const loadInvitations = async () => {
    try { const response = await api.get("/invitations"); setData(response.data); }
    catch { setData((current) => current); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadInvitations(); }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/invitations/${id}/status`, { status });
    await loadInvitations();
  };

  const removeInvitation = async (id) => {
    if (!window.confirm("Delete this invitation permanently?")) return;
    await api.delete(`/invitations/${id}`);
    await loadInvitations();
  };

  return (
    <main className="studio-page">
      <header className="studio-header">
        <div><span className="eyebrow">Wedding Invitation Studio</span><h1>Good to see you, {user?.name || "Admin"}</h1><p>Create, manage and publish beautiful wedding invitations.</p></div>
        <button className="secondary-button" onClick={logout}>Logout</button>
      </header>

      <section className="stats-grid">
        <div className="stat-card"><span>Total</span><strong>{data.stats.total}</strong></div>
        <div className="stat-card"><span>Published</span><strong>{data.stats.published}</strong></div>
        <div className="stat-card"><span>Drafts</span><strong>{data.stats.drafts}</strong></div>
        <div className="stat-card"><span>Archived</span><strong>{data.stats.archived}</strong></div>
      </section>

      <section className="invitations-panel">
        <div className="panel-heading"><div><span className="eyebrow">My Invitations</span><h2>Your wedding collection</h2></div><Link className="primary-button" to="/admin/invitations/new">+ Create Invitation</Link></div>

        {loading ? <div className="empty-state">Loading invitations...</div> : data.invitations.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">✦</div><h3>Your first invitation starts here</h3><p>Create a beautiful invitation and publish a shareable link for your guests.</p><Link className="primary-button" to="/admin/invitations/new">Create your first invitation</Link></div>
        ) : (
          <div className="invitation-list">{data.invitations.map((invitation) => (
            <article className="invitation-row" key={invitation._id}>
              <div className="invitation-info"><span className={`status-pill status-${invitation.status}`}>{invitation.status}</span><h3>{invitation.title}</h3><p>{new Date(invitation.weddingDate).toLocaleDateString()} · /i/{invitation.slug}</p></div>
              <div className="row-actions"><Link className="small-button" to={`/admin/invitations/${invitation._id}/edit`}>Edit</Link>{invitation.status === "published" ? <a className="small-button" href={`/i/${invitation.slug}`} target="_blank" rel="noreferrer">View</a> : <button className="small-button" onClick={() => updateStatus(invitation._id, "published")}>Publish</button>}{invitation.status !== "archived" && <button className="small-button danger" onClick={() => removeInvitation(invitation._id)}>Delete</button>}</div>
            </article>
          ))}</div>
        )}
      </section>
    </main>
  );
}
export default AdminDashboard;
