/**
 * Wedding Studio template foundation.
 *
 * The legacy invitation renderer owns every existing card. No template is
 * marked available until its renderer, preview, and editable fields exist.
 * New templates will be added here with immutable identifiers and versions.
 */
export const STUDIO_CATEGORIES = Object.freeze([
  Object.freeze({
    id: "bohra",
    name: "Dawoodi Bohra",
    description: "Fatemi heritage, traditional Nikah and refined invitation styles.",
    symbol: "✦",
    colors: ["#e7c48e", "#72546e"],
  }),
  Object.freeze({
    id: "muslim",
    name: "Muslim",
    description: "Nikah, Walima and calligraphy-inspired celebrations.",
    symbol: "☪",
    colors: ["#a9d5c6", "#3c706b"],
  }),
  Object.freeze({
    id: "hindu",
    name: "Hindu",
    description: "Mandap, floral, royal and traditional ceremonies.",
    symbol: "✿",
    colors: ["#f3c08d", "#a44c55"],
  }),
  Object.freeze({
    id: "jain",
    name: "Jain",
    description: "Elegant, graceful and traditional family invitations.",
    symbol: "❁",
    colors: ["#ead9b0", "#78634e"],
  }),
  Object.freeze({
    id: "sikh",
    name: "Sikh",
    description: "Anand Karaj and Punjabi wedding traditions.",
    symbol: "✧",
    colors: ["#a5bbd8", "#49638a"],
  }),
  Object.freeze({
    id: "christian",
    name: "Christian",
    description: "Classic ceremony, floral and church wedding styles.",
    symbol: "♡",
    colors: ["#e8bfd1", "#a46787"],
  }),
  Object.freeze({
    id: "regional",
    name: "Regional Traditions",
    description: "Gujarati, Marwari, South Indian and more regional styles.",
    symbol: "❊",
    colors: ["#dec29f", "#8b696d"],
  }),
  Object.freeze({
    id: "modern",
    name: "Modern & Universal",
    description: "Minimal, luxurious and contemporary invitation designs.",
    symbol: "◇",
    colors: ["#c0b6de", "#65528a"],
  }),
]);

/**
 * Phase 3: original, structurally distinct invitation designs for preview.
 *
 * "preview" means the card exists as a coded visual design, but the studio
 * editor, API persistence and public renderer are NOT connected yet.
 * No existing invitation is auto-migrated; old cards always use the legacy
 * renderer. Never set a template to "ready" before end-to-end integration.
 */
const previewTemplate = ({ sample, ...template }) => Object.freeze({
  ...template,
  version: 1,
  status: "preview",
  sample: Object.freeze({
    ...sample,
    names: Object.freeze([...sample.names]),
  }),
});

