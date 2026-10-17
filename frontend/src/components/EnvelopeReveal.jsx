import { useState, useRef, useEffect, useCallback } from "react";
import "./cinematic/CinematicOpening.css";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

function EnvelopeReveal({ invitation, onHandoffStart, onOpened }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const hasTriggeredRef = useRef(false);
  const timersRef = useRef([]);

  const addTimer = useCallback((fn, delayMs) => {
    const id = setTimeout(fn, delayMs);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  const bride =
    invitation?.couple?.partner1?.name ||
    invitation?.couple?.brideName ||
    "Bride";

  const groom =
    invitation?.couple?.partner2?.name ||
    invitation?.couple?.groomName ||
    "Groom";

  const pairInitials = `${(bride?.[0] || "B").toUpperCase()}${(groom?.[0] || "G").toUpperCase()}`;

  const triggerSequence = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setIsOpen(true);

    if (prefersReducedMotion) {
      setIsTransitioning(true);
      setIsComplete(true);
      if (onHandoffStart) onHandoffStart();
      addTimer(() => {
        if (onOpened) onOpened();
      }, 250);
      return;
    }

    addTimer(() => {
      setIsTransitioning(true);
    }, 320);

    addTimer(() => {
      if (onHandoffStart) onHandoffStart();
    }, 1150);

    addTimer(() => {
      setIsComplete(true);
      if (onOpened) onOpened();
    }, 1900);
  }, [addTimer, onHandoffStart, onOpened]);

  return (
    <div
      className={`cinematic-stage-overlay ${isOpen ? "is-open" : ""} ${
        isTransitioning ? "is-transitioning" : ""
      } ${isComplete ? "is-complete" : ""}`}
      aria-label="Wedding invitation cinematic opening"
    >
      <div className="stage-ambient" aria-hidden="true" />
      <div className="stage-lustre" aria-hidden="true" />
      <div className="stage-sheen" aria-hidden="true" />

      <div className="reveal-envelope-shell" aria-hidden="true">
        <div className="envelope-backdrop" />
        <div className="envelope-flap envelope-flap-left" />
        <div className="envelope-flap envelope-flap-right" />
        <div className="envelope-crease" />
        <div className="wax-seal">{pairInitials}</div>

        <div className="reveal-card">
          <div className="reveal-card-inner">
            <span className="reveal-kicker">with love</span>
            <div className="reveal-monogram">{pairInitials}</div>
            <h1>
              {bride}
              <span>&amp;</span>
              {groom}
            </h1>
            <p className="reveal-date">{formatDate(invitation?.weddingDate)}</p>
            <p className="reveal-venue">
              {invitation?.venue?.name || "Join us for a celebration"}
            </p>
          </div>
        </div>
      </div>

      <div className="reveal-prompt" aria-live="polite">
        <span className="prompt-pill">
          {isOpen ? "Opening the invitation…" : "Tap to open"}
        </span>
      </div>

      <button
        type="button"
        className="reveal-interaction-button"
        onClick={triggerSequence}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            triggerSequence();
          }
        }}
        aria-label="Open the wedding invitation"
      />
    </div>
  );
}

export default EnvelopeReveal;
