const JAMENDO_API_URL = "https://api.jamendo.com/v3.0/tracks/";

const getInstrumentalCatalog = async (req, res) => {
  const clientId =
    process.env.JAMENDO_CLIENT_ID ||
    (process.env.NODE_ENV === "production" ? "" : "709fa152");

  if (!clientId) {
    return res.status(503).json({
      success: false,
      message: "Music catalogue is not configured. Set JAMENDO_CLIENT_ID in the backend environment.",
    });
  }

  const query = typeof req.query.query === "string"
    ? req.query.query.trim().slice(0, 100)
    : "";
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 24, 1), 24);
  const offset = Math.min(Math.max(Number.parseInt(req.query.offset, 10) || 0, 0), 2000);

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      format: "json",
      limit: String(limit),
      offset: String(offset),
      audioformat: "mp32",
      vocalinstrumental: "instrumental",
      include: "licenses,musicinfo",
    });

    if (query) params.set("search", query);

    const response = await fetch(`${JAMENDO_API_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(9000),
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "The instrumental catalogue is temporarily unavailable. Please try again.",
      });
    }

    const payload = await response.json();
    if (payload.headers?.status !== "success" || !Array.isArray(payload.results)) {
      return res.status(502).json({
        success: false,
        message: "The music provider did not return a usable track list.",
      });
    }

    const tracks = payload.results
      .filter((track) => typeof track.audio === "string" && track.audio.startsWith("https://"))
      .map((track) => {
        const firstLicense = Array.isArray(track.licenses) ? track.licenses[0] : null;
        const artist = track.artist_name || "Independent artist";
        const title = track.name || "Untitled instrumental";

        return {
          id: String(track.id),
          title,
          artist,
          audioUrl: track.audio,
          artworkUrl: track.album_image || track.image || "",
          duration: Number(track.duration) || 0,
          shareUrl: track.shareurl || `https://www.jamendo.com/track/${track.id}`,
          licenseUrl: track.license_ccurl || firstLicense?.url || firstLicense?.license_url || "",
          attribution: `${title} — ${artist} (Jamendo)`,
          provider: "jamendo",
        };
      });

    return res.json({
      success: true,
      tracks,
      offset,
      nextOffset: offset + payload.results.length,
      hasMore: payload.results.length === limit,
      provider: "Jamendo",
      message: "Stream tracks directly; no audio file is added to the project.",
    });
  } catch (error) {
    console.error("Instrumental catalogue error:", error.message);
    return res.status(502).json({
      success: false,
      message: error.name === "TimeoutError"
        ? "The music catalogue took too long to respond. Please try again."
        : "Could not connect to the music catalogue. Check the backend network and retry.",
    });
  }
};

module.exports = { getInstrumentalCatalog };
