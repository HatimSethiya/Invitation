
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
 * Remove only the near-black background connected to the image edges.
 * Flood-filling from the edges preserves dark green lettering and artwork
 * inside the gold card while making the black canvas transparent.
 */
function removeBlackBackground(event) {
  const image = event.currentTarget;

  if (image.dataset.backgroundRemoved === "true") return;

  const width = image.naturalWidth;
  const height = image.naturalHeight;

  if (!width || !height) return;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;

  try {
    context.drawImage(image, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const pixelCount = width * height;
    const visited = new Uint8Array(pixelCount);
    const stack = new Uint32Array(pixelCount);
    const backgroundThreshold = 48;
    let stackSize = 0;

    const enqueueIfBackground = (index) => {
      if (visited[index]) return;

      const offset = index * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];

      if (
        pixels[offset + 3] === 0 ||
        Math.max(red, green, blue) > backgroundThreshold
      ) {
        return;
      }

      visited[index] = 1;
      stack[stackSize] = index;
      stackSize += 1;
    };

    // Seed all four edges, so enclosed dark details on the card remain intact.
    for (let x = 0; x < width; x += 1) {
      enqueueIfBackground(x);
      enqueueIfBackground((height - 1) * width + x);
    }

    for (let y = 0; y < height; y += 1) {
      enqueueIfBackground(y * width);
      enqueueIfBackground(y * width + width - 1);
    }

    while (stackSize > 0) {
      stackSize -= 1;
      const index = stack[stackSize];
      const x = index % width;
      const y = Math.floor(index / width);

      pixels[index * 4 + 3] = 0;

      if (x > 0) enqueueIfBackground(index - 1);
      if (x + 1 < width) enqueueIfBackground(index + 1);
      if (y > 0) enqueueIfBackground(index - width);
      if (y + 1 < height) enqueueIfBackground(index + width);
    }

    context.putImageData(imageData, 0, 0);
    image.dataset.backgroundRemoved = "true";
    image.src = canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Could not remove the invitation image background.", error);
  }
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
      
<div className="stationery-card stationery-card-poster">
  <img
    className="poster-card-art"
    src="/mufaddal-zainab-cover.png"
    alt="Mufaddal Weds Zainab — Our Forever Begins, 17.12.2026"
    draggable="false"
    onLoad={removeBlackBackground}
  />
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
