import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

function PublicInvitation() {
  const { slug } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/invitations/public/${slug}`).then((response) => setInvitation(response.data.invitation)).catch((err) => setError(err.response?.data?.message || "Invitation not found."));
  }, [slug]);

  if (error) return <main className="public-page"><section className="public-card"><span className="eyebrow">Wedding Invitation</span><h1>Invitation unavailable</h1><p>{error}</p></section></main>;
  if (!invitation) return <main className="public-page"><section className="public-card"><div className="loading-orb" /><p>Opening invitation...</p></section></main>;

  return (
    <main className={`public-page theme-${invitation.theme}`}>
      <section className="public-hero">
        <span className="eyebrow">You are invited</span>
        <h1>{invitation.couple?.brideName || "Bride"} <span>&</span> {invitation.couple?.groomName || "Groom"}</h1>
        <p className="public-date">{new Date(invitation.weddingDate).toLocaleDateString(undefined, { dateStyle: "long" })}</p>
        {invitation.couple?.couplePhoto && <img className="couple-photo" src={invitation.couple.couplePhoto} alt="The couple" />}
      </section>

      {invitation.story?.length > 0 && <section className="public-section"><span className="eyebrow">Our Story</span>{invitation.story.map((item) => <article key={item._id}><h2>{item.title}</h2><p>{item.content}</p></article>)}</section>}
      {invitation.events?.length > 0 && <section className="public-section"><span className="eyebrow">The Celebrations</span>{invitation.events.map((event) => <article className="event-card" key={event._id}><h2>{event.title || event.type}</h2><p>{event.date && new Date(event.date).toLocaleDateString()} · {event.time}</p><strong>{event.venue}</strong><p>{event.address}</p>{event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noreferrer">Open Maps</a>}</article>)}</section>}
      {invitation.family?.length > 0 && <section className="public-section"><span className="eyebrow">With Blessings</span>{invitation.family.map((member) => <div className="family-line" key={member._id}><strong>{member.name}</strong><span>{member.relation}</span></div>)}</section>}
      {invitation.gallery?.length > 0 && <section className="public-section"><span className="eyebrow">Our Memories</span><div className="public-gallery">{invitation.gallery.map((image) => <figure key={image._id}><img src={image.imageUrl} alt={image.caption || "Wedding memory"} /><figcaption>{image.caption}</figcaption></figure>)}</div></section>}
      {invitation.venue?.name && <section className="public-section"><span className="eyebrow">Venue</span><h2>{invitation.venue.name}</h2><p>{invitation.venue.address}, {invitation.venue.city}</p>{invitation.venue.mapUrl && <a href={invitation.venue.mapUrl} target="_blank" rel="noreferrer">Open Venue Map</a>}</section>}
    </main>
  );
}
export default PublicInvitation;
