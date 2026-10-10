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
function EnvelopeReveal({ invitation, onOpened }) {
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
      setIsDissolving(true);
      setIsCurtainsOpening(true);
      setIsDissolvingOut(true);
      addTimer(() => {
        if (onOpened) onOpened();
      }, 500);
      return;
    }

    // Step 1 (0.0s relative / 0.6s mark): Anticipation & delicate light sweep across card
    setIsAnticipating(true);

    // Step 2 (0.35s relative / 0.95s mark): Progressive structural dissolution & canvas wedding dust
    addTimer(() => {
      setIsDissolving(true);
    }, 350);

    // Step 3 (0.55s relative / 1.15s mark): Heavy velvet curtains pull sideways with fold compression
    addTimer(() => {
      setIsCurtainsOpening(true);
    }, 550);

    // Step 4 (1.75s relative / 2.35s mark): Warm golden stage aura expands in the center
    addTimer(() => {
      setIsRevealingLight(true);
    }, 1750);

    // Step 5 (2.50s relative / 3.10s mark): Theatrical stage overlay dissolves into public page
    addTimer(() => {
      setIsDissolvingOut(true);
    }, 2500);

    // Step 6 (3.30s relative / 3.90s mark): Clean handoff to public invitation hero content
    addTimer(() => {
      if (onOpened) onOpened();
    }, 3300);
  }, [addTimer, onOpened]);

  // Gentle auto-trigger after 3.5s of breathing stage if user hasn't tapped yet
  useEffect(() => {
    const autoTimer = setTimeout(() => {
      if (!hasTriggeredRef.current) {
        triggerSequence();
      }
    }, 3500);

    return () => clearTimeout(autoTimer);
  }, [triggerSequence]);

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
