import { useState, useRef, useEffect, useCallback } from "react";
import VelvetCurtains from "./cinematic/VelvetCurtains";
import CardStationery from "./cinematic/CardStationery";
import "./cinematic/CinematicOpening.css";

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

  const hasTriggeredRef = useRef(false);
  const timersRef = useRef([]);

  const addTimer = useCallback((fn, delayMs) => {
    const id = setTimeout(fn, delayMs);
    timersRef.current.push(id);
    return id;
  }, []);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  // Main Orchestrated Cinematic Sequence
  const triggerSequence = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    // Start the selected music directly from the guest's Tap to Open gesture.
    if (onOpenMusic) onOpenMusic();

    // Check for user-preferred reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
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

    // Keep the stationery in place while the curtains begin to part.
    setIsAnticipating(true);
    setIsCurtainsOpening(true);

    // Envelope reveal is shorter; the existing curtain timing is preserved.
    const handoffDelay = isEnvelopeOpening ? 1250 : 1900;
    const dissolveDelay = isEnvelopeOpening ? 1650 : 2100;
    const stageExitDelay = isEnvelopeOpening ? 2850 : 4200;
    const completionDelay = isEnvelopeOpening ? 3800 : 5500;

    addTimer(() => {
      setIsHandoffActive(true);
      if (onHandoffStart) onHandoffStart();
    }, handoffDelay);
    addTimer(() => setIsDissolving(true), dissolveDelay);
    addTimer(() => setIsDissolvingOut(true), stageExitDelay);
    addTimer(() => { if (onOpened) onOpened(); }, completionDelay);
  }, [addTimer, isEnvelopeOpening, onHandoffStart, onOpenMusic, onOpened]);

  const bride = invitation?.couple?.brideName || "Bride";
  const groom = invitation?.couple?.groomName || "Groom";
  const primaryNames = invitation?.couple?.nameOrder === "brideFirst" ? [bride, groom] : [groom, bride];
  const monogram = (primaryNames[0][0] || "G").toUpperCase() + "&" + (primaryNames[1][0] || "B").toUpperCase();

  return (
    <div
      className={"cinematic-stage-overlay " + (isHandoffActive ? "stage-handoff-active " : "") + (isDissolvingOut ? "stage-dissolving-out " : "") + (isEnvelopeOpening ? "cinematic-envelope-opening" : "")}
      aria-label="Wedding invitation cinematic opening"
    >
      {isEnvelopeOpening ? (
        <div className={"luxury-envelope-stage envelope-theme-" + (invitation?.theme || "bohraNikah") + (isCurtainsOpening ? " envelope-is-opening" : "") + (isDissolving ? " envelope-insert-dissolving" : "")}>
          <div className="luxury-envelope-wrap">
            <div className="luxury-envelope" aria-label={"Wedding invitation envelope for " + primaryNames[0] + " and " + primaryNames[1]}>
              <div className="luxury-envelope-back" />
              <div className="luxury-envelope-insert">
                <span className="envelope-insert-ornament" aria-hidden="true">✦</span>
                <span className="envelope-insert-monogram">{monogram}</span>
                <span className="envelope-insert-couple"><span>{primaryNames[0]}</span><em>Weds</em><span>{primaryNames[1]}</span></span>
                {invitation?.cardType === "double" && invitation?.secondCouple && <span className="envelope-insert-second-couple">{[invitation.secondCouple.groomName, invitation.secondCouple.brideName].filter(Boolean).join(" · ")}</span>}
                <span className="envelope-insert-date">{invitation?.weddingDate ? new Date(invitation.weddingDate).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "Wedding Invitation"}</span>
              </div>
              <div className="luxury-envelope-pocket" />
              <div className="luxury-envelope-flap" />
              <button className="luxury-envelope-seal" type="button" onClick={triggerSequence} disabled={hasTriggeredRef.current} aria-label="Tap the wax seal to open the wedding invitation">
                <span className="envelope-seal-monogram">{monogram}</span><span className="envelope-seal-ornament" aria-hidden="true">❦</span>
              </button>
            </div>
            <p className="envelope-open-prompt"><span aria-hidden="true">✦</span> Tap the seal to unveil your invitation <span aria-hidden="true">✦</span></p>
          </div>
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
