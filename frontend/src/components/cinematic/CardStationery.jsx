
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
              <span className="poster-corner poster-corner-tl" aria-hidden="true">✾</span>
              <span className="poster-corner poster-corner-tr" aria-hidden="true">✾</span>
              <span className="poster-corner poster-corner-bl" aria-hidden="true">✾</span>
              <span className="poster-corner poster-corner-br" aria-hidden="true">✾</span>
            </div>

            <div className="poster-monogram" aria-label="M Z monogram">
              <span className="poster-monogram-m">M</span>
              <span className="poster-monogram-z">Z</span>
              <svg
                className="poster-monogram-botanical"
                viewBox="0 0 240 150"
                fill="none"
                aria-hidden="true"
              >
                <g className="poster-botanical-stems">
                  <path d="M17 132C44 113 65 86 87 39C96 23 105 13 119 6" />
                  <path d="M40 111C70 86 97 66 131 51C155 42 180 38 221 44" />
                  <path d="M76 77C57 68 47 52 47 35C65 40 77 54 76 77Z" />
                  <path d="M90 51C76 35 77 19 87 7C101 22 101 39 90 51Z" />
                  <path d="M112 22C119 7 135 2 148 8C139 23 126 29 112 22Z" />
                  <path d="M49 104C30 105 18 93 15 78C34 78 48 88 49 104Z" />
                  <path d="M67 87C48 81 40 67 44 51C61 60 70 73 67 87Z" />
                  <path d="M119 61C105 45 108 31 118 20C132 34 132 49 119 61Z" />
                  <path d="M142 48C151 31 168 27 182 34C171 49 157 54 142 48Z" />
                  <path d="M160 46C172 57 188 56 201 46C187 36 172 37 160 46Z" />
                  <path d="M87 77C75 65 76 52 85 41C97 53 98 66 87 77Z" />
                  <path d="M104 66C115 81 132 85 147 78C137 63 120 59 104 66Z" />
                  <path d="M32 126C27 113 31 101 41 94C49 108 45 120 32 126Z" />
                </g>
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
