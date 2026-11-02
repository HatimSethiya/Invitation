import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import MusicLibraryDialog from "../../components/MusicLibraryDialog";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState({ stats: { total: 0, published: 0, drafts: 0, paused: 0, archived: 0 }, invitations: [] });
  const [loading, setLoading] = useState(true);
  const [themeSaving, setThemeSaving] = useState("");
  const [statusSaving, setStatusSaving] = useState("");
  const [actionError, setActionError] = useState("");
  const [musicInvitation, setMusicInvitation] = useState(null);
  const [musicSaving, setMusicSaving] = useState(false);

  const loadInvitations = async () => {
    try { const response = await api.get("/invitations"); setData(response.data); }
    catch { /* Session is already protected by the route. */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadInvitations(); }, []);

  const updateStatus = async (id, status) => {
    setStatusSaving(id);
    setActionError("");
    try {
      await api.patch(`/invitations/${id}/status`, { status });
      await loadInvitations();
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to update invitation status.");
    } finally {
      setStatusSaving("");
    }
  };

  const updateTheme = async (id, theme) => {
    setThemeSaving(id);
    setActionError("");
    try {
      await api.patch(`/invitations/${id}/theme`, { theme });
      await loadInvitations();
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to change invitation design.");
    } finally {
      setThemeSaving("");
    }
  };

  const saveInvitationMusic = async (track) => {
    if (!musicInvitation) return;

    setMusicSaving(true);
    setActionError("");
    const currentMusic = musicInvitation.music || {};

    try {
      await api.put(`/invitations/${musicInvitation._id}`, {
        music: {
          audioUrl: track.audioUrl,
          title: track.title,
          artist: track.artist,
          provider: track.provider || "internet-archive",
          trackId: track.id,
          shareUrl: track.shareUrl || "",
          licenseUrl: track.licenseUrl || "",
          attribution: track.attribution || "",
          autoplay: currentMusic.autoplay === true,
          loop: currentMusic.loop !== false,
        },
      });
      setMusicInvitation(null);
      await loadInvitations();
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to save invitation music.");
      setMusicInvitation(null);
    } finally {
      setMusicSaving(false);
    }
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
        <div className="stat-card"><span>On hold</span><strong>{data.stats.paused || 0}</strong></div>
        <div className="stat-card"><span>Archived</span><strong>{data.stats.archived}</strong></div>
      </section>

      <section className="invitations-panel">
        <div className="panel-heading"><div><span className="eyebrow">My Invitations</span><h2>Your wedding collection</h2></div><Link className="primary-button" to="/admin/invitations/new">+ Create Invitation</Link></div>

        {actionError && <div className="auth-error wizard-error" role="alert">{actionError}</div>}
        {loading ? <div className="empty-state">Loading invitations...</div> : data.invitations.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">✦</div><h3>Your first invitation starts here</h3><p>Create a beautiful invitation and publish a shareable link for your guests.</p><Link className="primary-button" to="/admin/invitations/new">Create your first invitation</Link></div>
        ) : (
          <div className="invitation-list">{data.invitations.map((invitation) => (
            <article className="invitation-row" key={invitation._id}>
              <div className="invitation-info">
                <span className={`status-pill status-${invitation.status}`}>{invitation.status === "paused" ? "On hold" : invitation.status}</span>
                <h3>{invitation.title}</h3>
                <p>{new Date(invitation.weddingDate).toLocaleDateString()} · /i/{invitation.slug}</p>
                {invitation.music?.title && <p className="invitation-current-music">♫ {invitation.music.title}{invitation.music.artist ? ` · ${invitation.music.artist}` : ""}</p>}
                <label className="invitation-design-control">
                  <span>Invitation design</span>
                  <select
                    value={invitation.theme || "royalRose"}
                    disabled={themeSaving === invitation._id}
                    onChange={(event) => updateTheme(invitation._id, event.target.value)}
                    aria-label={`Change design for ${invitation.title}`}
                  >
                    <option value="bohraNikah">Ivory Gold · Nikah</option>
                    <option value="purpleWhite">White Purple · Glass</option>
                    <option value="midnightNavy">Midnight Navy</option>
                    <option value="sageBotanical">Sage Botanical</option>
                    <option value="champagnePearl">Champagne Pearl</option>
                    <option value="rubyVelvet">Ruby Velvet</option>
                    <option value="oceanTeal">Ocean Teal</option>
                    <option value="celestialBlack">Celestial Onyx</option>
                    <option value="blushTerracotta">Blush Terracotta</option>
                    <option value="desertSand">Desert Sand</option>
                    <option value="sapphireSilver">Sapphire Silver</option>
                    <option value="burgundyLuxe">Burgundy Luxe</option>
                    <option value="jadeMarble">Jade Marble</option>
                    <option value="sunsetCopper">Sunset Copper</option>
                  </select>
                  {themeSaving === invitation._id && <small>Saving design…</small>}
                </label>
              </div>
              <div className="row-actions">
                <Link className="small-button edit-invitation-button" to={`/admin/invitations/${invitation._id}/edit`}>Edit</Link>
                {invitation.status === "published" ? (
                  <>
                    <a className="small-button" href={`/i/${invitation.slug}`} target="_blank" rel="noreferrer">View</a>
                    <button className="small-button" onClick={() => updateStatus(invitation._id, "paused")} disabled={statusSaving === invitation._id}>
                      {statusSaving === invitation._id ? "Holding..." : "Hold"}
                    </button>
                  </>
                ) : (
                  <button className="small-button" onClick={() => updateStatus(invitation._id, "published")} disabled={statusSaving === invitation._id}>
                    {statusSaving === invitation._id ? "Publishing..." : "Publish"}
                  </button>
                )}
                <button className="small-button" onClick={() => setMusicInvitation(invitation)} disabled={musicSaving || statusSaving === invitation._id}>{invitation.music?.audioUrl ? "Change music" : "Add music"}</button>
                {invitation.status !== "archived" && <button className="small-button danger" onClick={() => removeInvitation(invitation._id)}>Delete</button>}
              </div>
            </article>
          ))}</div>
        )}
      </section>
      {musicInvitation && (
        <MusicLibraryDialog
          selectedTrackId={musicInvitation.music?.trackId || ""}
          onClose={() => setMusicInvitation(null)}
          onSelect={saveInvitationMusic}
        />
      )}
    </main>
  );
}
export default AdminDashboard;
