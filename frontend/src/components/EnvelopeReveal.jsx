import { useState, useRef, useEffect, useCallback } from "react";
import VelvetCurtains from "./cinematic/VelvetCurtains";
import CardStationery from "./cinematic/CardStationery";
import { resolveMediaUrl } from "../services/api";
import "./cinematic/CinematicOpening.css";
import "./cinematic/RoyalEnvelopeFinish.css";
import "./cinematic/RoseGoldEnvelope.css";
import "./PremiumReferenceOpening.css";
import DoorOpening from "./DoorOpening";

/**
 * EnvelopeReveal coordinates a clean invitation opening:
 * 1. The stationery responds gently to the guest's tap.
 * 2. Velvet curtains part.
 * 3. The stationery fades and scales away without glow or particles.
 * 4. The real invitation page fades and scales into view.
 */
function LegacyEnvelopeReveal({ invitation, onOpenMusic, onHandoffStart, onOpened }) {
  const isEnvelopeOpening = invitation?.openingAnimation === "envelope";
  const [isAnticipating, setIsAnticipating] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);
  const [isCurtainsOpening, setIsCurtainsOpening] = useState(false);
  const [isHandoffActive, setIsHandoffActive] = useState(false);
  const [isDissolvingOut, setIsDissolvingOut] = useState(false);
  const [isCardEmerging, setIsCardEmerging] = useState(false);
  const [isCardPresented, setIsCardPresented] = useState(false);
  const [isCoverReady, setIsCoverReady] = useState(!invitation?.coverImageUrl);

  const hasTriggeredRef = useRef(false);
  const hasCardPresentedRef = useRef(false);
  const hasCardFadeStartedRef = useRef(false);
  const timersRef = useRef([]);

  const addTimer = useCallback((fn, delayMs) => {
    const id = setTimeout(fn, delayMs);
    timersRef.current.push(id);
    return id;
  }, []);

  // Decode uploaded cover art before enabling the opening gesture, so it never pops in mid-animation.
  useEffect(() => {
    const coverUrl = invitation?.coverImageUrl ? resolveMediaUrl(invitation.coverImageUrl) : null;
    if (!coverUrl) { setIsCoverReady(true); return; }
    setIsCoverReady(false);
    const image = new Image();
    image.onload = () => setIsCoverReady(true);
    image.onerror = () => setIsCoverReady(true);
    image.src = coverUrl;
    if (typeof image.decode === "function") image.decode().then(() => setIsCoverReady(true)).catch(() => {});
    return () => { image.onload = null; image.onerror = null; };
  }, [invitation?.coverImageUrl]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  // Main Orchestrated Cinematic Sequence
  const triggerSequence = useCallback(() => {
    if (hasTriggeredRef.current || (isEnvelopeOpening && invitation?.coverImageUrl && !isCoverReady)) return;
    hasTriggeredRef.current = true;

    // Start the selected music directly from the guest's Tap to Open gesture.
    if (onOpenMusic) onOpenMusic();

    // Check for user-preferred reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion && !isEnvelopeOpening) {
      setIsCurtainsOpening(true);
      setIsDissolving(true);
      setIsHandoffActive(true);
      setIsDissolvingOut(true);
      if (onHandoffStart) onHandoffStart();
      addTimer(() => {
        if (onOpened) onOpened();
      }, 500);
      return;
    }

    setIsAnticipating(true);
    setIsCurtainsOpening(true);

    if (isEnvelopeOpening) {
      // Start a CSS transition that progressively unmasks and lifts the separate,
      // already-mounted cover image from the envelope pocket.
      addTimer(() => {
        setIsCardEmerging(true);
        // Fallback only: the normal phase change is driven by clip-path transitionend.
        // This prevents a stalled browser event from leaving the guest stuck.
        addTimer(() => {
          if (hasCardPresentedRef.current) return;
          hasCardPresentedRef.current = true;
          setIsCardPresented(true);
          addTimer(beginEnvelopeFade, 1250);
        }, 2700);
      }, 350);
      return;
    }

    // Preserve the existing handoff sequence for non-envelope opening styles.
    addTimer(() => {
      setIsHandoffActive(true);
      if (onHandoffStart) onHandoffStart();
    }, 1900);
    addTimer(() => setIsDissolving(true), 2100);
    addTimer(() => setIsDissolvingOut(true), 4200);
    addTimer(() => { if (onOpened) onOpened(); }, 5500);
  }, [addTimer, isEnvelopeOpening, invitation?.coverImageUrl, isCoverReady, onHandoffStart, onOpenMusic, onOpened]);

  const beginEnvelopeFade = useCallback(() => {
    if (hasCardFadeStartedRef.current) return;
    hasCardFadeStartedRef.current = true;
    setIsDissolving(true);
    setIsDissolvingOut(true);
    setIsHandoffActive(true);
    if (onHandoffStart) onHandoffStart();
    addTimer(() => { if (onOpened) onOpened(); }, 950);
  }, [addTimer, onHandoffStart, onOpened]);

  const handleCardExtractionTransitionEnd = useCallback((event) => {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "clip-path" ||
      !isCardEmerging ||
      hasCardPresentedRef.current
    ) return;

    hasCardPresentedRef.current = true;
    setIsCardPresented(true);
    // Let the card settle in the foreground, then fade envelope + card together.
    addTimer(beginEnvelopeFade, 1250);
  }, [addTimer, beginEnvelopeFade, isCardEmerging]);

  const handleEnvelopeSurfaceTap = useCallback((event) => {
    if (event.target.closest("button")) return;
    triggerSequence();
  }, [triggerSequence]);

  const bride = invitation?.couple?.brideName || "Bride";
  const groom = invitation?.couple?.groomName || "Groom";
  const primaryNames = invitation?.couple?.nameOrder === "brideFirst" ? [bride, groom] : [groom, bride];
  const monogram = (primaryNames[0][0] || "G").toUpperCase() + "&" + (primaryNames[1][0] || "B").toUpperCase();

  return (
    <div
      className={"cinematic-stage-overlay " + (isHandoffActive ? "stage-handoff-active " : "") + (isDissolvingOut ? "stage-dissolving-out " : "") + (isEnvelopeOpening ? "cinematic-envelope-opening" : "") + (isCardEmerging ? " envelope-card-emerging" : "") + (isCardPresented ? " envelope-card-presented" : "")}
      aria-label="Wedding invitation cinematic opening"
    >
      {isEnvelopeOpening ? (
        <div className={"luxury-envelope-stage envelope-theme-" + (invitation?.theme || "bohraNikah") + (isCurtainsOpening ? " envelope-is-opening" : "") + (isDissolving ? " envelope-insert-dissolving" : "")}>
          <div className="luxury-envelope-wrap" onClick={handleEnvelopeSurfaceTap}>
            <div className="luxury-envelope" aria-label={"Wedding invitation envelope for " + primaryNames[0] + " and " + primaryNames[1]}>
              <div className="luxury-envelope-back" />
              <div className={"luxury-envelope-insert" + (invitation?.coverImageUrl ? " has-uploaded-cover-art" : "")}>
                {invitation?.coverImageUrl ? (
                  <img
                    className="envelope-insert-cover-art"
                    src={resolveMediaUrl(invitation.coverImageUrl)}
                    alt={"Uploaded invitation cover for " + primaryNames[0] + " and " + primaryNames[1]}
                    draggable="false"
                  />
                ) : (
                  <>
                    <span className="envelope-insert-ornament" aria-hidden="true">✦</span>
                    <span className="envelope-insert-monogram">{monogram}</span>
                    <span className="envelope-insert-couple"><span>{primaryNames[0]}</span><em>Weds</em><span>{primaryNames[1]}</span></span>
                    {invitation?.cardType === "double" && invitation?.secondCouple && <span className="envelope-insert-second-couple">{[invitation.secondCouple.groomName, invitation.secondCouple.brideName].filter(Boolean).join(" · ")}</span>}
                    <span className="envelope-insert-date">{invitation?.weddingDate ? new Date(invitation.weddingDate).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "Wedding Invitation"}</span>
                  </>
                )}
              </div>
              <div className="luxury-envelope-pocket" />
              <div className="luxury-envelope-flap" />
              <button className="luxury-envelope-seal" type="button" onClick={triggerSequence} disabled={hasTriggeredRef.current || !isCoverReady} aria-label="Tap the wax seal to open the wedding invitation">
                <span className="envelope-seal-monogram">T❤️Z</span>
              </button>
            </div>
            <button className="envelope-open-prompt" type="button" onClick={triggerSequence} disabled={hasTriggeredRef.current || !isCoverReady} aria-label="Tap to open the wedding invitation">Tap to open</button>
          </div>
          {invitation?.coverImageUrl && (
            <img
              className="envelope-extracted-cover-card"
              onTransitionEnd={handleCardExtractionTransitionEnd}
              src={resolveMediaUrl(invitation.coverImageUrl)}
              alt="Wedding invitation cover card"
              draggable="false"
              aria-hidden="true"
            />
          )}
        </div>
      ) : (
        <>
          {/* Curtain opening remains unchanged for cards that select it or predate this option. */}
          <VelvetCurtains isOpening={isCurtainsOpening} theme={invitation?.theme} />
          <CardStationery invitation={invitation} isAnticipating={isAnticipating} isDissolving={isDissolving} onCardTap={triggerSequence} />
        </>
      )}
    </div>
  );
}



