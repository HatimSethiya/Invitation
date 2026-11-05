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
  const [isMusicStartRequested, setIsMusicStartRequested] = useState(false);
  const musicAudioRef = useRef(null);
  const roseGoldEffectsCanvasRef = useRef(null);
  const musicStartRequestedRef = useRef(false);
  const isInvitationInteractive = isHandoffStarted || isUnboxed;

  const startMusicFromOpenTap = useCallback(() => {
    setIsMusicStartRequested(true);
    const audio = musicAudioRef.current;
    if (!audio || !invitation?.music?.audioUrl) return;

    // Invoke play synchronously from the tap, before starting any curtain timers.
    musicStartRequestedRef.current = true;
    audio.muted = false;
    audio.volume = 1;
    const playback = audio.play();

    // The audio element will retry on canplay if the source needed time to buffer.
    if (playback && typeof playback.catch === "function") {
      playback.catch(() => {
        // Keep the request pending so InvitationMusicPlayer can retry once ready.
      });
    }
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

  // White Rose Gold-only canvas effects: falling gold sprinkles and a recurring card sheen.
  useEffect(() => {
    const canvas = roseGoldEffectsCanvasRef.current;
    const card = canvas?.closest(".bohra-invitation-card");

    if (
      !canvas ||
      !card ||
      invitation?.theme !== "whiteRoseGold" ||
      !isInvitationInteractive
    ) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let frameId = 0;
    let width = 0;
    let height = 0;
    let elapsed = 0;
    let lastFrameTime = 0;
    let lastScrollY = window.scrollY;
    let lastBurstTime = 0;
    let particles = [];

    const random = (min, max) => min + Math.random() * (max - min);

    const createParticle = (x, y, isScrollBurst = false) => {
      const life = random(1.1, 2.3);
      return {
        x,
        y,
        radius: random(0.85, isScrollBurst ? 2.8 : 2.1),
        speed: random(0.42, isScrollBurst ? 2.0 : 1.35),
        drift: random(-0.28, 0.28),
        phase: random(0, Math.PI * 2),
        opacity: random(0.48, 0.92),
        life,
        initialLife: life,
        isScrollBurst,
      };
    };

    const resizeCanvas = () => {
      width = card.clientWidth;
      height = card.clientHeight;
      // A 1:1 backing store keeps the tall card canvas inexpensive on mobile.
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      context.setTransform(1, 0, 0, 1, 0, 0);

      const particleCount = Math.min(
        115,
        Math.max(80, Math.round((width * height) / 15000))
      );
      particles = Array.from({ length: particleCount }, () =>
        createParticle(random(0, width), random(0, height))
      );

      if (reducedMotion) renderFrame(0, 0);
    };

    const renderFrame = (deltaSeconds, timestampSeconds) => {
      context.clearRect(0, 0, width, height);

      particles = particles.filter((particle) => {
        if (!reducedMotion) {
          particle.y += particle.speed * deltaSeconds * 60;
          particle.x +=
            particle.drift * deltaSeconds * 60 +
            Math.sin(timestampSeconds * 1.3 + particle.phase) * 0.12;

          if (particle.isScrollBurst) {
            particle.life -= deltaSeconds;
            if (particle.life <= 0) return false;
          }

          if (particle.y > height + 4) {
            particle.y = -4;
            particle.x = random(0, width);
          }
          if (particle.x < -4) particle.x = width + 4;
          if (particle.x > width + 4) particle.x = -4;
        }

        const lifeOpacity = particle.isScrollBurst
          ? Math.max(0, particle.life / particle.initialLife)
          : 1;
        const twinkle = reducedMotion
          ? 0.82
          : 0.72 + Math.sin(timestampSeconds * 2.2 + particle.phase) * 0.22;
        const alpha = particle.opacity * lifeOpacity * twinkle;
        const goldTone =
          particle.phase % 3 > 2
            ? `rgba(226,163,139,${alpha})`
            : `rgba(218,157,67,${alpha})`;

        context.fillStyle = goldTone;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();

        if (particle.radius > 1.45 && alpha > 0.22) {
          context.strokeStyle = `rgba(255,246,221,${alpha * 0.72})`;
          context.lineWidth = 0.55;
          context.beginPath();
          context.moveTo(particle.x - particle.radius * 1.8, particle.y);
          context.lineTo(particle.x + particle.radius * 1.8, particle.y);
          context.moveTo(particle.x, particle.y - particle.radius * 1.8);
          context.lineTo(particle.x, particle.y + particle.radius * 1.8);
          context.stroke();
        }

        return true;
      });

      // A soft metallic light band sweeps across the card every 3.5 seconds.
      if (!reducedMotion) {
        const cycleProgress = (timestampSeconds % 3.5) / 3.5;
        const bandWidth = Math.max(115, width * 0.34);
        const bandX = cycleProgress * (width + bandWidth) - bandWidth;

        context.save();
        context.translate(bandX, 0);
        context.transform(1, 0, -0.12, 1, 0, 0);
        context.globalCompositeOperation = "screen";
        const sheen = context.createLinearGradient(0, 0, bandWidth, 0);
        sheen.addColorStop(0, "rgba(255,248,229,0)");
        sheen.addColorStop(0.34, "rgba(255,248,229,0.025)");
        sheen.addColorStop(0.5, "rgba(255,244,213,0.14)");
        sheen.addColorStop(0.63, "rgba(218,169,111,0.075)");
        sheen.addColorStop(1, "rgba(255,248,229,0)");
        context.fillStyle = sheen;
        context.fillRect(0, 0, bandWidth, height);
        context.restore();
      }
    };

    const animate = (timestamp) => {
      frameId = window.requestAnimationFrame(animate);
      if (timestamp - lastFrameTime < 30) return;

      const deltaSeconds = Math.min(
        0.05,
        (timestamp - lastFrameTime) / 1000 || 0.016
      );
      lastFrameTime = timestamp;
      elapsed += deltaSeconds;
      renderFrame(deltaSeconds, elapsed);
    };

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      const now = performance.now();

      if (scrollDelta > 2 && now - lastBurstTime > 65) {
        const cardTop = card.getBoundingClientRect().top + window.scrollY;
        const visibleTop = Math.max(
          0,
          Math.min(height, currentScrollY - cardTop + 14)
        );
        const burstCount = Math.min(
          16,
          Math.max(4, Math.round(scrollDelta / 2))
        );

        for (let index = 0; index < burstCount; index += 1) {
          particles.push(
            createParticle(random(0, width), visibleTop + random(0, 24), true)
          );
        }
        lastBurstTime = now;
      }

      lastScrollY = currentScrollY;
    };

    resizeCanvas();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(resizeCanvas)
        : null;
    resizeObserver?.observe(card);
    window.addEventListener("resize", resizeCanvas, { passive: true });

    if (!reducedMotion) {
      window.addEventListener("scroll", onScroll, { passive: true });
      frameId = window.requestAnimationFrame(animate);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("scroll", onScroll);
    };
  }, [invitation?.theme, isInvitationInteractive]);

  const themeClass = useMemo(
    () => `theme-${invitation?.theme || "purpleWhite"}`,
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

  // Avoid flashing a generic placeholder card while invitation data loads.
  // Keep a quiet pearl/lavender backdrop until the real cover and theme are ready.
  if (!invitation) {
    return (
      <main className="public-page invitation-loading-screen" aria-busy="true" />
    );
  }

  if (invitation) {
    const details = invitation.bohraDetails || {};
    const firstNikah = invitation.firstNikah || {};
    const primaryNames = invitation.couple?.nameOrder === "brideFirst" ? [bride, groom] : [groom, bride];
    const secondBride = invitation.secondCouple?.brideName || "Bride";
    const secondGroom = invitation.secondCouple?.groomName || "Groom";
    const secondNames = invitation.secondCouple?.nameOrder === "brideFirst" ? [secondBride, secondGroom] : [secondGroom, secondBride];
    const hasValue = (value) => typeof value === "string" && value.trim().length > 0;

    const protectedDesignSlugs = new Set(["mufaddalweddinginvitation", "mariya"]);
    const normalizedSlug = (invitation.slug || "").toLowerCase();
    const normalizedTitle = (invitation.title || "").toLowerCase();
    const isLegacyProtectedDesign = protectedDesignSlugs.has(normalizedSlug)
      || normalizedSlug.includes("mariya")
      || normalizedTitle.includes("mariya");
    const useEnhancedNewDesign = !isLegacyProtectedDesign;

    return (
      <main
        className={`public-page bohra-public-page ${themeClass} ${useEnhancedNewDesign ? "new-design-enhanced" : ""} ${isInvitationInteractive ? "invitation-revealed" : "invitation-locked"}`}
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
        <InvitationMusicPlayer music={invitation.music} visible={isInvitationInteractive || isMusicStartRequested} audioRef={musicAudioRef} startRequestedRef={musicStartRequestedRef} showControls={false} />

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
            {invitation.theme === "whiteRoseGold" && (
              <>
                <img
                  className="bohra-floral-sticker bohra-floral-sticker-top"
                  src="https://pixabay.com/get/gcd53a5c1f225abb0a3549db52c803c16f59429c1c22a4d5447e7e75f42c476e557bafed25f2ea55762b1cb2c2d456df0_1920.png"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                />
                <img
                  className="bohra-floral-sticker bohra-floral-sticker-bottom"
                  src="https://pixabay.com/get/gcd53a5c1f225abb0a3549db52c803c16f59429c1c22a4d5447e7e75f42c476e557bafed25f2ea55762b1cb2c2d456df0_1920.png"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                />
                <canvas
                  className="bohra-rose-gold-effects"
                  ref={roseGoldEffectsCanvasRef}
                  aria-hidden="true"
                />
              </>
            )}
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

              {hasValue(details.spiritualLeader) &&
                (hasValue(details.hostFamilyOne) || hasValue(details.hostFamilyTwo)) && (
                  <div className="bohra-host-divider" aria-hidden="true">
                    <span>✧</span>
                    <i>❖</i>
                    <span>✧</span>
                  </div>
                )}

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
                  <h1>{primaryNames[0]}</h1>
                  <span className="bohra-weds">Weds</span>
                  <h1>{primaryNames[1]}</h1>
                </div>
                {hasValue(details.firstCoupleBrideFamilyLine || details.brideFamilyLine) && (
                  <p className="bohra-bride-family">{details.firstCoupleBrideFamilyLine || details.brideFamilyLine}</p>
                )}
              </section>

              {invitation.cardType === "double" && (
                <section className="bohra-officiant-panel glass-panel">
                  <p>Nikah Solemnised On The Hand Mubarak Of</p>
                  {hasValue(firstNikah.officiant) && <strong>{firstNikah.officiant}</strong>}
                </section>
              )}

              {invitation.cardType === "double" &&
                (hasValue(invitation.secondCouple?.groomName) ||
                  hasValue(invitation.secondCouple?.brideName)) && (
                  <div className="bohra-double-couple-connector" aria-label="Both couples are joined by and">
                    <span aria-hidden="true">&amp;</span>
                  </div>
                )}

              {invitation.cardType === "double" &&
                (hasValue(invitation.secondCouple?.groomName) ||
                  hasValue(invitation.secondCouple?.brideName)) && (
                  <section className="bohra-couple-panel bohra-second-couple-panel glass-panel">
                    <div className="bohra-couple-names">
                      <h1>{secondNames[0]}</h1>
                      <span className="bohra-weds">Weds</span>
                      <h1>{secondNames[1]}</h1>
                    </div>
                    {hasValue(details.secondCoupleBrideFamilyLine) && (
                      <p className="bohra-bride-family">{details.secondCoupleBrideFamilyLine}</p>
                    )}
                  </section>
                )}

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
                    {details.programmeHeading === "Programe Inshallah" || details.programmeHeading === "Programme Insha Allah" ? "Programme Inshallah" : details.programmeHeading || "Programme Inshallah"}
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
                    <div className="bohra-note-panel bohra-special-request-panel glass-panel">
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
      <InvitationMusicPlayer music={invitation.music} visible={isInvitationInteractive} audioRef={musicAudioRef} startRequestedRef={musicStartRequestedRef} />

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
