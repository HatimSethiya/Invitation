
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
  const primaryNames = invitation?.couple?.nameOrder === "brideFirst" ? [bride, groom] : [groom, bride];
  const secondBride = invitation?.secondCouple?.brideName || "Bride";
  const secondGroom = invitation?.secondCouple?.groomName || "Groom";
  const secondNames = invitation?.secondCouple?.nameOrder === "brideFirst" ? [secondBride, secondGroom] : [secondGroom, secondBride];
  const usePosterCover = invitation?.slug === "mufaddalweddinginvitation";

  return (
    <div
      className={`stationery-card-container ${
        isAnticipating ? "is-anticipating" : ""
      } ${isDissolving ? "is-dissolving" : ""}`}
      onClick={() => onCardTap?.()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCardTap?.();
        }
      }}
      aria-label="Wedding invitation card. Click or tap to open."
    >
      
<div className={`stationery-card stationery-card-poster ${invitation?.theme === "purpleWhite" ? "stationery-card-purple-white" : ""}`}>
  {usePosterCover ? (
    <img
      className="poster-card-art"
      src="/mufaddal-zainab-cover.png"
      alt="Mufaddal Weds Zainab — Our Forever Begins, 17.12.2026"
      draggable="false"
    />
  ) : invitation?.coverImageUrl ? (
    <img
      className="poster-card-art uploaded-cover-art"
      src={invitation.coverImageUrl}
      alt={`Wedding invitation for ${invitation.title || "the couple"} — tap to open`}
      draggable="false"
    />
  ) : (
    <div className="stationery-fallback-cover">
      <span className="stationery-fallback-monogram">{monogram}</span>
      <span className="stationery-fallback-names">{primaryNames[0]} <em>weds</em> {primaryNames[1]}</span>
      {invitation?.cardType === "double" && invitation?.secondCouple && (
        <span className="stationery-fallback-names">{secondNames[0]} <em>weds</em> {secondNames[1]}</span>
      )}
      <span className="stationery-fallback-tap">Tap to Open</span>
    </div>
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
