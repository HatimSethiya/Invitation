import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import StudioInvitationPreview from "../../studio/StudioInvitationPreview";
import { getStudioTemplate } from "../../studio/templateCatalog";
import {
  clearStudioDraftUnlockToken,
  getStudioDraftUnlockToken,
  setStudioDraftUnlockToken,
  studioDraftHeaders,
} from "../../studio/studioDraftAccess";
import "./WeddingStudioHome.css";
import "./StudioCardEditor.css";

const emptyEvent = () => ({
  title: "",
  date: "",
  time: "",
  venue: "",
});

const initialDetails = (template) => ({
  title: "",
  partner1: "",
  partner2: "",
  heading: template?.sample?.heading || "Wedding Invitation",
  familyLine: template?.sample?.detail || "",
  message: "",
  weddingDate: "",
  venue: { name: "", address: "" },
  events: [{ ...emptyEvent(), title: template?.sample?.ceremony || "" }],
});

const detailsFromDraft = (draft) => ({
  title: draft.title || "",
  partner1: draft.partner1 || "",
  partner2: draft.partner2 || "",
  heading: draft.heading || "",
  familyLine: draft.familyLine || "",
  message: draft.message || "",
  weddingDate: draft.weddingDate || "",
  venue: {
    name: draft.venue?.name || "",
    address: draft.venue?.address || "",
  },
  events: (draft.events || []).map((event) => ({
    title: event.title || "",
    date: event.date || "",
    time: event.time || "",
    venue: event.venue || "",
  })),
});

function StudioCardEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId, draftId } = useParams();
  const isEditing = Boolean(draftId);
  const initialTemplate = !isEditing ? getStudioTemplate(templateId, 1) : null;

  const [draftTemplateId, setDraftTemplateId] = useState("");
  const [draftTemplateVersion, setDraftTemplateVersion] = useState(1);
  const template = isEditing
    ? getStudioTemplate(draftTemplateId, draftTemplateVersion)
    : initialTemplate;

  const [details, setDetails] = useState(() => initialDetails(initialTemplate));
  const [loading, setLoading] = useState(Boolean(draftId));
  const [locked, setLocked] = useState(Boolean(draftId));
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (location.state?.studioDraftSaved) {
      setNotice("Draft saved securely. Your invitation is not published.");
    }
  }, [location.state]);

  useEffect(() => {
    if (!draftId) return undefined;

    let active = true;
    const loadDraft = async () => {
      const token = getStudioDraftUnlockToken(draftId);
      if (!token) {
        setLocked(true);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/studio/drafts/${draftId}`, {
          headers: studioDraftHeaders(draftId),
        });
        if (!active) return;

        const draft = response.data.draft;
        setDraftTemplateId(draft.templateId);
        setDraftTemplateVersion(draft.templateVersion);
        setDetails(detailsFromDraft(draft));
        setLocked(false);
      } catch (requestError) {
        if (!active) return;
        if (requestError.response?.status === 423) {
          clearStudioDraftUnlockToken(draftId);
          setLocked(true);
        } else {
          setError(requestError.response?.data?.message || "Unable to load this draft.");
          setLocked(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDraft();
    return () => { active = false; };
  }, [draftId]);

  const updateDetail = (name, value) => {
    setDetails((current) => ({ ...current, [name]: value }));
    setNotice("");
  };

  const updateVenue = (name, value) => {
    setDetails((current) => ({
      ...current,
      venue: { ...current.venue, [name]: value },
    }));
    setNotice("");
  };

  const updateEvent = (index, name, value) => {
    setDetails((current) => ({
      ...current,
      events: current.events.map((event, position) =>
        position === index ? { ...event, [name]: value } : event
      ),
    }));
    setNotice("");
  };

  const addEvent = () => {
    setDetails((current) => ({
      ...current,
      events: current.events.length >= 8
        ? current.events
        : [...current.events, emptyEvent()],
    }));
    setNotice("");
  };

  const removeEvent = (index) => {
    setDetails((current) => ({
      ...current,
      events: current.events.filter((_, position) => position !== index),
    }));
    setNotice("");
  };

  const unlockDraft = async (event) => {
    event.preventDefault();
    if (!draftId || !unlockPassword) return;

    setUnlocking(true);
    setError("");
    try {
      const response = await api.post(`/studio/drafts/${draftId}/unlock`, {
        password: unlockPassword,
      });
      const token = response.data.unlockToken;
      setStudioDraftUnlockToken(draftId, token);

      const loaded = await api.get(`/studio/drafts/${draftId}`, {
        headers: studioDraftHeaders(draftId),
      });
      const draft = loaded.data.draft;
      setDraftTemplateId(draft.templateId);
      setDraftTemplateVersion(draft.templateVersion);
      setDetails(detailsFromDraft(draft));
      setUnlockPassword("");
      setLocked(false);
    } catch (requestError) {
      clearStudioDraftUnlockToken(draftId);
      setError(requestError.response?.data?.message || "Unable to unlock this draft.");
    } finally {
      setUnlocking(false);
    }
  };

  const saveDraft = async (event) => {
    event.preventDefault();
    if (!template || saving) return;

    setError("");
    setNotice("");

    if (!isEditing) {
      if (password.length < 8 || password.length > 72) {
        setError("Choose a card password between 8 and 72 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Card password and confirmation do not match.");
        return;
      }
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/studio/drafts/${draftId}`, details, {
          headers: studioDraftHeaders(draftId),
        });
        setNotice("Draft saved securely. Your invitation is not published.");
      } else {
        const response = await api.post("/studio/drafts", {
          ...details,
          templateId: template.id,
          templateVersion: template.version,
          password,
        });

        const id = response.data.draft._id;
        setStudioDraftUnlockToken(id, response.data.unlockToken);
        setPassword("");
        setConfirmPassword("");
        navigate(`/admin/studio/drafts/${id}/edit`, {
          replace: true,
          state: { studioDraftSaved: true },
        });
      }
    } catch (requestError) {
      if (requestError.response?.status === 423 && draftId) {
        clearStudioDraftUnlockToken(draftId);
        setLocked(true);
      }
      setError(requestError.response?.data?.message || "Unable to save your draft.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="wedding-studio-page studio-editor-page">
        <div className="studio-editor-state" role="status">Opening your secure draft…</div>
      </main>
    );
  }

  if (isEditing && locked) {
    return (
      <main className="wedding-studio-page studio-editor-page">
        <div className="studio-editor-lock-panel">
          <Link to="/admin/studio" className="studio-editor-back-link">← Wedding Studio</Link>
          <span className="studio-editor-lock-icon" aria-hidden="true">🔒</span>
          <h1>This wedding card is locked</h1>
          <p>Enter the password set when this Studio draft was first saved.</p>
          {error && <p className="studio-editor-error" role="alert">{error}</p>}
          <form onSubmit={unlockDraft}>
            <label>
              Card password
              <input
                type="password"
                autoComplete="current-password"
                value={unlockPassword}
                onChange={(event) => setUnlockPassword(event.target.value)}
                required
                autoFocus
              />
            </label>
            <button type="submit" disabled={unlocking}>
              {unlocking ? "Unlocking…" : "Unlock Draft"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!template) {
    return (
      <main className="wedding-studio-page studio-editor-page">
        <div className="studio-editor-state">
          <h1>Design not available</h1>
          <p>This template is not registered in the current Wedding Studio.</p>
          <Link to="/admin/studio/templates">Browse Designs</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="wedding-studio-page studio-editor-page">
      <div className="wedding-studio-shell">
        <nav className="wedding-studio-nav" aria-label="Studio editor navigation">
          <Link to="/admin/studio/templates" className="wedding-studio-brand">
            <span className="wedding-studio-brand-mark" aria-hidden="true">✦</span>
            <span>
              <strong>Wedding Card Editor</strong>
              <small>{template.name}</small>
            </span>
          </Link>
          <div className="wedding-studio-nav-actions">
            <Link to="/admin/studio" className="wedding-studio-nav-link">Studio Home</Link>
            <Link to="/admin/studio/templates" className="wedding-studio-nav-create">All Designs</Link>
          </div>
        </nav>

        <header className="studio-editor-heading">
          <div>
            <span className="wedding-studio-kicker">YOUR INVITATION ATELIER</span>
            <h1>{isEditing ? "Refine your invitation." : "Make this card yours."}</h1>
            <p>
              Personalize the details on the left and see your wedding design
              update instantly on the right.
            </p>
          </div>
          <span className="studio-editor-draft-badge">Private Draft · Not Published</span>
        </header>

        {error && <div className="studio-editor-error" role="alert">{error}</div>}
        {notice && <div className="studio-editor-success" role="status">{notice}</div>}

        <div className="studio-editor-workspace">
          <form className="studio-editor-form" id="studio-draft-form" onSubmit={saveDraft}>
            <fieldset disabled={saving}>
              <section className="studio-editor-section" aria-labelledby="studio-editor-couple-title">
                <div className="studio-editor-section-heading">
                  <span className="studio-editor-step">01</span>
                  <div>
                    <h2 id="studio-editor-couple-title">Your Wedding Details</h2>
                    <p>Start with the names and words that make the card personal.</p>
                  </div>
                </div>

                <div className="studio-editor-fields">
                  <label>
                    Card title <span>Private library label</span>
                    <input
                      type="text"
                      maxLength={160}
                      placeholder="Our Wedding Invitation"
                      value={details.title}
                      onChange={(event) => updateDetail("title", event.target.value)}
                    />
                  </label>
                  <div className="studio-editor-two-col">
                    <label>
                      First partner's name
                      <input
                        type="text"
                        maxLength={120}
                        placeholder="Your first name"
                        value={details.partner1}
                        onChange={(event) => updateDetail("partner1", event.target.value)}
                      />
                    </label>
                    <label>
                      Second partner's name
                      <input
                        type="text"
                        maxLength={120}
                        placeholder="Your second name"
                        value={details.partner2}
                        onChange={(event) => updateDetail("partner2", event.target.value)}
                      />
                    </label>
                  </div>
                  <label>
                    Invitation heading
                    <input
                      type="text"
                      maxLength={160}
                      value={details.heading}
                      onChange={(event) => updateDetail("heading", event.target.value)}
                    />
                  </label>
                  <label>
                    Family introduction
                    <textarea
                      rows={2}
                      maxLength={300}
                      placeholder="Together with their families"
                      value={details.familyLine}
                      onChange={(event) => updateDetail("familyLine", event.target.value)}
                    />
                  </label>
                  <label>
                    Personal invitation message
                    <textarea
                      rows={3}
                      maxLength={800}
                      placeholder="We request the honor of your presence..."
                      value={details.message}
                      onChange={(event) => updateDetail("message", event.target.value)}
                    />
                  </label>
                  <label>
                    Wedding date
                    <input
                      type="date"
                      value={details.weddingDate}
                      onChange={(event) => updateDetail("weddingDate", event.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section className="studio-editor-section" aria-labelledby="studio-editor-venue-title">
                <div className="studio-editor-section-heading">
                  <span className="studio-editor-step">02</span>
                  <div>
                    <h2 id="studio-editor-venue-title">Events & Venue</h2>
                    <p>Choose your venue and add up to eight celebrations.</p>
                  </div>
                </div>
                <div className="studio-editor-fields">
                  <label>
                    Main venue
                    <input
                      type="text"
                      maxLength={160}
                      placeholder="Wedding venue"
                      value={details.venue.name}
                      onChange={(event) => updateVenue("name", event.target.value)}
                    />
                  </label>
                  <label>
                    Venue address
                    <textarea
                      rows={2}
                      maxLength={360}
                      placeholder="Street, area and city"
                      value={details.venue.address}
                      onChange={(event) => updateVenue("address", event.target.value)}
                    />
                  </label>
                </div>

                <div className="studio-editor-event-header">
                  <h3>Wedding events</h3>
                  <button type="button" onClick={addEvent} disabled={details.events.length >= 8}>
                    + Add Event
                  </button>
                </div>
                <div className="studio-editor-events">
                  {details.events.map((event, index) => (
                    <div className="studio-editor-event" key={index}>
                      <div className="studio-editor-event-title">
                        <strong>Event {index + 1}</strong>
                        <button
                          type="button"
                          aria-label={`Remove event ${index + 1}`}
                          onClick={() => removeEvent(index)}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="studio-editor-fields">
                        <label>
                          Ceremony / event name
                          <input
                            type="text"
                            maxLength={100}
                            placeholder="Wedding Ceremony"
                            value={event.title}
                            onChange={(change) => updateEvent(index, "title", change.target.value)}
                          />
                        </label>
                        <div className="studio-editor-two-col">
                          <label>
                            Event date
                            <input
                              type="date"
                              value={event.date}
                              onChange={(change) => updateEvent(index, "date", change.target.value)}
                            />
                          </label>
                          <label>
                            Event time
                            <input
                              type="text"
                              maxLength={40}
                              placeholder="7:00 PM"
                              value={event.time}
                              onChange={(change) => updateEvent(index, "time", change.target.value)}
                            />
                          </label>
                        </div>
                        <label>
                          Event-specific venue
                          <input
                            type="text"
                            maxLength={160}
                            placeholder="Only if different from main venue"
                            value={event.venue}
                            onChange={(change) => updateEvent(index, "venue", change.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {!isEditing && (
                <section className="studio-editor-section" aria-labelledby="studio-editor-security-title">
                  <div className="studio-editor-section-heading">
                    <span className="studio-editor-step">03</span>
                    <div>
                      <h2 id="studio-editor-security-title">Secure Your Draft</h2>
                      <p>Protect your card from anyone else using this account.</p>
                    </div>
                  </div>
                  <div className="studio-editor-fields">
                    <label>
                      Card password
                      <input
                        type="password"
                        minLength={8}
                        maxLength={72}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        placeholder="At least 8 characters"
                      />
                    </label>
                    <label>
                      Confirm card password
                      <input
                        type="password"
                        minLength={8}
                        maxLength={72}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                        placeholder="Repeat your password"
                      />
                    </label>
                  </div>
                </section>
              )}
            </fieldset>

            <div className="studio-editor-actions">
              <button className="studio-editor-save-button" type="submit" disabled={saving}>
                {saving ? "Saving Securely…" : isEditing ? "Save Changes" : "Save Private Draft"}
              </button>
              <Link to="/admin/studio" className="studio-editor-cancel-link">
                Back to Studio
              </Link>
            </div>
            <p className="studio-editor-note">
              Drafts are private and password protected. Publishing and sharing
              new Studio templates will be available in the next project phases.
            </p>
          </form>

          <aside className="studio-editor-preview" aria-label="Live wedding invitation preview">
            <div className="studio-editor-preview-header">
              <div>
                <span className="wedding-studio-kicker">INSTANT PREVIEW</span>
                <h2>{template.name}</h2>
              </div>
              <span className="studio-editor-live-indicator"><i aria-hidden="true" /> Live</span>
            </div>
            <StudioInvitationPreview template={template} details={details} enlarged />
            {details.events.some((event) => event.title || event.date || event.time || event.venue) && (
              <div className="studio-editor-preview-events">
                <h3>Celebration Schedule</h3>
                {details.events.filter((event) => event.title || event.date || event.time || event.venue)
                  .map((event, index) => (
                    <div className="studio-editor-preview-event" key={index}>
                      <strong>{event.title || `Event ${index + 1}`}</strong>
                      <span>
                        {[event.date, event.time, event.venue].filter(Boolean).join(" · ")
                          || "Details to be confirmed"}
                      </span>
                    </div>
                  ))}
                {details.venue.address?.trim() && (
                  <p className="studio-editor-preview-address">{details.venue.address}</p>
                )}
              </div>
            )}
            <div className="studio-editor-preview-note">
              The card and ceremony schedule update as you type. This is a private
              draft preview; public sharing comes in a later phase.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default StudioCardEditor;
