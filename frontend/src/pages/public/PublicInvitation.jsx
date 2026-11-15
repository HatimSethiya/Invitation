import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import api, { resolveMediaUrl } from "../../services/api";
import EnvelopeReveal from "../../components/EnvelopeReveal";
import InvitationMusicPlayer from "../../components/InvitationMusicPlayer";
import RoyalRoseEffects from "../../components/cinematic/RoyalRoseEffects";

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

function getWeddingCountdownTarget(invitation) {
  const rawWeddingDate = invitation?.weddingDate;
  const dateKey = typeof rawWeddingDate === "string"
    ? rawWeddingDate.slice(0, 10)
    : rawWeddingDate instanceof Date && !Number.isNaN(rawWeddingDate.getTime())
      ? rawWeddingDate.toISOString().slice(0, 10)
      : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

  const [year, month, day] = dateKey.split("-").map(Number);
  let target = new Date(year, month - 1, day, 0, 0, 0, 0);

  // When a ceremony time is entered for the wedding date, count down to that
  // local time; otherwise count down to the beginning of the wedding day.
  const matchingEvent = (invitation.events || []).find((event) => {
    const eventDate = typeof event?.date === "string"
      ? event.date.slice(0, 10)
      : event?.date instanceof Date && !Number.isNaN(event.date.getTime())
        ? event.date.toISOString().slice(0, 10)
        : "";
    return eventDate === dateKey && typeof event?.time === "string" && event.time.trim();
  });

  const timeMatch = matchingEvent?.time.match(
    /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/i
  );

  if (timeMatch) {
    let hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2] || 0);
    const meridiem = timeMatch[3].replace(/\./g, "").toLowerCase();

    if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
      if (meridiem === "p.m" || meridiem === "pm") hours = hours % 12 + 12;
      if (meridiem === "a.m" || meridiem === "am") hours %= 12;
      target = new Date(year, month - 1, day, hours, minutes, 0, 0);
    }
  }

  return target;
}

