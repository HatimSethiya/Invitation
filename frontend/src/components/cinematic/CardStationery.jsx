
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
 * with embossed antique gold details and a clean, smooth handoff animation.
 */
function CardStationery({
  invitation,
  isAnticipating,
  isDissolving,
  onCardTap,
}) {

  // Dynamic names & initials
  const bride =
    invitation?.couple?.partner1?.name ||
    invitation?.couple?.brideName ||
    "Bride";

  const groom =
    invitation?.couple?.partner2?.name ||
    invitation?.couple?.groomName ||
    "Groom";

  const groomInitial = (groom?.[0] || "G").toUpperCase();
  const brideInitial = (bride?.[0] || "B").toUpperCase();
  const monogram = `${groomInitial}&${brideInitial}`;
  const usePosterCover = invitation?.slug === "mufaddalweddinginvitation";

  return (
    <div
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
      <div className={`stationery-card ${usePosterCover ? "stationery-card-poster" : ""}`}>
        {usePosterCover ? (
          <div className="poster-glass-face">
            <div className="poster-glass-sheen" aria-hidden="true" />
            <div className="poster-glass-frame" aria-hidden="true">
              <span className="poster-corner poster-corner-tl">❧</span>
              <span className="poster-corner poster-corner-tr">❧</span>
              <span className="poster-corner poster-corner-bl">❧</span>
              <span className="poster-corner poster-corner-br">❧</span>
            </div>

            <div className="poster-monogram" aria-label="M Z monogram">
              <span className="poster-monogram-m">M</span>
              <span className="poster-monogram-z">Z</span>
              <svg
                className="poster-monogram-botanical"
                viewBox="0 0 180 110"
                fill="none"
                aria-hidden="true"
              >
                <path d="M25 91C49 77 62 57 83 18" />
                <path d="M52 63C34 63 23 51 21 36C39 36 51 45 52 63Z" />
                <path d="M64 45C48 39 43 25 48 12C63 20 69 31 64 45Z" />
                <path d="M77 29C79 14 91 6 105 8C99 24 89 31 77 29Z" />
                <path d="M47 74C30 78 16 70 11 57C28 54 41 61 47 74Z" />
                <path d="M86 20C105 37 120 40 146 35" />
                <path d="M112 37C113 22 125 13 139 15C133 30 123 38 112 37Z" />
                <path d="M126 38C137 48 151 47 162 38C149 29 136 30 126 38Z" />
              </svg>
            </div>

            <div className="poster-cover-title">
              <span>Mufaddal</span>
              <span className="poster-cover-weds">Weds</span>
              <span>Zainab</span>
            </div>

            <div className="poster-cover-ornament" aria-hidden="true">
              <span />
              <b>✦</b>
              <span />
            </div>

            <p className="poster-cover-tagline">Our Forever Begins</p>
            <p className="poster-cover-date">17.12.2026</p>

            <div className="poster-cover-bottom-ornament" aria-hidden="true">
              <span />
              <b>❧</b>
              <span />
            </div>
          </div>
        ) : (
          <>
        {/* Subtle Paper Texture & Watermark */}
        <div className="card-paper-texture" />

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
          <h1 className="card-couple-name">{groom}</h1>
          <span className="card-ampersand">&amp;</span>
          <h1 className="card-couple-name">{bride}</h1>
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
          </>
        )}
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
