import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getStudioTemplate } from "./templateCatalog";
import { getStudioDraftUnlockToken } from "./studioDraftAccess";
import "./StudioDraftLibrary.css";

/**
 * The draft index is metadata-only, even when a card is password locked.
 * Opening a draft requires its own password/unlock token in StudioCardEditor.
 */
function StudioDraftLibrary() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api.get("/studio/drafts")
      .then(({ data }) => {
        if (active) setDrafts(Array.isArray(data.drafts) ? data.drafts : []);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || "Unable to load your Studio drafts.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return (
    <section className="studio-draft-library" aria-labelledby="studio-draft-library-heading">
      <div className="wedding-studio-section-heading">
        <div>
          <span className="wedding-studio-kicker">PRIVATE DESIGN WORKSPACE</span>
          <h2 id="studio-draft-library-heading">My Studio Drafts</h2>
          <p>
            Securely saved designs live here. Each draft requires its card
            password when you reopen it after a refresh or logout.
          </p>
        </div>
        <Link className="studio-draft-library-browse" to="/admin/studio/templates">
          Explore Designs ↗
        </Link>
      </div>

      {error && <p className="studio-draft-library-error" role="alert">{error}</p>}
      {loading ? (
        <p className="studio-draft-library-state" role="status">Loading private drafts…</p>
      ) : drafts.length === 0 ? (
        <div className="studio-draft-library-empty">
          <span aria-hidden="true">✧</span>
          <div>
            <h3>No Studio drafts saved yet</h3>
            <p>Choose a community template and save your first personalized card.</p>
          </div>
          <Link to="/admin/studio/templates">Browse Templates</Link>
        </div>
      ) : (
        <div className="studio-draft-library-grid">
          {drafts.map((draft) => {
            const template = getStudioTemplate(draft.templateId, draft.templateVersion);
            const isUnlocked = Boolean(getStudioDraftUnlockToken(draft._id));
            const savedAt = draft.updatedAt
              ? new Date(draft.updatedAt).toLocaleDateString()
              : "Recently saved";

            return (
              <article className="studio-draft-library-card" key={draft._id}>
                <div className="studio-draft-library-protected" aria-hidden="true">
                  <span>✦</span>
                  <strong>Private Wedding Card</strong>
                  <small>Design details protected</small>
                </div>
                <div className="studio-draft-library-summary">
                  <span className="studio-draft-library-status">
                    <span aria-hidden="true">🔒</span> Locked draft
                  </span>
                  <h3>{template?.name || "Studio Wedding Card"}</h3>
                  <p>Saved {savedAt}</p>
                  <Link
                    to={`/admin/studio/drafts/${draft._id}/edit`}
                    className="studio-draft-library-open"
                  >
                    {isUnlocked ? "Continue Editing" : "Unlock & Edit"} ↗
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default StudioDraftLibrary;
