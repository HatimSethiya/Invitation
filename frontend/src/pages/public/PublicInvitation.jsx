import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import api from "../../services/api";
import EnvelopeReveal from "../../components/EnvelopeReveal";
import InvitationMusicPlayer from "../../components/InvitationMusicPlayer";

function formatDate(value, options = { dateStyle: "long" }) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, options);
}

// Motion stagger variants for luxurious fluid scroll reveals
const sectionVariants = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function PublicInvitation() {
  const { slug } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
  const [isUnboxed, setIsUnboxed] = useState(false);
  const [isHandoffStarted, setIsHandoffStarted] = useState(false);
  const musicAudioRef = useRef(null);
  const isInvitationInteractive = isHandoffStarted || isUnboxed;

  const startMusicFromOpenTap = useCallback(() => {
    const audio = musicAudioRef.current;
    if (!audio || !invitation?.music?.audioUrl) return;

    // Start within the tap handler so browsers recognize this as user-initiated playback.
    audio.play().catch(() => {
      // The player displays playback failures and lets the guest retry manually.
    });
  }, [invitation?.music?.audioUrl]);

  useEffect(() => {
    let active = true;

    api
      .get(`/invitations/public/${slug}`)
      .then((response) => {
        if (active) setInvitation(response.data.invitation);
      })
      .catch((err) => {
        if (active)
          setError(err.response?.data?.message || "Invitation not found.");
      });

    return () => {
      active = false;
    };
  }, [slug]);

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

  if (error) {
    return (
      <main className="public-page">
        <section className="public-card">
          <span className="eyebrow">Wedding Invitation</span>
          <h1>Invitation unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!invitation) {
    return (
      <main className="public-page">
        <section className="public-card">
          <div className="loading-orb" />
          <p>Preparing invitation...</p>
        </section>
      </main>
    );
  }

  if (invitation.theme === "bohraNikah") {
    const details = invitation.bohraDetails || {};
    const hasValue = (value) => typeof value === "string" && value.trim().length > 0;

    return (
      <main
        className={`public-page bohra-public-page ${isInvitationInteractive ? "invitation-revealed" : "invitation-locked"}`}
      >
        <AnimatePresence>
          {!isUnboxed && (
            <EnvelopeReveal
              invitation={invitation}
              onOpenMusic={startMusicFromOpenTap}
              onHandoffStart={() => setIsHandoffStarted(true)}
              onOpened={() => setIsUnboxed(true)}
            />
          )}
        </AnimatePresence>
        <InvitationMusicPlayer music={invitation.music} visible={isInvitationInteractive} audioRef={musicAudioRef} showControls={false} />

        <motion.div
          className="invitation-body bohra-invitation-body"
          initial={{ opacity: 0, y: 28, scale: 0.975 }}
          animate={{
            opacity: isHandoffStarted || isUnboxed ? 1 : 0,
            y: isHandoffStarted || isUnboxed ? 0 : 28,
            scale: isHandoffStarted || isUnboxed ? 1 : 0.975,
          }}
          transition={{
            opacity: { duration: 1.6, ease: [0.22, 1, 0.36, 1] },
            y: { duration: 1.75, ease: [0.22, 1, 0.36, 1] },
            scale: { duration: 1.85, ease: [0.22, 1, 0.36, 1] },
          }}
        >
          <article className="bohra-invitation-card">
            <div className="bohra-card-ornament bohra-card-ornament-top" aria-hidden="true">۞</div>
            <div className="bohra-card-inner-frame">
              <header className="bohra-card-header">
                <span className="bohra-card-emblem" aria-hidden="true">✦</span>
                <p className="bohra-bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                {hasValue(details.openingBlessing) && (
                  <p className="bohra-opening-line">{details.openingBlessing}</p>
                )}
                {hasValue(details.razaDuaLine) && (
                  <p className="bohra-raza-line">{details.razaDuaLine}</p>
                )}
                {hasValue(details.spiritualLeader) && (
                  <p className="bohra-leader-line">{details.spiritualLeader}</p>
                )}
              </header>

              {(hasValue(details.hostFamilyOne) || hasValue(details.hostFamilyTwo)) && (
                <section className="bohra-host-families">
                  {hasValue(details.hostFamilyOne) && <p>{details.hostFamilyOne}</p>}
                  {hasValue(details.hostFamilyOne) && hasValue(details.hostFamilyTwo) && (
                    <span className="bohra-thereafter">{details.hostBridge || "Thereafter"}</span>
                  )}
                  {hasValue(details.hostFamilyTwo) && <p>{details.hostFamilyTwo}</p>}
                </section>
              )}

              {hasValue(details.invitationWording) && (
                <p className="bohra-invitation-wording">{details.invitationWording}</p>
              )}

              <section className="bohra-couple-panel glass-panel">
                
                <div className="bohra-couple-names">
                  <h1>{groom}</h1>
                  <span className="bohra-weds">Weds</span>
                  <h1>{bride}</h1>
                </div>
                {hasValue(details.brideFamilyLine) && (
                  <p className="bohra-bride-family">{details.brideFamilyLine}</p>
                )}
              </section>

              {(hasValue(details.nikahOfficiantIntro) || hasValue(details.nikahOfficiant)) && (
                <section className="bohra-officiant-panel glass-panel">
                  {hasValue(details.nikahOfficiantIntro) && <p>{details.nikahOfficiantIntro}</p>}
                  {hasValue(details.nikahOfficiant) && <strong>{details.nikahOfficiant}</strong>}
                </section>
              )}

              {Array.isArray(invitation.events) && invitation.events.some((event) =>
                hasValue(event.title) || hasValue(event.venue) || hasValue(event.time) || event.date || hasValue(event.description)
              ) && (
                <section className="bohra-additional-events">
                  <motion.span
                    className="bohra-section-kicker bohra-programme-heading"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {details.programmeHeading || "Programme Insha Allah"}
                  </motion.span>
                  <div className="bohra-events-stagger">
                    {invitation.events.filter((event) =>
                      hasValue(event.title) || hasValue(event.venue) || hasValue(event.time) || event.date || hasValue(event.description)
                    ).map((event, index) => (
                      <motion.article
                        className="bohra-extra-event glass-panel"
                        key={event._id || event.title || `event-${index}`}
                        initial={{ opacity: 0, y: 32, scale: 0.985 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, amount: 0.22, margin: "0px 0px -70px 0px" }}
                        transition={{
                          duration: 0.78,
                          delay: Math.min(index * 0.08, 0.24),
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <div className="bohra-extra-event-topline">
                          <span className="bohra-extra-event-number">{String(index + 1).padStart(2, "0")}</span>
                        </div>
                        <h3>{event.title || event.type || "Celebration"}</h3>
                        <div className="bohra-programme-rule bohra-extra-event-rule" aria-hidden="true"><span>✦</span></div>
                        <div className="bohra-programme-details bohra-extra-event-details">
                          {event.date && (
                            <div className="bohra-detail-row">
                              <span className="bohra-detail-icon" aria-hidden="true">▦</span>
                              <div><strong>{formatDate(event.date)}</strong></div>
                            </div>
                          )}
                          {hasValue(event.time) && (
                            <div className="bohra-detail-row">
                              <span className="bohra-detail-icon" aria-hidden="true">◷</span>
                              <div><strong>{event.time}</strong></div>
                            </div>
                          )}
                          {hasValue(event.venue) && (
                            <div className="bohra-detail-row">
                              <span className="bohra-detail-icon" aria-hidden="true">⌖</span>
                              <div><strong>{event.venue}</strong></div>
                            </div>
                          )}
                          {hasValue(event.address) && (
                            <div className="bohra-detail-row">
                              <span className="bohra-detail-icon" aria-hidden="true">⌂</span>
                              <div><span>{event.address}</span></div>
                            </div>
                          )}
                        </div>
                        {hasValue(event.description) && <p className="bohra-extra-event-description">{event.description}</p>}
                        {hasValue(event.mapUrl) && <a className="bohra-extra-event-map-link" href={event.mapUrl} target="_blank" rel="noreferrer">Open Maps <span aria-hidden="true">↗</span></a>}
                      </motion.article>
                    ))}
                  </div>
                </section>
              )}

              {hasValue(details.complimentsFrom) && (
                <section className="bohra-compliments">
                  <span className="bohra-section-kicker">With The Best Compliments From</span>
                  <p>{details.complimentsFrom}</p>
                </section>
              )}

              {(hasValue(details.specialRequest) || hasValue(details.heavenlyBlessings)) && (
                <section className="bohra-family-notes">
                  {hasValue(details.specialRequest) && (
                    <div className="bohra-note-panel glass-panel">
                      <span className="bohra-note-title">Special Request</span>
                      <p>{details.specialRequest}</p>
                    </div>
                  )}
                  {hasValue(details.heavenlyBlessings) && (
                    <div className="bohra-note-panel glass-panel">
                      <span className="bohra-note-title">Heavenly Blessings</span>
                      <p>{details.heavenlyBlessings}</p>
                    </div>
                  )}
                </section>
              )}

              {(hasValue(details.senderName) || hasValue(details.senderFirm) ||
                hasValue(details.senderAddress) || hasValue(details.senderContacts)) && (
                <footer className="bohra-sender-footer">
                  {hasValue(details.senderName) && <span className="bohra-sender-from">From</span>}
                  {hasValue(details.senderName) && <strong>{details.senderName}</strong>}
                  {hasValue(details.senderFirm) && <p>{details.senderFirm}</p>}
                  {hasValue(details.senderAddress) && <p>{details.senderAddress}</p>}
                  {hasValue(details.senderContacts) && <p>{details.senderContacts}</p>}
                </footer>
              )}
            </div>
            <div className="bohra-card-ornament bohra-card-ornament-bottom" aria-hidden="true">۞</div>
          </article>
        </motion.div>
      </main>
    );
  }

  return (
    <main
      className={`public-page ${themeClass} ${
        isInvitationInteractive ? "invitation-revealed" : "invitation-locked"
      }`}
    >
      {/* 3D Envelope Unboxing Overlay with GSAP & Vanilla-Tilt */}
      <AnimatePresence>
        {!isUnboxed && (
          <EnvelopeReveal
            invitation={invitation}
            onOpenMusic={startMusicFromOpenTap}
            onHandoffStart={() => setIsHandoffStarted(true)}
            onOpened={() => setIsUnboxed(true)}
          />
        )}
      </AnimatePresence>
      <InvitationMusicPlayer music={invitation.music} visible={isInvitationInteractive} audioRef={musicAudioRef} />

      {/* Main Guest-Facing Invitation Body Animated via Motion */}
      <motion.div
        className="invitation-body"
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{
          opacity: isHandoffStarted || isUnboxed ? 1 : 0,
          y: isHandoffStarted || isUnboxed ? 0 : 24,
          scale: isHandoffStarted || isUnboxed ? 1 : 0.985,
        }}
        transition={{
          opacity: {
            duration: 1.55,
            ease: [0.22, 1, 0.36, 1],
          },
          y: {
            duration: 1.65,
            ease: [0.22, 1, 0.36, 1],
          },
          scale: {
            duration: 1.80,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
      >
        {/* Hero Section */}
        <motion.section
          className="public-hero"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <span className="eyebrow">You are invited</span>
          <p className="hero-script">Together with their families</p>
          <h1>
            {bride} <span>&amp;</span> {groom}
          </h1>
          <p className="public-date">{formatDate(invitation.weddingDate)}</p>
          {invitation.couple?.couplePhoto && (
            <motion.img
              className="couple-photo"
              src={invitation.couple.couplePhoto}
              alt={`${bride} and ${groom}`}
              initial={{ scale: 0.94, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
            />
          )}
        </motion.section>

        {/* Love Story Section */}
        {invitation.story?.length > 0 && (
          <motion.section
            className="public-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            <span className="eyebrow">Our Story</span>
            {invitation.story.map((item) => (
              <motion.article
                key={item._id || item.title}
                variants={cardItemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h2>{item.title}</h2>
                <p>{item.content}</p>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="story-image"
                    style={{
                      maxWidth: "100%",
                      borderRadius: "16px",
                      margin: "16px 0",
                    }}
                  />
                )}
              </motion.article>
            ))}
          </motion.section>
        )}

        {/* Ceremonies & Events Section */}
        {invitation.events?.length > 0 && (
          <section className="public-section public-celebrations-section">
            <motion.span
              className="eyebrow"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              The Celebrations
            </motion.span>
            <div className="public-event-list">
              {invitation.events.map((event, index) => (
                <motion.article
                  className="event-card"
                  key={event._id || event.title || `event-${index}`}
                  initial={{ opacity: 0, y: 32, scale: 0.985 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2, margin: "0px 0px -60px 0px" }}
                  transition={{
                    duration: 0.72,
                    delay: Math.min(index * 0.08, 0.24),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <span className="event-dot" />
                  <h2>{event.title || event.type}</h2>
                  <p>
                    {event.date && formatDate(event.date)}
                    {event.time ? ` · ${event.time}` : ""}
                  </p>
                  <strong>{event.venue}</strong>
                  {event.address && <p>{event.address}</p>}
                  {event.description && <p>{event.description}</p>}
                  {event.mapUrl && (
                    <a
                      href={event.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="event-map-link"
                    >
                      Open Maps ↗
                    </a>
                  )}
                </motion.article>
              ))}
            </div>
          </section>
        )}

        {/* Family Blessings Section */}
        {invitation.family?.length > 0 && (
          <motion.section
            className="public-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            <span className="eyebrow">With Blessings</span>
            <motion.div
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {invitation.family.map((member) => (
                <motion.div
                  className="family-line"
                  key={member._id || member.name}
                  variants={cardItemVariants}
                >
                  <strong>{member.name}</strong>
                  <span>{member.relation}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Photo Gallery Section */}
        {invitation.gallery?.length > 0 && (
          <motion.section
            className="public-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            <span className="eyebrow">Our Memories</span>
            <motion.div
              className="public-gallery"
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-20px" }}
            >
              {invitation.gallery.map((image) => (
                <motion.figure
                  key={image._id || image.imageUrl}
                  variants={cardItemVariants}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.caption || "Wedding memory"}
                    loading="lazy"
                    decoding="async"
                  />
                  {image.caption && <figcaption>{image.caption}</figcaption>}
                </motion.figure>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Main Venue Section */}
        {invitation.venue?.name && (
          <motion.section
            className="public-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            <span className="eyebrow">Venue</span>
            <h2>{invitation.venue.name}</h2>
            <p>
              {invitation.venue.address}
              {invitation.venue.city ? `, ${invitation.venue.city}` : ""}
            </p>
            {invitation.venue.mapUrl && (
              <a
                href={invitation.venue.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="venue-map-link"
              >
                Open Venue Map ↗
              </a>
            )}
          </motion.section>
        )}

        {/* Closing Footer */}
        <motion.footer
          className="invitation-closing"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="closing-mark">♡</span>
          <p>With love,</p>
          <strong>
            {bride} &amp; {groom}
          </strong>
        </motion.footer>
      </motion.div>
    </main>
  );
}

export default PublicInvitation;
