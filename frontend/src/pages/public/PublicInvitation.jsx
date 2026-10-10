import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import api from "../../services/api";
import EnvelopeReveal from "../../components/EnvelopeReveal";

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

  return (
    <main
      className={`public-page ${themeClass} ${
        isUnboxed ? "invitation-revealed" : "invitation-locked"
      }`}
    >
      {/* 3D Envelope Unboxing Overlay with GSAP & Vanilla-Tilt */}
      <AnimatePresence>
        {!isUnboxed && (
          <EnvelopeReveal
            invitation={invitation}
            onHandoffStart={() => setIsHandoffStarted(true)}
            onOpened={() => setIsUnboxed(true)}
          />
        )}
      </AnimatePresence>

      {/* Main Guest-Facing Invitation Body Animated via Motion */}
      <motion.div
        className={`invitation-body ${
          isHandoffStarted ? "invitation-handoff-active" : ""
        }`}
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{
          opacity: isHandoffStarted || isUnboxed ? 1 : 0,
          y: isHandoffStarted || isUnboxed ? 0 : 24,
          scale: isHandoffStarted || isUnboxed ? 1 : 0.985,
        }}
        transition={{
          opacity: {
            duration: 1.15,
            ease: [0.22, 1, 0.36, 1],
          },
          y: {
            duration: 1.25,
            ease: [0.22, 1, 0.36, 1],
          },
          scale: {
            duration: 1.35,
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
          <motion.section
            className="public-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
          >
            <span className="eyebrow">The Celebrations</span>
            <motion.div
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
            >
              {invitation.events.map((event) => (
                <motion.article
                  className="event-card"
                  key={event._id || event.title}
                  variants={cardItemVariants}
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
            </motion.div>
          </motion.section>
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
