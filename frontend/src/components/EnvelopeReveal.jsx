import { useState, useRef, useEffect, useCallback } from "react";
import VelvetCurtains from "./cinematic/VelvetCurtains";
import CardStationery from "./cinematic/CardStationery";
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
      setIsCurtainsOpening(true);
      setIsDissolving(true);
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

    // Once the curtains are nearly open, fade the card away with a plain scale
    // transition instead of gold embers, particles, or a light bloom.
    addTimer(() => {
      setIsDissolving(true);
    }, 1750);

    // Reveal the real invitation after the stationery has faded away.
    addTimer(() => {
      if (onHandoffStart) onHandoffStart();
    }, 2280);

    // Crossfade the empty stage away while the invitation settles into place.
    addTimer(() => {
      setIsDissolvingOut(true);
    }, 2580);

    // Keep the overlay mounted until the page transition has finished.
    addTimer(() => {
      if (onOpened) onOpened();
    }, 3550);
  }, [addTimer, onHandoffStart, onOpened]);

  return (
    <div
      className={`cinematic-stage-overlay ${
        isDissolvingOut ? "stage-dissolving-out" : ""
      }`}
      aria-label="Wedding invitation cinematic opening"
    >
      {/* Layer 1: Realistic Heavy Velvet Theatre Curtains */}
      <VelvetCurtains isOpening={isCurtainsOpening} />

      {/* Invitation stationery fades away cleanly after the curtains open. */}
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
