/**
 * Safe, local-only wedding card style presets. No fonts or textures are
 * downloaded and no user-supplied CSS is injected into the invitation.
 */
export const STUDIO_FONT_OPTIONS = Object.freeze([
  { id: "original", label: "Original", description: "Keep the template typography" },
  { id: "classic", label: "Classic Serif", description: "Traditional and timeless" },
  { id: "modern", label: "Modern", description: "Clean contemporary lettering" },
  { id: "romantic", label: "Romantic", description: "Soft, expressive serif" },
  { id: "editorial", label: "Editorial", description: "Strong magazine-inspired type" },
].map(Object.freeze));

export const STUDIO_PALETTE_OPTIONS = Object.freeze([
  { id: "original", label: "Original", swatch: "#e9d4b7" },
  { id: "blush", label: "Blush Rose", swatch: "#b76f8a" },
  { id: "sage", label: "Sage Green", swatch: "#557e6b" },
  { id: "sapphire", label: "Sapphire", swatch: "#5571a5" },
  { id: "champagne", label: "Champagne", swatch: "#a9804b" },
  { id: "lavender", label: "Lavender", swatch: "#8d70ac" },
].map(Object.freeze));

export const STUDIO_BACKGROUND_OPTIONS = Object.freeze([
  { id: "original", label: "Original Finish", description: "Template's own background" },
  { id: "parchment", label: "Soft Parchment", description: "Warm paper texture" },
  { id: "linen", label: "Fine Linen", description: "Subtle woven texture" },
  { id: "glow", label: "Soft Glow", description: "Airy radial light" },
].map(Object.freeze));

export const STUDIO_SECTION_OPTIONS = Object.freeze([
  { id: "heading", label: "Invitation heading" },
  { id: "family", label: "Family introduction" },
  { id: "message", label: "Personal message" },
  { id: "dateVenue", label: "Wedding date & venue" },
  { id: "schedule", label: "Ceremony schedule" },
].map(Object.freeze));

export const DEFAULT_STUDIO_DESIGN = Object.freeze({
  font: "original",
  palette: "original",
  background: "original",
  sections: Object.freeze({
    heading: true,
    family: true,
    message: true,
    dateVenue: true,
    schedule: true,
  }),
});

export function normalizeStudioDesign(value) {
  const design = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const sections = design.sections && typeof design.sections === "object"
    && !Array.isArray(design.sections) ? design.sections : {};

  return {
    font: STUDIO_FONT_OPTIONS.some((item) => item.id === design.font)
      ? design.font : DEFAULT_STUDIO_DESIGN.font,
    palette: STUDIO_PALETTE_OPTIONS.some((item) => item.id === design.palette)
      ? design.palette : DEFAULT_STUDIO_DESIGN.palette,
    background: STUDIO_BACKGROUND_OPTIONS.some((item) => item.id === design.background)
      ? design.background : DEFAULT_STUDIO_DESIGN.background,
    sections: Object.fromEntries(
      STUDIO_SECTION_OPTIONS.map(({ id }) => [id, sections[id] !== false])
    ),
  };
}