function RoyalWeddingCountdown({ targetDate, theme }) {
  const targetTime = targetDate?.getTime() || 0;
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, targetTime - Date.now())
  );
  const [isVisible, setIsVisible] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!targetTime) return undefined;
    const updateRemaining = () => setRemaining(Math.max(0, targetTime - Date.now()));
    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(intervalId);
  }, [targetTime]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.12, rootMargin: "0px 0px -35px 0px" }
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (!targetTime) return null;

  return (
    <section
      ref={panelRef}
      className={`bohra-royal-countdown-panel countdown-theme-${theme || "bohraNikah"} ${isVisible ? "countdown-is-visible" : "countdown-is-hidden"}`}
      aria-label="Wedding countdown"
    >
      <div className="countdown-petal-layer" aria-hidden="true">
        <span>✿</span><span>❀</span><span>✿</span><span>❀</span>
      </div>
      <span className="bohra-countdown-overline">
        {remaining > 0 ? "COUNTING DOWN TO OUR SPECIAL DAY" : "ALHAMDULILLAH · THE DAY IS HERE"}
      </span>
      <h2 className="bohra-countdown-title">
        {remaining > 0 ? "A Beautiful Beginning Awaits" : "The Celebration Has Begun"}
      </h2>
      {remaining > 0 ? (
        <div className="bohra-countdown-units" role="timer" aria-live="off">
          {[
            { value: days, label: "DAYS" },
            { value: hours, label: "HOURS" },
            { value: minutes, label: "MINUTES" },
            { value: seconds, label: "SECONDS" },
          ].map((unit) => (
            <div className="bohra-countdown-unit" key={unit.label}>
              <span className="bohra-countdown-value" key={unit.value}>
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="bohra-countdown-label">{unit.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="bohra-countdown-live-message">
          With love, duas and blessings — the wedding day is now unfolding.
        </p>
      )}
      <div className="bohra-countdown-ornament" aria-hidden="true">
        <span>✧</span><i>❖</i><span>✧</span>
      </div>
      <p className="bohra-countdown-footer">Two hearts · One blessed beginning</p>
    </section>
  );
}

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

    const preloadImage = (source) =>
      new Promise((resolve) => {
        if (!source) {
          resolve(false);
          return;
        }
        const image = new Image();
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
        image.src = source;
        if (image.complete) resolve(image.naturalWidth > 0);
      });

    api
      .get(`/invitations/public/${slug}`)
      .then(async (response) => {
        const loadedInvitation = response.data.invitation;
        // Warm the cover and invitation media before mounting the envelope.
        // The guest can tap only after the artwork and the main invitation's
        // image assets have finished loading (failed assets resolve gracefully).
        const imageSources = [
          loadedInvitation?.coverImageUrl && resolveMediaUrl(loadedInvitation.coverImageUrl),
          loadedInvitation?.couple?.couplePhoto,
          ...(loadedInvitation?.story || []).map((item) => item?.image),
          ...(loadedInvitation?.gallery || []).map((item) =>
            item?.imageUrl && resolveMediaUrl(item.imageUrl)
          ),
        ];

        if (loadedInvitation?.theme === "whiteRoseGold") {
          imageSources.push("/white-rose-gold-realistic-floral-frame.png");
        }

        await Promise.all([
          ...imageSources.filter(Boolean).map(preloadImage),
          typeof document !== "undefined" && document.fonts?.ready
            ? document.fonts.ready.catch(() => undefined)
            : Promise.resolve(),
        ]);

        if (active) setInvitation(loadedInvitation);
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
    // This canvas is purely decorative; a slightly reduced backing resolution
    // keeps its full-card redraws inexpensive while retaining a crisp appearance.
    const canvasScale = 0.72;

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
      // Render below CSS pixel resolution to lower the cost of clearing and
      // painting a very tall invitation card on every animation frame.
      canvas.width = Math.max(1, Math.round(width * canvasScale));
      canvas.height = Math.max(1, Math.round(height * canvasScale));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      context.setTransform(canvasScale, 0, 0, canvasScale, 0, 0);

      const particleCount = Math.min(
        72,
        Math.max(42, Math.round((width * height) / 26000))
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
      if (timestamp - lastFrameTime < 40) return;

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

      if (scrollDelta > 2 && now - lastBurstTime > 110) {
        const cardTop = card.getBoundingClientRect().top + window.scrollY;
        const visibleTop = Math.max(
          0,
          Math.min(height, currentScrollY - cardTop + 14)
        );
        const burstCount = Math.min(
          8,
          Math.max(3, Math.round(scrollDelta / 4))
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
    const countdownTarget = getWeddingCountdownTarget(invitation);

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
                <svg
                  className="bohra-floral-sticker bohra-floral-sticker-top"
                  viewBox="0 0 3708 3876"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="roseGoldFloralRedTop" colorInterpolationFilters="sRGB">
                      <feColorMatrix
                        type="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  2 -1 -1 0 0"
                      />
                    </filter>
                    <filter id="roseGoldFloralGreenTop" colorInterpolationFilters="sRGB">
                      <feColorMatrix
                        type="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 2 -1 0 0"
                      />
                    </filter>
                  </defs>
                  <image
                    href="https://w7.pngwing.com/pngs/580/297/png-transparent-wedding-floral-corner-beautiful-floral-arrangement-with-leaves.png"
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                    filter="url(#roseGoldFloralRedTop)"
                  />
                  <image
                    href="https://w7.pngwing.com/pngs/580/297/png-transparent-wedding-floral-corner-beautiful-floral-arrangement-with-leaves.png"
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                    filter="url(#roseGoldFloralGreenTop)"
                  />
                </svg>
                <svg
                  className="bohra-floral-sticker bohra-floral-sticker-bottom"
                  viewBox="0 0 3708 3876"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="roseGoldFloralRedBottom" colorInterpolationFilters="sRGB">
                      <feColorMatrix
                        type="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  2 -1 -1 0 0"
                      />
                    </filter>
                    <filter id="roseGoldFloralGreenBottom" colorInterpolationFilters="sRGB">
                      <feColorMatrix
                        type="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 2 -1 0 0"
                      />
                    </filter>
                  </defs>
                  <image
                    href="https://w7.pngwing.com/pngs/580/297/png-transparent-wedding-floral-corner-beautiful-floral-arrangement-with-leaves.png"
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                    filter="url(#roseGoldFloralRedBottom)"
                  />
                  <image
                    href="https://w7.pngwing.com/pngs/580/297/png-transparent-wedding-floral-corner-beautiful-floral-arrangement-with-leaves.png"
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid meet"
                    filter="url(#roseGoldFloralGreenBottom)"
                  />
                </svg>
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
                <p className="bohra-bismillah bohra-bismillah-calligraphy" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
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
                {invitation.theme === "whiteRoseGold" && (
                  <img
                    className="bohra-realistic-floral-frame"
                    src="/white-rose-gold-realistic-floral-frame.png"
                    alt=""
                    aria-hidden="true"
                    draggable="false"
                  />
                )}
                <img className="bohra-couple-floral-frame" src="/rose-gold-floral-couple-frame.svg" alt="" aria-hidden="true" draggable="false" />
                <div className="bohra-couple-names">
                  {invitation.couple?.nameOrder === "brideFirst" ? (
                    <>
                      <h1>{bride}</h1>
                      {hasValue(details.firstCoupleBrideFamilyLine || details.brideFamilyLine) && (
                        <p className="bohra-bride-family bohra-couple-family-inline">
                          {details.firstCoupleBrideFamilyLine || details.brideFamilyLine}
                        </p>
                      )}
                      <span className="bohra-weds">Weds</span>
                      <h1>{groom}</h1>
                      {hasValue(details.firstCoupleGroomFamilyLine) && (
                        <p className="bohra-groom-family bohra-couple-family-inline">
                          {details.firstCoupleGroomFamilyLine}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <h1>{groom}</h1>
                      {hasValue(details.firstCoupleGroomFamilyLine) && (
                        <p className="bohra-groom-family bohra-couple-family-inline">
                          {details.firstCoupleGroomFamilyLine}
                        </p>
                      )}
                      <span className="bohra-weds">Weds</span>
                      <h1>{bride}</h1>
                      {hasValue(details.firstCoupleBrideFamilyLine || details.brideFamilyLine) && (
                        <p className="bohra-bride-family bohra-couple-family-inline">
                          {details.firstCoupleBrideFamilyLine || details.brideFamilyLine}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </section>

              {invitation.countdownEnabled === true && countdownTarget && (
                <RoyalWeddingCountdown targetDate={countdownTarget} theme={invitation.theme} />
              )}

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
                    {invitation.theme === "whiteRoseGold" && (
                      <img
                        className="bohra-realistic-floral-frame"
                        src="/white-rose-gold-realistic-floral-frame.png"
                        alt=""
                        aria-hidden="true"
                        draggable="false"
                      />
                    )}
                    <img className="bohra-couple-floral-frame" src="/rose-gold-floral-couple-frame.svg" alt="" aria-hidden="true" draggable="false" />
                    <div className="bohra-couple-names">
                      {invitation.secondCouple?.nameOrder === "brideFirst" ? (
                        <>
                          <h1>{secondBride}</h1>
                          {hasValue(details.secondCoupleBrideFamilyLine) && (
                            <p className="bohra-bride-family bohra-couple-family-inline">
                              {details.secondCoupleBrideFamilyLine}
                            </p>
                          )}
                          <span className="bohra-weds">Weds</span>
                          <h1>{secondGroom}</h1>
                          {hasValue(details.secondCoupleGroomFamilyLine) && (
                            <p className="bohra-groom-family bohra-couple-family-inline">
                              {details.secondCoupleGroomFamilyLine}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <h1>{secondGroom}</h1>
                          {hasValue(details.secondCoupleGroomFamilyLine) && (
                            <p className="bohra-groom-family bohra-couple-family-inline">
                              {details.secondCoupleGroomFamilyLine}
                            </p>
                          )}
                          <span className="bohra-weds">Weds</span>
                          <h1>{secondBride}</h1>
                          {hasValue(details.secondCoupleBrideFamilyLine) && (
                            <p className="bohra-bride-family bohra-couple-family-inline">
                              {details.secondCoupleBrideFamilyLine}
                            </p>
                          )}
                        </>
                      )}
                    </div>
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
                        viewport={{ amount: 0.22, margin: "0px 0px -70px 0px" }}
                        transition={{
                          duration: 0.78,
                          delay: Math.min(index * 0.08, 0.24),
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >

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
                        {hasValue(event.description) && (
                          <div className="bohra-detail-row bohra-description-detail-row">
                            <span className="bohra-detail-icon" aria-hidden="true">✧</span>
                            <div><p className="bohra-extra-event-description-inline">{event.description}</p></div>
                          </div>
                        )}
                        {hasValue(event.mapUrl) && <a className="bohra-extra-event-map-link" href={event.mapUrl} target="_blank" rel="noreferrer">Open Maps <span aria-hidden="true">↗</span></a>}
                      </motion.article>
                    ))}
                  </div>
                </section>
              )}

              {(hasValue(invitation.venue?.name) ||
                hasValue(invitation.venue?.address) ||
                hasValue(invitation.venue?.city) ||
                hasValue(invitation.venue?.mapUrl)) && (
                <section className="bohra-additional-events bohra-venue-section">
                  <motion.span
                    className="bohra-section-kicker bohra-programme-heading"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Venue &amp; Directions
                  </motion.span>
                  <motion.article
                    className="bohra-extra-event bohra-main-venue-panel glass-panel"
                    initial={{ opacity: 0, y: 32, scale: 0.985 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ amount: 0.22, margin: "0px 0px -70px 0px" }}
                    transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h3>{invitation.venue?.name || "Wedding Venue"}</h3>
                    <div className="bohra-programme-details bohra-extra-event-details">
                      {hasValue(invitation.venue?.address) && (
                        <div className="bohra-detail-row">
                          <span className="bohra-detail-icon" aria-hidden="true">⌖</span>
                          <div><span>{invitation.venue.address}</span></div>
                        </div>
                      )}
                      {hasValue(invitation.venue?.city) && (
                        <div className="bohra-detail-row">
                          <span className="bohra-detail-icon" aria-hidden="true">⌂</span>
                          <div><strong>{invitation.venue.city}</strong></div>
                        </div>
                      )}
                    </div>
                    {hasValue(invitation.venue?.mapUrl) && (
                      <a
                        className="bohra-extra-event-map-link"
                        href={invitation.venue.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Venue Map <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </motion.article>
                </section>
              )}

              {hasValue(details.complimentsFrom) && (
                <section className="bohra-compliments">
                  <span className="bohra-section-kicker">With The Best Compliments From</span>
                  {(() => {
                    const complimentsText = details.complimentsFrom.trim();
                    const presenceNoteIndex = complimentsText.search(/your presence/i);
                    const familyLine = presenceNoteIndex >= 0
                      ? complimentsText.slice(0, presenceNoteIndex).trim()
                      : complimentsText;
                    const presenceNote = presenceNoteIndex >= 0
                      ? complimentsText.slice(presenceNoteIndex).trim()
                      : "";

                    return (
                      <>
                        <p className="bohra-compliments-family">{familyLine}</p>
                        {presenceNote && (
                          <p className="bohra-compliments-note">{presenceNote}</p>
                        )}
                      </>
                    );
                  })()}
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
        className={`invitation-body ${
          invitation.theme === "royalRose" ? "royal-rose-card" : ""
        }`}
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
        {invitation.theme === "royalRose" && isInvitationInteractive && (
          <RoyalRoseEffects />
        )}
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
                    src={resolveMediaUrl(image.imageUrl)}
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
