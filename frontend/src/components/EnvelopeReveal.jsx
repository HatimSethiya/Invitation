import { useState, useRef, useEffect, useCallback } from "react";
import VelvetCurtains from "./cinematic/VelvetCurtains";
import CardStationery from "./cinematic/CardStationery";
import { resolveMediaUrl } from "../services/api";
import "./cinematic/CinematicOpening.css";
import "./cinematic/RoyalEnvelopeFinish.css";

/**
 * EnvelopeReveal coordinates a clean invitation opening:
 * 1. The stationery responds gently to the guest's tap.
 * 2. Velvet curtains part.
 * 3. The stationery fades and scales away without glow or particles.
 * 4. The real invitation page fades and scales into view.
 */
function EnvelopeReveal({ invitation, onOpenMusic, onHandoffStart, onOpened }) {
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
                <span className="envelope-seal-monogram">{monogram}</span><span className="envelope-seal-ornament" aria-hidden="true">❦</span>
              </button>
            </div>
            <button className="envelope-open-prompt" type="button" onClick={triggerSequence} disabled={hasTriggeredRef.current || !isCoverReady} aria-label="Tap to open the wedding invitation"><span aria-hidden="true">✦</span> {isCoverReady ? "Tap to open invitation" : "Preparing invitation…"} <span aria-hidden="true">✦</span></button>
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

export default EnvelopeReveal;
