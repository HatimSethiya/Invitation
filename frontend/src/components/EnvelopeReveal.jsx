import { useState, useRef, useEffect, useCallback } from "react";
import VelvetCurtains from "./cinematic/VelvetCurtains";
import "./cinematic/CinematicOpening.css";

/**
 * EnvelopeReveal automatically opens the invitation:
 * 1. Velvet curtains begin to part as soon as the public invitation is ready.
 * 2. The real invitation page fades in behind the curtains.
 * 3. The staging overlay fades away without an extra Tap to Open card.
 */
function EnvelopeReveal({ onOpenMusic, onHandoffStart, onOpened }) {
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

  // Clear pending timers on unmount, including the React StrictMode dev cycle.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
      hasTriggeredRef.current = false;
    };
  }, []);

  // Main automatic cinematic sequence.
  const triggerSequence = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    // Best-effort music start. Browser autoplay policies may require using the
    // visible music control after the invitation has appeared.
    if (onOpenMusic) onOpenMusic();

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setIsCurtainsOpening(true);
      setIsHandoffActive(true);
      setIsDissolvingOut(true);
      if (onHandoffStart) onHandoffStart();
      addTimer(() => {
        if (onOpened) onOpened();
      }, 500);
      return;
    }

    // Start the curtain reveal immediately; no stationery card or extra tap.
    setIsCurtainsOpening(true);

    // Reveal the invitation content while the curtains finish travelling.
    addTimer(() => {
      setIsHandoffActive(true);
      if (onHandoffStart) onHandoffStart();
    }, 1900);

    // Fade the staging overlay after the curtain transition is nearly complete.
    addTimer(() => {
      setIsDissolvingOut(true);
    }, 4200);

    // Unmount the overlay only after its fade has finished.
    addTimer(() => {
      if (onOpened) onOpened();
    }, 5500);
  }, [addTimer, onHandoffStart, onOpenMusic, onOpened]);

  // Defer the trigger by one task so StrictMode's setup/cleanup cycle can cancel
  // its first scheduled start safely in development.
  useEffect(() => {
    const startTimer = setTimeout(triggerSequence, 0);
    return () => clearTimeout(startTimer);
  }, [triggerSequence]);

  return (
    <div
      className={`cinematic-stage-overlay ${
        isHandoffActive ? "stage-handoff-active" : ""
      } ${isDissolvingOut ? "stage-dissolving-out" : ""}`}
      aria-label="Wedding invitation cinematic opening"
    >
      <VelvetCurtains isOpening={isCurtainsOpening} />
    </div>
  );
}

export default EnvelopeReveal;
