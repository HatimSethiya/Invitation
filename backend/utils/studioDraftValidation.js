// Explicit allowlist: the backend must never accept arbitrary template IDs.
const STUDIO_TEMPLATE_IDS = new Set([
  "fatemi-heritage",
  "emerald-nikah",
  "mandap-marigold",
  "lotus-pichwai",
  "jain-pearl",
  "anand-karaj",
  "chapel-blossom",
  "gujarati-bandhani",
  "southern-kolam",
  "rajasthani-jharokha",
  "modern-editorial",
  "celestial-glass",
]);

class DraftValidationError extends Error {}

const DESIGN_OPTIONS = Object.freeze({
  font: ["original", "classic", "modern", "romantic", "editorial"],
  palette: ["original", "blush", "sage", "sapphire", "champagne", "lavender"],
  background: ["original", "parchment", "linen", "glow"],
});
const DESIGN_SECTIONS = Object.freeze([
  "heading", "family", "message", "dateVenue", "schedule",
]);

function validateStudioDesign(input) {
  const design = input === undefined ? {} : input;
  if (!design || typeof design !== "object" || Array.isArray(design)) {
    throw new DraftValidationError("Design settings must be an object.");
  }

  const result = {};
  for (const [key, options] of Object.entries(DESIGN_OPTIONS)) {
    const value = design[key] === undefined ? "original" : design[key];
    if (typeof value !== "string" || !options.includes(value)) {
      throw new DraftValidationError(`Invalid ${key} selection.`);
    }
    result[key] = value;
  }

  const sections = design.sections === undefined ? {} : design.sections;
  if (!sections || typeof sections !== "object" || Array.isArray(sections)) {
    throw new DraftValidationError("Card section settings must be an object.");
  }

  result.sections = {};
  for (const key of DESIGN_SECTIONS) {
    const visible = sections[key] === undefined ? true : sections[key];
    if (typeof visible !== "boolean") {
      throw new DraftValidationError(`Invalid visibility setting for ${key}.`);
    }
    result.sections[key] = visible;
  }

  return result;
}


function cleanText(value, field, limit) {
  if (value == null) return "";
  if (typeof value !== "string") {
    throw new DraftValidationError(`${field} must be text.`);
  }

  const text = value.trim();
  if (text.length > limit) {
    throw new DraftValidationError(`${field} must be ${limit} characters or fewer.`);
  }

  return text;
}

function cleanDate(value, field) {
  const text = cleanText(value, field, 10);
  if (!text) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new DraftValidationError(`${field} must be a valid YYYY-MM-DD date.`);
  }

  const [year, month, day] = text.split("-").map(Number);
  const parsed = new Date(0);
  parsed.setUTCHours(0, 0, 0, 0);
  parsed.setUTCFullYear(year, month - 1, day);
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new DraftValidationError(`${field} is not a valid calendar date.`);
  }

  return text;
}

function validateDraftPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DraftValidationError("Valid draft details are required.");
  }

  const venue = value.venue ?? {};
  if (typeof venue !== "object" || venue === null || Array.isArray(venue)) {
    throw new DraftValidationError("Venue details must be an object.");
  }

  const events = value.events ?? [];
  if (!Array.isArray(events) || events.length > 8) {
    throw new DraftValidationError("Add no more than eight wedding events.");
  }

  const normalizedEvents = events.map((event, index) => {
    if (!event || typeof event !== "object" || Array.isArray(event)) {
      throw new DraftValidationError(`Event ${index + 1} must be an object.`);
    }
    return {
      title: cleanText(event.title, "Event title", 100),
      date: cleanDate(event.date, "Event date"),
      time: cleanText(event.time, "Event time", 40),
      venue: cleanText(event.venue, "Event venue", 160),
    };
  });

  return {
    title: cleanText(value.title, "Card title", 160) || "Untitled Wedding Card",
    partner1: cleanText(value.partner1, "First partner name", 120),
    partner2: cleanText(value.partner2, "Second partner name", 120),
    heading: cleanText(value.heading, "Invitation heading", 160),
    familyLine: cleanText(value.familyLine, "Family introduction", 300),
    message: cleanText(value.message, "Invitation message", 800),
    weddingDate: cleanDate(value.weddingDate, "Wedding date"),
    venue: {
      name: cleanText(venue.name, "Venue name", 160),
      address: cleanText(venue.address, "Venue address", 360),
    },
    events: normalizedEvents,
    design: validateStudioDesign(value.design),
  };
}

function isValidDraftPassword(password) {
  return typeof password === "string"
    && password.length >= 8
    && password.length <= 72;
}

module.exports = {
  STUDIO_TEMPLATE_IDS,
  DraftValidationError,
  validateDraftPayload,
  validateStudioDesign,
  isValidDraftPassword,
};
