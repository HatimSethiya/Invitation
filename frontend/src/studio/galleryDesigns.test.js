import assert from "node:assert/strict";
import test from "node:test";
import {
  GALLERY_COLORS,
  GALLERY_DESIGNS,
  GALLERY_STYLES,
  filterGalleryDesigns,
  getGalleryDesignByTheme,
} from "./galleryDesigns.js";
import { resolveInvitationDesignEngine } from "./templateCatalog.js";

test("gallery only lists the 14 existing themes with unique IDs", () => {
  assert.equal(GALLERY_DESIGNS.length, 14);
  assert.equal(new Set(GALLERY_DESIGNS.map((design) => design.id)).size, 14);
  assert.ok(GALLERY_DESIGNS.every((design) => design.categoryId === "bohra"));

  for (const design of GALLERY_DESIGNS) {
    assert.ok(design.name && design.description);
    assert.ok(GALLERY_STYLES.some((style) => style.id === design.style));
    assert.ok(GALLERY_COLORS.some((color) => color.id === design.color));
  }
});

test("all designs display by default; search ignores case", () => {
  assert.equal(filterGalleryDesigns().length, 14);
  assert.deepEqual(filterGalleryDesigns({ search: "RUBY" }).map((design) => design.id), [
    "rubyVelvet",
  ]);
  assert.deepEqual(filterGalleryDesigns({ search: "   sapphire  " }).map((design) => design.id), [
    "sapphireSilver",
  ]);
});

test("community, style and color filters compose safely", () => {
  assert.deepEqual(
    filterGalleryDesigns({ category: "bohra", style: "royal", color: "blue" })
      .map((design) => design.id),
    ["midnightNavy", "sapphireSilver"]
  );
  assert.equal(filterGalleryDesigns({ category: "hindu" }).length, 0);
  assert.equal(filterGalleryDesigns({ category: "christian" }).length, 0);
  assert.equal(filterGalleryDesigns({ color: "unknown" }).length, 0);
  assert.equal(filterGalleryDesigns({ search: "not-a-theme" }).length, 0);
});

test("only valid themes can be selected; gallery does not change legacy routing", () => {
  assert.equal(getGalleryDesignByTheme("rubyVelvet")?.id, "rubyVelvet");
  assert.equal(getGalleryDesignByTheme("whiteRoseGold"), null);
  assert.equal(getGalleryDesignByTheme("javascript:alert(1)"), null);

  for (const design of GALLERY_DESIGNS) {
    assert.equal(resolveInvitationDesignEngine({ theme: design.id }), "legacy");
  }
});
