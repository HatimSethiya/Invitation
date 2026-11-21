/**
 * Gallery entries for EXISTING invitation themes.
 *
 * Every design below is a visual variant of the CURRENT Bohra layout; these
 * are NOT new community-specific templates. Phase 3's dedicated layouts
 * are registered separately in STUDIO_TEMPLATES in templateCatalog.js.
 *
 * Keep theme IDs identical to the existing wizard and backend. New invitation
 * creation can preselect a theme; existing invitation data never changes.
 */
export const GALLERY_DESIGNS = Object.freeze([
  { id: "bohraNikah", name: "Ivory Gold · Nikah", categoryId: "bohra", style: "traditional", color: "gold", description: "A graceful ivory-and-gold invitation with traditional elegance." },
  { id: "purpleWhite", name: "White Purple · Glass", categoryId: "bohra", style: "modern", color: "purple", description: "Airy white glass details with soft violet accents." },
  { id: "midnightNavy", name: "Midnight Navy", categoryId: "bohra", style: "royal", color: "blue", description: "A dramatic navy finish with rich formal contrast." },
  { id: "sageBotanical", name: "Sage Botanical", categoryId: "bohra", style: "floral", color: "green", description: "Calming sage shades and botanical-inspired refinement." },
  { id: "champagnePearl", name: "Champagne Pearl", categoryId: "bohra", style: "classic", color: "gold", description: "Warm champagne tones with timeless pearlescent charm." },
  { id: "rubyVelvet", name: "Ruby Velvet", categoryId: "bohra", style: "royal", color: "red", description: "A rich ruby palette with velvet-inspired depth." },
  { id: "oceanTeal", name: "Ocean Teal", categoryId: "bohra", style: "modern", color: "teal", description: "Refreshing ocean tones for a contemporary celebration." },
  { id: "celestialBlack", name: "Celestial Onyx", categoryId: "bohra", style: "royal", color: "black", description: "A midnight-black inspired mood with luminous accents." },
  { id: "blushTerracotta", name: "Blush Terracotta", categoryId: "bohra", style: "floral", color: "pink", description: "Soft blush and earthy warmth for a romantic finish." },
  { id: "desertSand", name: "Desert Sand", categoryId: "bohra", style: "classic", color: "neutral", description: "Understated sand and beige tones for an elegant card." },
  { id: "sapphireSilver", name: "Sapphire Silver", categoryId: "bohra", style: "royal", color: "blue", description: "Sapphire shades balanced with cool silvery details." },
  { id: "burgundyLuxe", name: "Burgundy Luxe", categoryId: "bohra", style: "classic", color: "red", description: "Luxurious burgundy with polished, timeless styling." },
  { id: "jadeMarble", name: "Jade Marble", categoryId: "bohra", style: "modern", color: "green", description: "Jade-inspired elegance and a refined marble mood." },
  { id: "sunsetCopper", name: "Sunset Copper", categoryId: "bohra", style: "classic", color: "orange", description: "Sunset warmth paired with sophisticated copper notes." },
].map((design) => Object.freeze(design)));

export const GALLERY_STYLES = Object.freeze([
  { id: "traditional", name: "Traditional" },
  { id: "modern", name: "Modern" },
  { id: "royal", name: "Royal" },
  { id: "floral", name: "Floral" },
  { id: "classic", name: "Classic" },
].map((style) => Object.freeze(style)));

export const GALLERY_COLORS = Object.freeze([
  { id: "gold", name: "Gold" },
  { id: "purple", name: "Purple" },
  { id: "blue", name: "Blue" },
  { id: "green", name: "Green" },
  { id: "red", name: "Red" },
  { id: "teal", name: "Teal" },
  { id: "black", name: "Black" },
  { id: "pink", name: "Pink" },
  { id: "neutral", name: "Beige" },
  { id: "orange", name: "Copper" },
].map((color) => Object.freeze(color)));

export function getGalleryDesignByTheme(themeId) {
  return GALLERY_DESIGNS.find((design) => design.id === themeId) || null;
}

export function filterGalleryDesigns({ category = "all", search = "", style = "all", color = "all" } = {}) {
  const query = typeof search === "string" ? search.trim().toLocaleLowerCase() : "";

  return GALLERY_DESIGNS.filter((design) => {
    if (category !== "all" && design.categoryId !== category) return false;
    if (style !== "all" && design.style !== style) return false;
    if (color !== "all" && design.color !== color) return false;

    return !query || [
      design.name,
      design.description,
      design.id,
      design.style,
      design.color,
      design.categoryId,
    ].some((value) => value.toLocaleLowerCase().includes(query));
  });
}
