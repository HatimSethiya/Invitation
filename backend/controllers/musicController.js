const ARCHIVE_SEARCH_URL = "https://archive.org/advancedsearch.php";
const ARCHIVE_METADATA_URL = "https://archive.org/metadata/";
const ARCHIVE_DOWNLOAD_URL = "https://archive.org/download/";
const ARCHIVE_ARTWORK_URL = "https://archive.org/services/img/";
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
const CATALOG_CACHE_MAX_ENTRIES = 60;
const catalogCache = new Map();

const DEFAULT_KEYWORDS = ["instrumental", "piano", "acoustic", "ambient", "romantic"];
const AUDIO_FILE_PATTERN = /\.(?:mp3|ogg|oga)$/i;
const MAX_AUDIO_FILE_BYTES = 80 * 1024 * 1024;

function normalizeText(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean).join(", ");
  }

  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function isUsableLicense(value) {
  const licenseUrl = normalizeText(value).toLowerCase();

  if (!licenseUrl) return false;

  const isPublicDomain =
    /creativecommons\.org\/publicdomain\/(?:zero|mark)\//i.test(licenseUrl);

  // Only list public-domain/CC0 or CC BY / CC BY-SA tracks. Do not offer
  // NonCommercial or NoDerivatives licenses for a public invitation website.
  const isAttributionLicense =
    /creativecommons\.org\/licenses\/by(?:-sa)?\/[0-9.]+(?:\/|$)/i.test(licenseUrl);

  return isPublicDomain || isAttributionLicense;
}

function parseDuration(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  const text = normalizeText(value);
  if (!text) return 0;

  if (/^\d+(?:\.\d+)?$/.test(text)) {
    return Math.max(0, Math.round(Number(text)));
  }

  const parts = text.split(":").map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return Math.max(0, Math.round(parts[0] * 60 + parts[1]));
  }

  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return Math.max(0, Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]));
  }

  return 0;
}

function getSearchTerms(rawQuery) {
  const normalizedQuery = rawQuery.toLowerCase().trim();
  if (
    !normalizedQuery ||
    /^(?:instrumentals?|instrnmental|instrumental music)$/.test(normalizedQuery)
  ) {
    return DEFAULT_KEYWORDS;
  }

  const terms = [...new Set(
    normalizedQuery.match(/[a-z0-9]{2,24}/gi) || []
  )].slice(0, 6);

  return terms.length ? terms : DEFAULT_KEYWORDS;
}

function buildSearchQuery(terms, includeLicensedOnly) {
  const matches = terms
    .map((term) => (
      `title:${term} OR subject:${term} OR description:${term}`
    ))
    .join(" OR ");

  const licenseFilter = includeLicensedOnly ? " AND licenseurl:*" : "";
  return `mediatype:audio${licenseFilter} AND (${matches})`;
}