export const STUDIO_TEMPLATES = Object.freeze([
  previewTemplate({
    id: "fatemi-heritage", categoryId: "bohra", name: "Fatemi Heritage",
    description: "An ivory invitation with Arabic calligraphy, double-lined gold framing and a formal Nikah programme.",
    layout: "fatemi", style: "traditional", color: "gold",
    sample: { names: ["Mustafa", "Zainab"], heading: "Nikah Invitation", ceremony: "Nikah Ceremony", detail: "Together with their families" },
  }),
  previewTemplate({
    id: "emerald-nikah", categoryId: "muslim", name: "Emerald Nikah",
    description: "Emerald arches, a crescent emblem and a classic Nikah announcement.",
    layout: "emerald", style: "royal", color: "green",
    sample: { names: ["Ali", "Noor"], heading: "The Nikah Celebration", ceremony: "Nikah", detail: "With the blessings of their families" },
  }),
  previewTemplate({
    id: "mandap-marigold", categoryId: "hindu", name: "Mandap Marigold",
    description: "A festive marigold mandap with traditional pillars and warm vermilion tones.",
    layout: "mandap", style: "traditional", color: "orange",
    sample: { names: ["Aarav", "Meera"], heading: "शुभ विवाह", ceremony: "Wedding Ceremony", detail: "Together with their families" },
  }),
  previewTemplate({
    id: "lotus-pichwai", categoryId: "hindu", name: "Lotus Pichwai",
    description: "A pastel floral card with lotus medallions and an airy ceremonial invitation.",
    layout: "lotus", style: "floral", color: "pink",
    sample: { names: ["Ishaan", "Ananya"], heading: "शुभ विवाह", ceremony: "Wedding Celebration", detail: "With love and blessings" },
  }),
  previewTemplate({
    id: "jain-pearl", categoryId: "jain", name: "Jain Pearl",
    description: "Minimal ivory stationery with geometric details and a delicate lotus.",
    layout: "jain", style: "classic", color: "neutral",
    sample: { names: ["Riya", "Aditya"], heading: "मंगल परिणय", ceremony: "Wedding Ceremony", detail: "Your presence is requested" },
  }),
  previewTemplate({
    id: "anand-karaj", categoryId: "sikh", name: "Anand Karaj",
    description: "A royal blue and saffron card featuring an elegant Gurmukhi motif.",
    layout: "anand", style: "royal", color: "blue",
    sample: { names: ["Simran", "Gurpreet"], heading: "Anand Karaj", ceremony: "Wedding Ceremony", detail: "With the blessings of Waheguru" },
  }),
  previewTemplate({
    id: "chapel-blossom", categoryId: "christian", name: "Chapel Blossom",
    description: "A softly arched chapel design with fine rose branches and classic serif lettering.",
    layout: "chapel", style: "floral", color: "pink",
    sample: { names: ["Grace", "Daniel"], heading: "A Joyful Union", ceremony: "Wedding Ceremony", detail: "Together with their families" },
  }),
  previewTemplate({
    id: "gujarati-bandhani", categoryId: "regional", name: "Gujarati Bandhani",
    description: "A vibrant bandhani-inspired textile border and traditional Gujarati invitation.",
    layout: "bandhani", style: "traditional", color: "red",
    sample: { names: ["Krish", "Jinal"], heading: "શુભ વિવાહ", ceremony: "Wedding Celebration", detail: "With the blessings of our families" },
  }),
  previewTemplate({
    id: "southern-kolam", categoryId: "regional", name: "Southern Kolam",
    description: "An elegant South Indian-inspired card with temple lines and kolam ornamentation.",
    layout: "kolam", style: "classic", color: "green",
    sample: { names: ["Karthik", "Lakshmi"], heading: "Wedding Invitation", ceremony: "Muhurtham", detail: "With love and blessings" },
  }),
  previewTemplate({
    id: "rajasthani-jharokha", categoryId: "regional", name: "Rajasthani Jharokha",
    description: "A regal arched jharokha card with intricate borders and warm heritage colors.",
    layout: "jharokha", style: "royal", color: "gold",
    sample: { names: ["Dev", "Nisha"], heading: "Royal Wedding", ceremony: "Wedding Ceremony", detail: "Together with our families" },
  }),
  previewTemplate({
    id: "modern-editorial", categoryId: "modern", name: "Editorial Vows",
    description: "Architectural type, asymmetric composition and crisp monochrome stationery.",
    layout: "editorial", style: "modern", color: "black",
    sample: { names: ["Alex", "Taylor"], heading: "WE ARE GETTING MARRIED", ceremony: "The Celebration", detail: "Join us for the big day" },
  }),
  previewTemplate({
    id: "celestial-glass", categoryId: "modern", name: "Celestial Glass",
    description: "A luminous lilac glass design with floating stars and modern typography.",
    layout: "glass", style: "modern", color: "purple",
    sample: { names: ["Avery", "Jordan"], heading: "A New Chapter", ceremony: "Wedding Celebration", detail: "A day of love and light" },
  }),
]);

export function listStudioTemplates(categoryId = "") {
  return STUDIO_TEMPLATES.filter(
    (template) => !categoryId || template.categoryId === categoryId
  );
}

export function filterStudioTemplates({
  category = "all",
  search = "",
  style = "all",
  color = "all",
} = {}) {
  const query = typeof search === "string" ? search.trim().toLocaleLowerCase() : "";

  return STUDIO_TEMPLATES.filter((template) => {
    if (category !== "all" && template.categoryId !== category) return false;
    if (style !== "all" && template.style !== style) return false;
    if (color !== "all" && template.color !== color) return false;

    return !query || [
      template.name,
      template.description,
      template.categoryId,
      template.style,
      template.color,
    ].some((value) => value.toLocaleLowerCase().includes(query));
  });
}

export function getStudioTemplate(templateId, templateVersion) {
  if (!templateId) return null;

  return STUDIO_TEMPLATES.find(
    (template) => template.id === templateId
      && (templateVersion === undefined || template.version === templateVersion)
  ) || null;
}

/**
 * A registered preview is NOT a published card renderer. Existing cards and
 * unknown/preview template IDs continue to use the untouched legacy engine.
 */
export function resolveInvitationDesignEngine(invitation) {
  const template = getStudioTemplate(
    invitation?.studioTemplateId,
    invitation?.studioTemplateVersion
  );
  return template?.status === "ready" ? "studio" : "legacy";
}
