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

// New renderable templates are introduced in Phase 3, not this foundation.
export const STUDIO_TEMPLATES = Object.freeze([]);

export function listStudioTemplates(categoryId = "") {
  return STUDIO_TEMPLATES.filter(
    (template) => !categoryId || template.categoryId === categoryId
  );
}

export function getStudioTemplate(templateId, templateVersion) {
  if (!templateId) return null;

  return STUDIO_TEMPLATES.find(
    (template) => template.id === templateId
      && (templateVersion === undefined || template.version === templateVersion)
  ) || null;
}

/**
 * Unversioned/saved legacy cards must always use the existing renderer.
 * New cards may use the Studio renderer only when their template is registered.
 */
export function resolveInvitationDesignEngine(invitation) {
  return getStudioTemplate(invitation?.studioTemplateId, invitation?.studioTemplateVersion)
    ? "studio"
    : "legacy";
}
