import { useState, useRef, useEffect, useCallback } from "react";
import VelvetCurtains from "./cinematic/VelvetCurtains";
import CardStationery from "./cinematic/CardStationery";
import DustCanvas from "./cinematic/DustCanvas";
import "./cinematic/CinematicOpening.css";

/**
 * EnvelopeReveal: Ultra-luxury, cinematic wedding invitation reveal coordinator.
 * Orchestrates a 4-second continuous physical sequence:
 * 1. Dark, breathing theatrical stage with heavy velvet curtains & ivory stationery card.
 * 2. Delicate tactile anticipation & diagonal light sweep on tap.
 * 3. Progressive structural card dissolution into 60 FPS luminous wedding dust particles.
 * 4. Realistic velvet curtain bunching with curved wavy inner drape profiles.
 * 5. Warm golden ambient stage glow flooding the center.
 * 6. Smooth, elegant handoff to the public invitation hero content.
 */
function EnvelopeReveal({ invitation, onHandoffStart, onOpened }) {
  const [isAnticipating, setIsAnticipating] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);
  const [isCurtainsOpening, setIsCurtainsOpening] = useState(false);
  const [isRevealingLight, setIsRevealingLight] = useState(false);
  const [isDissolvingOut, setIsDissolvingOut] = useState(false);

  const cardRef = useRef(null);
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

    // Check for user-preferred reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      if (onHandoffStart) onHandoffStart();
      setIsDissolving(true);
      setIsCurtainsOpening(true);
      setIsDissolvingOut(true);
      addTimer(() => {
        if (onOpened) onOpened();
      }, 500);
      return;
    }

    // Step 1: Hold a deliberate anticipation beat before the card reacts.
    setIsAnticipating(true);

    // Step 2: Let the light sweep finish before the stationery begins dissolving.
    addTimer(() => {
      setIsDissolving(true);
    }, 650);

    // Step 3: Start the curtain reveal after the card has visibly begun to dissolve.
    addTimer(() => {
      setIsCurtainsOpening(true);
    }, 850);

    // Step 4: Build the warm center light while the curtains continue their full travel.
    addTimer(() => {
      setIsRevealingLight(true);
    }, 1900);

    // Begin revealing the real invitation underneath the final curtain movement.
    // This overlapping crossfade prevents a black/empty frame between scenes.
    addTimer(() => {
      if (onHandoffStart) onHandoffStart();
    }, 2850);

    // Fade the cinematic stage only after the invitation body has started appearing.
    addTimer(() => {
      setIsDissolvingOut(true);
    }, 3250);

    // Remove the overlay after its fade, leaving the already-visible invitation.
    addTimer(() => {
      if (onOpened) onOpened();
    }, 4100);
  }, [addTimer, onHandoffStart, onOpened]);

  return (
    <div
      className={`cinematic-stage-overlay ${
        isDissolvingOut ? "stage-dissolving-out" : ""
      } ${isRevealingLight ? "stage-revealing-light" : ""}`}
      aria-label="Wedding invitation cinematic opening"
    >
      {/* Warm Ambient Theatrical Lighting */}
      <div className="stage-theatrical-glow" aria-hidden="true" />
      <div className="stage-vignette-frame" aria-hidden="true" />

      {/* Layer 1: Realistic Heavy Velvet Theatre Curtains */}
      <VelvetCurtains isOpening={isCurtainsOpening} />

      {/* Layer 2: 60 FPS HTML5 Canvas Luminous Wedding Dust Engine */}
      <DustCanvas isDissolving={isDissolving} cardBoundsRef={cardRef} />

      {/* Layer 3: Physical Ivory Cotton Rag Stationery with Progressive Structural Dissolution */}
      <CardStationery
        invitation={invitation}
        isAnticipating={isAnticipating}
        isDissolving={isDissolving}
        onCardTap={triggerSequence}
        cardRef={cardRef}
      />
    </div>
  );
}

export default EnvelopeReveal;
