import { useRef } from "react";

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

/**
 * CardStationery: Physical 400gsm cotton rag ivory stationery invitation
 * with embossed antique gold details, subtle light sweep on interaction,
 * and progressive structural dissolution into wedding dust.
 */
function CardStationery({
  invitation,
  isAnticipating,
  isDissolving,
  onCardTap,
  cardRef,
}) {
  const localRef = useRef(null);
  const activeRef = cardRef || localRef;

  // Dynamic names & initials
  const bride =
    invitation?.couple?.partner1?.name ||
    invitation?.couple?.brideName ||
    "Bride";

  const groom =
    invitation?.couple?.partner2?.name ||
    invitation?.couple?.groomName ||
    "Groom";

  const p1Initial = (bride?.[0] || "B").toUpperCase();
  const p2Initial = (groom?.[0] || "G").toUpperCase();
  const monogram = `${p1Initial}&${p2Initial}`;

  return (
    <div
      ref={activeRef}
      className={`stationery-card-container ${
        isAnticipating ? "is-anticipating" : ""
      } ${isDissolving ? "is-dissolving" : ""}`}
      onClick={onCardTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCardTap();
        }
      }}
      aria-label="Wedding invitation card. Click or tap to open."
    >
      <div className="stationery-card">
        {/* Subtle Paper Texture & Watermark */}
        <div className="card-paper-texture" />

        {/* Soft Diagonal Light Sweep (Triggers on Tap 0.6s - 0.9s) */}
        <div className="card-light-sweep" />

        {/* Dissolution Glowing Ember Boundary */}
        <div className="card-dissolve-ember" />

        {/* Delicate Antique Gold Double Border */}
        <div className="card-gold-border-outer">
          <div className="card-gold-border-inner" />
          <span className="card-corner-notch tl" />
          <span className="card-corner-notch tr" />
          <span className="card-corner-notch bl" />
          <span className="card-corner-notch br" />
        </div>

        {/* Card Header */}
        <header className="stationery-header">
          <span className="card-eyebrow">A Wedding Invitation</span>
          <p className="card-family-intro">Together with their families</p>
        </header>

        {/* Embossed Gold Monogram Crest */}
        <div className="card-monogram-crest">
          <span className="crest-ring-outer" />
          <span className="crest-ring-inner" />
          <span className="crest-initials">{monogram}</span>
        </div>

        {/* Couple Names */}
        <div className="card-couple-block">
          <h1 className="card-couple-name">{bride}</h1>
          <span className="card-ampersand">&amp;</span>
          <h1 className="card-couple-name">{groom}</h1>
        </div>

        {/* Delicate Floral / Gold Divider */}
        <div className="card-ornament-divider">
          <span className="divider-rule" />
          <span className="divider-gem">✦</span>
          <span className="divider-rule" />
        </div>

        {/* Date & Venue Details */}
        <footer className="stationery-footer">
          <p className="card-wedding-date">
            {formatDate(invitation?.weddingDate)}
          </p>

          {invitation?.venue?.name && (
            <p className="card-wedding-venue">
              {invitation.venue.name}
              {invitation.venue.city ? ` · ${invitation.venue.city}` : ""}
            </p>
          )}
        </footer>
      </div>

      {/* Understated Tap Prompt (Fades out immediately on interaction) */}
      <div className="card-open-prompt">
        <span className="prompt-dot" />
        <span className="prompt-text">Tap Invitation to Open</span>
      </div>
    </div>
  );
}

export default CardStationery;