/**
 * Premium reference opening sequence:
 * wax-seal burst -> envelope flap -> invitation insert extraction ->
 * envelope fade -> champagne curtains reveal the existing invitation.
 * The standalone reference's sample invitation and countdown are intentionally
 * not rendered; this overlay hands off to the invitation already on this page.
 */
function PremiumReferenceReveal({ invitation, onOpenMusic, onHandoffStart, onOpened }) {
  const [isStarted, setIsStarted] = useState(false);
  const [isFlapOpen, setIsFlapOpen] = useState(false);
  const [isCardExtracted, setIsCardExtracted] = useState(false);
  const [isIntroHidden, setIsIntroHidden] = useState(false);
  const [isCurtainsOpening, setIsCurtainsOpening] = useState(false);
  const [isFast, setIsFast] = useState(false);
  const timersRef = useRef([]);
  const startedRef = useRef(false);
  const handedOffRef = useRef(false);
  const openedRef = useRef(false);

  const schedule = useCallback((callback, delay) => {
    const timerId = window.setTimeout(callback, delay);
    timersRef.current.push(timerId);
    return timerId;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const handoff = useCallback(() => {
    if (handedOffRef.current) return;
    handedOffRef.current = true;
    onHandoffStart?.();
  }, [onHandoffStart]);

  const finish = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    onOpened?.();
  }, [onOpened]);

  const burstSeal = useCallback(() => {
    const seal = document.querySelector(".premium-opening-seal");
    if (!seal) return;

    const rect = seal.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const flash = document.createElement("i");
    flash.className = "premium-opening-flash";
    flash.style.cssText = "left:" + x + "px;top:" + y + "px";
    document.body.appendChild(flash);
    flash.animate(
      [{ transform: "scale(.2)", opacity: 1 }, { transform: "scale(2.6)", opacity: 0 }],
      { duration: 800, easing: "ease-out" }
    ).onfinish = () => flash.remove();

    for (let index = 0; index < 90; index += 1) {
      const dust = document.createElement("i");
      dust.className = "premium-opening-dust";
      const size = 2 + Math.random() * 4;
      dust.style.cssText =
        "left:" + x + "px;top:" + y + "px;width:" + size + "px;height:" + size + "px";
      document.body.appendChild(dust);

      const angle = Math.random() * 6.283;
      const distance = 40 + Math.random() * 130;
      dust.animate(
        [
          { transform: "translate(0,0)", opacity: 1 },
          {
            transform:
              "translate(" + Math.cos(angle) * distance + "px," +
              (Math.sin(angle) * distance + 30) + "px)",
            opacity: 0,
          },
        ],
        { duration: 900 + Math.random() * 900, easing: "cubic-bezier(.1,.7,.3,1)" }
      ).onfinish = () => dust.remove();
    }
  }, []);

  const beginCurtainReveal = useCallback(() => {
    setIsIntroHidden(true);
    setIsCurtainsOpening(true);
    // Smoothness: curtains are compositor-driven, so start them first and run the
    // heavy React/page hand-off a beat later instead of in the same frame.
    schedule(handoff, 300);
    schedule(finish, 2850);
  }, [finish, handoff, schedule]);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setIsStarted(true);
    onOpenMusic?.();
    burstSeal();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsFast(true);
      setIsFlapOpen(true);
      setIsCardExtracted(true);
      setIsIntroHidden(true);
      setIsCurtainsOpening(true);
      handoff();
      schedule(finish, 250);
      return;
    }

    schedule(() => setIsFlapOpen(true), 600);
    schedule(() => setIsCardExtracted(true), 1600);
    schedule(() => setIsIntroHidden(true), 3400);
    schedule(beginCurtainReveal, 3700);
  }, [beginCurtainReveal, burstSeal, finish, handoff, onOpenMusic, schedule]);

  const skip = useCallback(() => {
    if (!startedRef.current || openedRef.current) return;
    clearTimers();
    setIsFast(true);
    setIsFlapOpen(true);
    setIsCardExtracted(true);
    setIsIntroHidden(true);
    setIsCurtainsOpening(true);
    handoff();
    schedule(finish, 250);
  }, [clearTimers, finish, handoff, schedule]);

  const bride = invitation?.couple?.partner1?.name || invitation?.couple?.brideName || "Bride";
  const groom = invitation?.couple?.partner2?.name || invitation?.couple?.groomName || "Groom";
  const primaryNames = invitation?.couple?.nameOrder === "brideFirst" ? [bride, groom] : [groom, bride];
  const monogram =
    (primaryNames[0].charAt(0) || "G").toUpperCase() +
    "&" +
    (primaryNames[1].charAt(0) || "B").toUpperCase();
  const coverImage = invitation?.coverImageUrl
    ? resolveMediaUrl(invitation.coverImageUrl)
    : null;
  const stageClass =
    "premium-opening-stage" +
    (isStarted ? " premium-opening-started" : "") +
    (isFlapOpen ? " premium-opening-flap-open" : "") +
    (isCardExtracted ? " premium-opening-card-extracted" : "") +
    (isIntroHidden ? " premium-opening-intro-hidden" : "") +
    (isCurtainsOpening ? " premium-opening-fx" : "") +
    (isFast ? " premium-opening-fast" : "");

  return (
    <div className={stageClass} aria-label="Wedding invitation opening">
      <div className="premium-opening-curtain premium-opening-curtain-left" />
      <div className="premium-opening-curtain premium-opening-curtain-right" />
      <div className="premium-opening-top-panel" />

      <div className="premium-opening-intro">
        <div className="premium-opening-envelope-wrap">
          <div
            className="premium-opening-envelope"
            aria-label={"Wedding invitation envelope for " + primaryNames[0] + " and " + primaryNames[1]}
          >
            <div className="premium-opening-envelope-back" />
            <div className="premium-opening-flap-wrap">
              <div className="premium-opening-flap" />
            </div>
            <div className="premium-opening-insert">
              {coverImage ? (
                <img
                  className="premium-opening-cover-art"
                  src={coverImage}
                  alt="Invitation cover"
                  draggable="false"
                />
              ) : (
                <>
                  <span className="premium-opening-insert-ornament" aria-hidden="true">✦</span>
                  <span className="premium-opening-insert-monogram">{monogram}</span>
                  <span className="premium-opening-insert-couple">
                    <span>{primaryNames[0]}</span>
                    <em>Weds</em>
                    <span>{primaryNames[1]}</span>
                  </span>
                  <span className="premium-opening-insert-date">
                    {invitation?.weddingDate
                      ? new Date(invitation.weddingDate).toLocaleDateString(undefined, {
                          month: "long",
                          year: "numeric",
                        })
                      : "Wedding Invitation"}
                  </span>
                </>
              )}
            </div>
            <div className="premium-opening-envelope-pocket" />
            <div className="premium-opening-envelope-front">
              <i className="premium-opening-front-left" />
              <i className="premium-opening-front-right" />
              <i className="premium-opening-front-bottom" />
            </div>
            <button
              className="premium-opening-seal"
              type="button"
              onClick={start}
              disabled={startedRef.current}
              aria-label="Tap the wax seal to open the wedding invitation"
            >
              <b className="premium-opening-seal-half-one">{monogram}</b>
              <b className="premium-opening-seal-half-two">{monogram}</b>
            </button>
          </div>
          <p className={"premium-opening-hint" + (isStarted ? " premium-opening-hint-hidden" : "")}>
            Tap the seal to open
          </p>
        </div>
      </div>


    </div>
  );
}

function EnvelopeReveal(props) {
  if (props.invitation?.openingAnimation === "door") {
    return <DoorOpening {...props} />;
  }

  if (props.invitation?.openingAnimation === "envelope") {
    return <PremiumReferenceReveal {...props} />;
  }

  return <LegacyEnvelopeReveal {...props} />;
}

export default EnvelopeReveal;