async function searchArchive(query, limit, page, includeLicensedOnly) {
  const params = new URLSearchParams();
  params.set("q", buildSearchQuery(query, includeLicensedOnly));
  params.set("rows", String(limit));
  params.set("page", String(page));
  params.set("output", "json");
  params.set("fl[]", "identifier");
  params.append("fl[]", "title");
  params.append("fl[]", "creator");
  params.append("fl[]", "licenseurl");
  params.append("fl[]", "subject");

  const response = await fetch(`${ARCHIVE_SEARCH_URL}?${params.toString()}`, {
    signal: AbortSignal.timeout(9000),
    headers: { "User-Agent": "WeddingInvitationMusicCatalog/1.0" },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Ignore non-JSON provider error bodies and report a clear response below.
  }

  const docs = payload?.response?.docs;
  return {
    response,
    payload,
    docs: Array.isArray(docs) ? docs : [],
    usable: response.ok && Array.isArray(docs),
  };
}

async function getPlayableTrack(document) {
  const identifier = normalizeText(document?.identifier);
  if (!identifier) return null;

  try {
    const response = await fetch(
      `${ARCHIVE_METADATA_URL}${encodeURIComponent(identifier)}`,
      {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "WeddingInvitationMusicCatalog/1.0" },
      }
    );

    if (!response.ok) return null;

    const payload = await response.json();
    const metadata = payload?.metadata;
    const files = Array.isArray(payload?.files) ? payload.files : [];
    if (!metadata || !files.length) return null;

    const licenseUrl =
      normalizeText(metadata.licenseurl) ||
      normalizeText(metadata.license_url) ||
      normalizeText(document.licenseurl);

    if (!isUsableLicense(licenseUrl)) return null;

    const audioFiles = files
      .filter((file) => {
        const name = normalizeText(file?.name);
        const size = Number(file?.size) || 0;
        return (
          AUDIO_FILE_PATTERN.test(name) &&
          !name.includes("/") &&
          size > 16000 &&
          size <= MAX_AUDIO_FILE_BYTES &&
          file?.source !== "derivative"
        );
      })
      .sort((first, second) => {
        const firstIsMp3 = /\.mp3$/i.test(first.name);
        const secondIsMp3 = /\.mp3$/i.test(second.name);
        if (firstIsMp3 !== secondIsMp3) return firstIsMp3 ? -1 : 1;
        return (Number(first.size) || 0) - (Number(second.size) || 0);
      });

    const audioFile = audioFiles[0];
    if (!audioFile) return null;

    const creator =
      normalizeText(metadata.creator) ||
      normalizeText(metadata.artist) ||
      normalizeText(document.creator) ||
      "Independent creator";
    const title =
      normalizeText(metadata.title) ||
      normalizeText(document.title) ||
      audioFile.title ||
      identifier;
    const encodedFileName = encodeURIComponent(audioFile.name);
    const trackUrl =
      `${ARCHIVE_DOWNLOAD_URL}${encodeURIComponent(identifier)}/${encodedFileName}`;

    return {
      id: `archive-${identifier}`,
      title,
      artist: creator,
      audioUrl: trackUrl,
      artworkUrl: `${ARCHIVE_ARTWORK_URL}${encodeURIComponent(identifier)}`,
      duration: parseDuration(metadata.runtime || metadata.duration),
      shareUrl: `https://archive.org/details/${encodeURIComponent(identifier)}`,
      licenseUrl,
      attribution: `${title} — ${creator} (Internet Archive)`,
      provider: "internet-archive",
    };
  } catch (error) {
    if (error.name !== "AbortError" && error.name !== "TimeoutError") {
      console.error("Internet Archive track metadata error:", error.message);
    }
    return null;
  }
}

const getInstrumentalCatalog = async (req, res) => {
  const rawQuery = typeof req.query.query === "string"
    ? req.query.query.trim().slice(0, 100)
    : "";
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 24, 1), 24);
  const offset = Math.min(Math.max(Number.parseInt(req.query.offset, 10) || 0, 0), 2000);
  const page = Math.floor(offset / limit) + 1;
  const terms = getSearchTerms(rawQuery);
  const cacheKey = `${terms.join(",").toLowerCase()}|${page}|${limit}`;
  const cached = catalogCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    catalogCache.delete(cacheKey);
    catalogCache.set(cacheKey, cached);
    return res.json(cached.payload);
  }

  if (cached) catalogCache.delete(cacheKey);

  try {
    let searchResult = await searchArchive(terms, limit, page, true);

    // Some Archive search indexes don't expose licenseurl as a searchable field.
    // Retry without that filter, then verify each result's actual item metadata.
    if (!searchResult.usable || searchResult.docs.length === 0) {
      const fallbackResult = await searchArchive(terms, limit, page, false);
      if (fallbackResult.usable) searchResult = fallbackResult;
    }

    if (!searchResult.usable) {
      return res.status(502).json({
        success: false,
        message: "Internet Archive's music catalogue is temporarily unavailable. Try again shortly.",
      });
    }

    const trackResults = await Promise.all(
      searchResult.docs.map((document) => getPlayableTrack(document))
    );
    const tracks = trackResults.filter(Boolean);

    const catalogPayload = {
      success: true,
      tracks,
      offset,
      nextOffset: offset + searchResult.docs.length,
      hasMore: searchResult.docs.length === limit,
      provider: "Internet Archive",
      message: "Streams directly from Internet Archive; only permissively licensed tracks are listed.",
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
    console.error("Internet Archive catalogue error:", error.message);
    return res.status(502).json({
      success: false,
      message: error.name === "TimeoutError"
        ? "The music catalogue took too long to respond. Please retry."
        : "Could not connect to Internet Archive. Check the backend network and retry.",
    });
  }
};

module.exports = { getInstrumentalCatalog };
