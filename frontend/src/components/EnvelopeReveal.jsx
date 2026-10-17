import { useState, useRef, useEffect, useCallback } from "react";
import "./cinematic/RoyalGateOpening.css";

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

const particles = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  x: `${(index * 37 + 11) % 100}%`,
  y: `${(index * 53 + 7) % 100}%`,
  size: `${2 + (index % 3)}px`,
  duration: `${4 + (index % 7)}s`,
  delay: `${-(index % 9)}s`,
}));

function RibbonBow({ initials }) {
  return (
    <svg className="royal-opening__ribbon" viewBox="0 0 220 220" role="img" aria-label={`Silk ribbon seal ${initials}`}>
      <defs>
        <linearGradient id="silkRibbon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0cf" />
          <stop offset=".18" stopColor="#c69a58" />
          <stop offset=".34" stopColor="#f8dfaa" />
          <stop offset=".58" stopColor="#a87338" />
          <stop offset=".78" stopColor="#e8c17d" />
          <stop offset="1" stopColor="#80502c" />
        </linearGradient>
        <linearGradient id="silkHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff9e8" stopOpacity=".85" />
          <stop offset=".45" stopColor="#fff0c8" stopOpacity=".08" />
          <stop offset="1" stopColor="#5f351d" stopOpacity=".5" />
        </linearGradient>
      </defs>
      <path d="M101 113 C78 137 54 166 42 201 L76 190 L93 213 C105 178 111 143 113 117Z" fill="url(#silkRibbon)" stroke="#f5dba4" strokeWidth="1.3" />
      <path d="M120 112 C145 137 170 164 183 198 L148 190 L132 213 C119 178 113 145 109 117Z" fill="url(#silkRibbon)" stroke="#f5dba4" strokeWidth="1.3" />
      <path d="M104 99 C67 53 28 63 35 96 C40 119 72 127 105 112 C75 144 43 134 45 111 C48 90 79 86 104 99Z" fill="url(#silkRibbon)" stroke="#f6dfad" strokeWidth="1.5" />
      <path d="M116 99 C153 53 192 63 185 96 C180 119 148 127 115 112 C145 144 177 134 175 111 C172 90 141 86 116 99Z" fill="url(#silkRibbon)" stroke="#f6dfad" strokeWidth="1.5" />
      <path d="M45 78 C64 74 81 89 100 103 M175 78 C156 74 139 89 120 103 M58 96 C71 112 85 115 99 111 M162 96 C149 112 135 115 121 111" fill="none" stroke="url(#silkHighlight)" strokeWidth="3" strokeLinecap="round" />
      <path d="M101 93 C107 86 116 87 121 94 L126 109 L115 124 L99 119 L94 106Z" fill="url(#silkRibbon)" stroke="#f9e5b7" strokeWidth="1.5" />
      <path d="M102 96 L119 117 M97 107 L114 123" fill="none" stroke="#80502c" strokeOpacity=".45" strokeWidth="1.2" />
      <circle cx="110" cy="107" r="12" fill="url(#silkRibbon)" stroke="#ffedc8" strokeWidth="1.2" />
      <text x="110" y="110" textAnchor="middle" fontFamily="Georgia,serif" fontSize="7" letterSpacing="1" fill="#59331f">{initials}</text>
    </svg>
  );
}

function EnvelopeReveal({ invitation, onHandoffStart, onOpened }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const hasTriggeredRef = useRef(false);
  const timersRef = useRef([]);

  const addTimer = useCallback((fn, delayMs) => {
    const id = setTimeout(fn, delayMs);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => () => {
    timersRef.current.forEach((id) => clearTimeout(id));
  }, []);

  const bride = invitation?.couple?.partner1?.name || invitation?.couple?.brideName || "Bride";
  const groom = invitation?.couple?.partner2?.name || invitation?.couple?.groomName || "Groom";
  const initials = `${(bride?.[0] || "B").toUpperCase()}${(groom?.[0] || "G").toUpperCase()}`;

  const triggerSequence = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setIsOpen(true);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      if (onHandoffStart) onHandoffStart();
      setIsComplete(true);
      addTimer(() => onOpened?.(), 50);
      return;
    }

    addTimer(() => onHandoffStart?.(), 1150);
    addTimer(() => {
      setIsComplete(true);
      onOpened?.();
    }, 2750);
  }, [addTimer, onHandoffStart, onOpened]);

  return (
    <div className={`royal-opening ${isOpen ? "is-opening is-open" : ""} ${isComplete ? "is-complete" : ""}`} aria-label="Cinematic wedding invitation opening">
      <div className="royal-opening__backdrop" aria-hidden="true" />
      <div className="royal-opening__glow" aria-hidden="true" />
      <div className="royal-opening__particles" aria-hidden="true">
        {particles.map((particle) => (
          <i
            className="royal-opening__particle"
            key={particle.id}
            style={{
              "--x": particle.x,
              "--y": particle.y,
              "--s": particle.size,
              "--d": particle.duration,
              "--delay": particle.delay,
            }}
          />
        ))}
      </div>

      <div className="royal-opening__card" aria-hidden="true">
        <div className="royal-opening__ornament">✦</div>
        <p className="royal-opening__eyebrow">Together with their families</p>
        <h1 className="royal-opening__names">{bride}<span className="royal-opening__amp">&amp;</span>{groom}</h1>
        <div className="royal-opening__rule" />
        <p className="royal-opening__date">{formatDate(invitation?.weddingDate)}</p>
        <p className="royal-opening__venue">{invitation?.venue?.name || "Join us for a celebration"}</p>
      </div>

      <div className="royal-opening__stage" aria-hidden="true">
        <div className="royal-opening__curtain royal-opening__curtain--left" />
        <div className="royal-opening__curtain royal-opening__curtain--right" />
        <div className="royal-opening__pelmet" />
      </div>

      {!isOpen && <RibbonBow initials={initials} />}
      <button
        type="button"
        className="royal-opening__button"
        onClick={triggerSequence}
        disabled={isOpen}
        aria-label="Untie the ribbon and open the wedding invitation"
      />
      <p className="royal-opening__instruction" aria-live="polite">
        {isOpen ? "Your invitation awaits" : "Untie the ribbon to begin"}
        <span>{isOpen ? "A celebration of love" : "Tap anywhere to open the curtains"}</span>
      </p>
    </div>
  );
}

export default EnvelopeReveal;
