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

function InvitationOpening({ invitation, onOpen }) {
  const bride = invitation.couple?.brideName || "Bride";
  const groom = invitation.couple?.groomName || "Groom";
  const copy = themeCopy[invitation.theme] || themeCopy.royalRose;

  return (
    <section className="invitation-opening" aria-label="Wedding invitation opening">
      <div className="opening-glow opening-glow-one" />
      <div className="opening-glow opening-glow-two" />
      <div className="opening-petal petal-one">✦</div>
      <div className="opening-petal petal-two">❋</div>
      <div className="opening-petal petal-three">✦</div>
      <div className="opening-petal petal-four">❋</div>

      <div className="opening-content">
        <div className="opening-monogram">{copy.accent}</div>
        <p className="opening-kicker">A little note of forever</p>
        <div className="opening-rule"><span /></div>
        <p className="opening-invite">You are warmly invited to celebrate</p>

        <h1 className="opening-names">
          <span>{bride}</span>
          <i>&amp;</i>
          <span>{groom}</span>
        </h1>

        <p className="opening-date">{formatDate(invitation.weddingDate)}</p>

        <button className="open-invitation" onClick={onOpen} type="button">
          <span className="open-ring">⌄</span>
          <span>Open Invitation</span>
        </button>
        <p className="opening-hint">Tap to begin the celebration</p>
      </div>
    </section>
  );
}

function PublicInvitation() {
  const { slug } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
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
    if (!opened) return;
    document.body.classList.add("invitation-is-open");
    return () => document.body.classList.remove("invitation-is-open");
  }, [opened]);

  const themeClass = useMemo(() => `theme-${invitation?.theme || "royalRose"}`, [invitation?.theme]);

  if (error) {
    return <main className="public-page"><section className="public-card"><span className="eyebrow">Wedding Invitation</span><h1>Invitation unavailable</h1><p>{error}</p></section></main>;
  }

  if (!invitation) {
    return <main className="public-page"><section className="public-card"><div className="loading-orb" /><p>Opening invitation...</p></section></main>;
  }

  return (
    <main className={`public-page ${themeClass} ${opened ? "invitation-revealed" : "invitation-locked"}`}>
      {!opened && <InvitationOpening invitation={invitation} onOpen={() => setOpened(true)} />}

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
