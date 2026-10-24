const JAMENDO_API_URL = "https://api.jamendo.com/v3.0/tracks/";
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
const CATALOG_CACHE_MAX_ENTRIES = 60;
const catalogCache = new Map();

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
  const cacheKey = query.toLowerCase() + "|" + offset + "|" + limit;
  const cached = catalogCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    catalogCache.delete(cacheKey);
    catalogCache.set(cacheKey, cached);
    return res.json(cached.payload);
  }

  if (cached) catalogCache.delete(cacheKey);

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      format: "json",
      limit: String(limit),
      offset: String(offset),
      audioformat: "mp32",
      vocalinstrumental: "instrumental",
      include: "licenses musicinfo",
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

    const catalogPayload = {
      success: true,
      tracks,
      offset,
      nextOffset: offset + payload.results.length,
      hasMore: payload.results.length === limit,
      provider: "Jamendo",
      message: "Stream tracks directly; no audio file is added to the project.",
    };

    catalogCache.set(cacheKey, {
      expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
      payload: catalogPayload,
    });

    if (catalogCache.size > CATALOG_CACHE_MAX_ENTRIES) {
      const oldestKey = catalogCache.keys().next().value;
      if (oldestKey !== undefined) catalogCache.delete(oldestKey);
    }

    return res.json(catalogPayload);
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
