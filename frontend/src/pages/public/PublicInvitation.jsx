import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import api from "../../services/api";
import EnvelopeReveal from "../../components/EnvelopeReveal";
import "./royal-grace-theme.css";

function formatDate(value, options = { dateStyle: "long" }) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, options);
}

function getCountdown(value) {
  const target = new Date(value).getTime();
  if (!value || Number.isNaN(target)) return null;
  const difference = Math.max(0, target - Date.now());
  return {
    days: Math.floor(difference / 86400000),
    hours: Math.floor((difference % 86400000) / 3600000),
    minutes: Math.floor((difference % 3600000) / 60000),
    seconds: Math.floor((difference % 60000) / 1000),
  };
}

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.13 } },
};

function Ornament({ className = "" }) {
  return (
    <div className={`rg-ornament ${className}`} aria-hidden="true">
      <span />
      <i>✦</i>
      <span />
    </div>
  );
}

function SectionHeading({ kicker, title, note }) {
  return (
    <header className="rg-section-heading">
      <span className="rg-kicker">{kicker}</span>
      <h2>{title}</h2>
      <Ornament />
      {note && <p>{note}</p>}
    </header>
  );
}

function PublicInvitation() {
  const { slug } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
  const [isUnboxed, setIsUnboxed] = useState(false);
  const [isHandoffStarted, setIsHandoffStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);

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
    if (!invitation?.weddingDate) return undefined;
    const update = () => setCountdown(getCountdown(invitation.weddingDate));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [invitation?.weddingDate]);

  const themeClass = useMemo(
    () => `theme-${invitation?.theme || "royalRose"}`,
    [invitation?.theme]
  );
  const bride =
    invitation?.couple?.partner1?.name ||
    invitation?.couple?.brideName ||
    "Bride";
  const groom =
    invitation?.couple?.partner2?.name ||
    invitation?.couple?.groomName ||
    "Groom";
  const weddingDate = formatDate(invitation?.weddingDate);
  const musicUrl = invitation?.music?.audioUrl;
  const mapUrl = invitation?.venue?.mapUrl;

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setMusicPlaying(true);
      } catch {
        setMusicPlaying(false);
      }
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  };

  if (error) {
    return (
      <main className="public-page rg-error">
        <section className="rg-paper-card">
          <span className="rg-kicker">Wedding Invitation</span>
          <h1>Invitation unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!invitation) {
    return (
      <main className="public-page rg-loading">
        <div className="rg-loading-seal">✦</div>
        <p>Preparing your invitation…</p>
      </main>
    );
  }

  return (
    <main className={`public-page ${themeClass} rg-invitation ${isUnboxed ? "invitation-revealed" : "invitation-locked"}`}>
      {musicUrl && (
        <>
          <audio ref={audioRef} src={musicUrl} loop={invitation.music?.loop !== false} preload="none" />
          <button className="rg-music-toggle" type="button" onClick={toggleMusic} aria-label={musicPlaying ? "Pause wedding music" : "Play wedding music"}>
            <span className={musicPlaying ? "rg-music-bars is-playing" : "rg-music-bars"}><i /><i /><i /><i /></span>
            <span>{musicPlaying ? "Pause music" : "Play music"}</span>
          </button>
        </>
      )}

      <AnimatePresence>
        {!isUnboxed && (
          <EnvelopeReveal
            invitation={invitation}
            onHandoffStart={() => setIsHandoffStarted(true)}
            onOpened={() => setIsUnboxed(true)}
          />
        )}
      </AnimatePresence>

      <motion.div
        className={`invitation-body rg-page-frame ${isHandoffStarted ? "invitation-handoff-active" : ""}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isHandoffStarted || isUnboxed ? 1 : 0, y: isHandoffStarted || isUnboxed ? 0 : 20 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="rg-topline"><span>THE WEDDING CELEBRATION</span><span>✦</span><span>MADE WITH LOVE</span></div>

        <motion.section className="rg-hero" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="rg-hero-frame">
            <div className="rg-corner rg-corner-tl" /><div className="rg-corner rg-corner-tr" />
            <div className="rg-corner rg-corner-bl" /><div className="rg-corner rg-corner-br" />
            <p className="rg-script rg-hero-intro">Together with their families</p>
            <p className="rg-kicker">JOYFULLY INVITE YOU TO CELEBRATE</p>
            <h1><span>{bride}</span><em>&amp;</em><span>{groom}</span></h1>
            <Ornament className="rg-hero-ornament" />
            <p className="rg-hero-date">{weddingDate}</p>
            {invitation.venue?.name && <p className="rg-hero-venue">{invitation.venue.name}</p>}
            {invitation.couple?.couplePhoto ? (
              <div className="rg-hero-portrait"><img src={invitation.couple.couplePhoto} alt={`${bride} and ${groom}`} fetchPriority="high" /></div>
            ) : (
              <div className="rg-monogram" aria-label="Couple monogram">{(bride[0] || "B").toUpperCase()} <span>&amp;</span> {(groom[0] || "G").toUpperCase()}</div>
            )}
            <p className="rg-hero-blessing">Two hearts, one beautiful beginning</p>
            <a className="rg-scroll-cue" href="#rg-story"><span>↓</span> SCROLL TO EXPLORE</a>
          </div>
        </motion.section>

        <section className="rg-blessing-strip">
          <span>✧</span><p>With the blessings of our families, we begin a new chapter together.</p><span>✧</span>
        </section>

        {invitation.story?.length > 0 && (
          <motion.section id="rg-story" className="rg-section rg-story" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            <SectionHeading kicker="A TALE OF TWO HEARTS" title="Our Love Story" note="Every love story is beautiful, but ours is our favourite." />
            <div className="rg-story-list">
              {invitation.story.map((item, index) => (
                <motion.article className={`rg-story-item ${index % 2 ? "rg-story-reverse" : ""}`} key={item._id || item.title || index} variants={reveal}>
                  {item.image && <div className="rg-story-image"><img src={item.image} alt={item.title || "Our story"} loading="lazy" /></div>}
                  <div className="rg-story-copy"><span className="rg-story-number">0{index + 1}</span><h3>{item.title}</h3><p>{item.content}</p></div>
                </motion.article>
              ))}
            </div>
          </motion.section>
        )}

        {countdown && (
          <motion.section className="rg-countdown-section" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="rg-script">The countdown begins</p>
            <SectionHeading kicker="COUNTING EVERY MOMENT" title="Until We Say I Do" />
            <div className="rg-countdown" aria-label="Time remaining until the wedding">
              {Object.entries(countdown).map(([unit, value]) => <div className="rg-countdown-unit" key={unit}><strong>{String(value).padStart(2, "0")}</strong><span>{unit}</span></div>)}
            </div>
          </motion.section>
        )}

        {invitation.couple?.brideBio || invitation.couple?.groomBio || invitation.couple?.bridePhoto || invitation.couple?.groomPhoto ? (
          <motion.section className="rg-section rg-couple-section" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <SectionHeading kicker="THE TWO SOULS" title="Meet the Couple" note="Two families, two journeys, one shared forever." />
            <div className="rg-couple-grid">
              <article className="rg-person">
                {invitation.couple?.bridePhoto && <img src={invitation.couple.bridePhoto} alt={bride} loading="lazy" />}
                <span className="rg-kicker">THE BRIDE</span><h3>{bride}</h3>{invitation.couple?.brideBio && <p>{invitation.couple.brideBio}</p>}
              </article>
              <div className="rg-couple-ampersand">&amp;</div>
              <article className="rg-person">
                {invitation.couple?.groomPhoto && <img src={invitation.couple.groomPhoto} alt={groom} loading="lazy" />}
                <span className="rg-kicker">THE GROOM</span><h3>{groom}</h3>{invitation.couple?.groomBio && <p>{invitation.couple.groomBio}</p>}
              </article>
            </div>
          </motion.section>
        ) : null}

        {invitation.events?.length > 0 && (
          <motion.section className="rg-section rg-events-section" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            <SectionHeading kicker="SAVE THE DATE" title="Wedding Festivities" note="We would be honoured to have you with us for these special moments." />
            <motion.div className="rg-events-grid" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {invitation.events.map((event, index) => (
                <motion.article className="rg-event-card" key={event._id || event.title || index} variants={reveal}>
                  <div className="rg-event-top"><span>CELEBRATION {String(index + 1).padStart(2, "0")}</span><i>✦</i></div>
                  <h3>{event.title || event.type}</h3>
                  {event.date && <p className="rg-event-date">{formatDate(event.date, { day: "numeric", month: "long", year: "numeric" })}</p>}
                  {event.time && <p className="rg-event-time">{event.time}</p>}
                  <Ornament />
                  {event.venue && <strong>{event.venue}</strong>}
                  {event.address && <p>{event.address}</p>}
                  {event.description && <p className="rg-event-description">{event.description}</p>}
                  {event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noreferrer" className="rg-text-link">GET DIRECTIONS ↗</a>}
                </motion.article>
              ))}
            </motion.div>
          </motion.section>
        )}

        {invitation.family?.length > 0 && (
          <motion.section className="rg-family-section" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <SectionHeading kicker="SURROUNDED BY LOVE" title="Family & Blessings" note="Celebrating the people who made us who we are." />
            <div className="rg-family-grid">
              {invitation.family.map((member, index) => <div className="rg-family-member" key={member._id || member.name || index}><span>✧</span><strong>{member.name}</strong><p>{member.relation}</p></div>)}
            </div>
          </motion.section>
        )}

        {invitation.gallery?.length > 0 && (
          <motion.section className="rg-section rg-gallery-section" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
            <SectionHeading kicker="LITTLE MOMENTS, BIG MEMORIES" title="Captured with Love" note="A few favourite moments from our journey." />
            <motion.div className="rg-gallery" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {invitation.gallery.map((image, index) => <motion.figure className={`rg-gallery-item rg-gallery-item-${index % 5}`} key={image._id || image.imageUrl || index} variants={reveal}><img src={image.imageUrl} alt={image.caption || "Wedding memory"} loading="lazy" />{image.caption && <figcaption>{image.caption}</figcaption>}</motion.figure>)}
            </motion.div>
          </motion.section>
        )}

        {(invitation.venue?.name || invitation.venue?.address || invitation.venue?.city) && (
          <motion.section className="rg-venue-section" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="rg-venue-inner">
              <SectionHeading kicker="WE'LL SAVE YOU A SEAT" title="The Venue" note="Join us as we celebrate a day to remember." />
              <div className="rg-venue-mark">⌖</div>
              <h3>{invitation.venue.name}</h3>
              <p>{[invitation.venue.address, invitation.venue.city].filter(Boolean).join(", ")}</p>
              {(mapUrl || (invitation.venue.latitude && invitation.venue.longitude)) && <a className="rg-gold-button" href={mapUrl || `https://www.google.com/maps?q=${encodeURIComponent(`${invitation.venue.latitude},${invitation.venue.longitude}`)}`} target="_blank" rel="noreferrer">VIEW LOCATION ↗</a>}
            </div>
          </motion.section>
        )}

        <motion.footer className="rg-footer" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Ornament />
          <p className="rg-script">With love and gratitude</p>
          <h2>{bride} <span>&amp;</span> {groom}</h2>
          <p>{weddingDate}</p>
          <div className="rg-footer-seal">✦</div>
          <small>WE CAN'T WAIT TO CELEBRATE WITH YOU</small>
        </motion.footer>
      </motion.div>
    </main>
  );
}

export default PublicInvitation;
