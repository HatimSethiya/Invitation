import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

const themeCopy = {
  royalRose: { accent: "A", line: "An evening woven with love" },
  emeraldGarden: { accent: "E", line: "Where two stories become one" },
  ivoryHeritage: { accent: "I", line: "A timeless beginning together" },
};

function formatDate(value, options = { dateStyle: "long" }) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, options);
}

function InvitationOpening({ invitation, started, onOpen }) {
  const bride = invitation.couple?.brideName || "Bride";
  const groom = invitation.couple?.groomName || "Groom";
  const copy = themeCopy[invitation.theme] || themeCopy.royalRose;
  const particles = Array.from({ length: 18 });

  return (
    <section className={`invitation-opening ${started ? "opening-started" : ""}`} aria-label="Wedding invitation opening">
      <div className="opening-vignette" />
      <div className="opening-atmosphere" />
      <div className="opening-doors">
        <div className="door-panel door-left"><span className="door-vine vine-top">❧</span><span className="door-vine vine-bottom">❧</span></div>
        <div className="door-panel door-right"><span className="door-vine vine-top">❧</span><span className="door-vine vine-bottom">❧</span></div>
        <div className="door-seam" />
      </div>

      <div className="opening-card-shadow" />
      <button className="wedding-card" onClick={onOpen} type="button" aria-label="Open wedding invitation" disabled={started}>
        <div className="card-paper">
          <div className="card-ornament ornament-top">❧</div>
          <div className="card-ornament ornament-bottom">❧</div>
          <div className="card-inner-border" />
          <div className="card-monogram">{copy.accent}</div>
          <p className="card-small">A WEDDING INVITATION</p>
          <h1><span>{bride}</span><i>&amp;</i><span>{groom}</span></h1>
          <div className="card-divider"><b>✦</b></div>
          <p className="card-date">{formatDate(invitation.weddingDate, { day: "numeric", month: "long", year: "numeric" })}</p>
          <span className="card-tap">TAP TO OPEN</span>
          <span className="card-arrow">↓</span>
        </div>
      </button>

      <div className="opening-bottom-curtain">
        <span className="curtain-fold fold-one" /><span className="curtain-fold fold-two" /><span className="curtain-fold fold-three" />
      </div>

      <div className="opening-particles">
        {particles.map((_, index) => <i key={index} className={`particle particle-${index + 1}`}>✦</i>)}
      </div>
      <div className="opening-flare" />
      <div className="opening-caption">Tap the invitation to begin</div>
    </section>
  );
}
function PublicInvitation() {
  const { slug } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
  const [openingStarted, setOpeningStarted] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/invitations/public/${slug}`)
      .then((response) => {
        if (active) setInvitation(response.data.invitation);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Invitation not found.");
      });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!openingStarted) return;
    const timer = window.setTimeout(() => setOpened(true), 2350);
    return () => window.clearTimeout(timer);
  }, [openingStarted]);

  const themeClass = useMemo(() => `theme-${invitation?.theme || "royalRose"}`, [invitation?.theme]);

  if (error) {
    return <main className="public-page"><section className="public-card"><span className="eyebrow">Wedding Invitation</span><h1>Invitation unavailable</h1><p>{error}</p></section></main>;
  }

  if (!invitation) {
    return <main className="public-page"><section className="public-card"><div className="loading-orb" /><p>Opening invitation...</p></section></main>;
  }

  return (
    <main className={`public-page ${themeClass} ${opened ? "invitation-revealed" : "invitation-locked"}`}>
      {!opened && <InvitationOpening invitation={invitation} started={openingStarted} onOpen={() => setOpeningStarted(true)} />}

      <div className="invitation-body">
        <section className="public-hero reveal-up">
          <span className="eyebrow">You are invited</span>
          <p className="hero-script">Together with their families</p>
          <h1>{invitation.couple?.brideName || "Bride"} <span>&amp;</span> {invitation.couple?.groomName || "Groom"}</h1>
          <p className="public-date">{formatDate(invitation.weddingDate)}</p>
          {invitation.couple?.couplePhoto && <img className="couple-photo" src={invitation.couple.couplePhoto} alt="The couple" />}
        </section>

        {invitation.story?.length > 0 && (
          <section className="public-section reveal-up">
            <span className="eyebrow">Our Story</span>
            {invitation.story.map((item) => <article key={item._id}><h2>{item.title}</h2><p>{item.content}</p></article>)}
          </section>
        )}

        {invitation.events?.length > 0 && (
          <section className="public-section reveal-up">
            <span className="eyebrow">The Celebrations</span>
            {invitation.events.map((event) => (
              <article className="event-card" key={event._id}>
                <span className="event-dot" />
                <h2>{event.title || event.type}</h2>
                <p>{event.date && formatDate(event.date)}{event.time ? ` · ${event.time}` : ""}</p>
                <strong>{event.venue}</strong>
                <p>{event.address}</p>
                {event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noreferrer">Open Maps ↗</a>}
              </article>
            ))}
          </section>
        )}

        {invitation.family?.length > 0 && (
          <section className="public-section reveal-up">
            <span className="eyebrow">With Blessings</span>
            {invitation.family.map((member) => <div className="family-line" key={member._id}><strong>{member.name}</strong><span>{member.relation}</span></div>)}
          </section>
        )}

        {invitation.gallery?.length > 0 && (
          <section className="public-section reveal-up">
            <span className="eyebrow">Our Memories</span>
            <div className="public-gallery">{invitation.gallery.map((image) => <figure key={image._id}><img src={image.imageUrl} alt={image.caption || "Wedding memory"} /><figcaption>{image.caption}</figcaption></figure>)}</div>
          </section>
        )}

        {invitation.venue?.name && (
          <section className="public-section reveal-up">
            <span className="eyebrow">Venue</span>
            <h2>{invitation.venue.name}</h2>
            <p>{invitation.venue.address}, {invitation.venue.city}</p>
            {invitation.venue.mapUrl && <a href={invitation.venue.mapUrl} target="_blank" rel="noreferrer">Open Venue Map ↗</a>}
          </section>
        )}

        <footer className="invitation-closing reveal-up">
          <span className="closing-mark">♡</span>
          <p>With love,</p>
          <strong>{invitation.couple?.brideName || "Bride"} &amp; {invitation.couple?.groomName || "Groom"}</strong>
        </footer>
      </div>
    </main>
  );
}

export default PublicInvitation;
