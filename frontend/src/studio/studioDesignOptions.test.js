import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_STUDIO_DESIGN,
  STUDIO_BACKGROUND_OPTIONS,
  STUDIO_FONT_OPTIONS,
  STUDIO_PALETTE_OPTIONS,
  STUDIO_SECTION_OPTIONS,
  normalizeStudioDesign,
} from "./studioDesignOptions.js";

test("all available design presets have stable unique identifiers", () => {
  const optionSets = [
    STUDIO_FONT_OPTIONS,
    STUDIO_PALETTE_OPTIONS,
    STUDIO_BACKGROUND_OPTIONS,
    STUDIO_SECTION_OPTIONS,
  ];
  assert.deepEqual(optionSets.map((options) => options.length), [5, 6, 4, 5]);

  for (const options of optionSets) {
    assert.equal(new Set(options.map((option) => option.id)).size, options.length);
  }
});

test("existing drafts without design settings preserve the original appearance", () => {
  assert.deepEqual(normalizeStudioDesign(), DEFAULT_STUDIO_DESIGN);
  assert.deepEqual(normalizeStudioDesign(null), DEFAULT_STUDIO_DESIGN);
  assert.deepEqual(normalizeStudioDesign({}), DEFAULT_STUDIO_DESIGN);
  assert.equal(normalizeStudioDesign({ sections: { heading: false } }).sections.heading, false);
  assert.equal(normalizeStudioDesign({ sections: { heading: false } }).sections.dateVenue, true);
});

test("valid customizations survive normalize without unknown properties", () => {
  const design = normalizeStudioDesign({
    font: "editorial",
    palette: "lavender",
    background: "glow",
    sections: {
      heading: false,
      family: false,
      message: true,
      dateVenue: true,
      schedule: false,
      injectedSection: true,
    },
    unsafeCss: "background: url(javascript:bad)",
  });

  assert.deepEqual(design, {
    font: "editorial",
    palette: "lavender",
    background: "glow",
    sections: {
      heading: false,
      family: false,
      message: true,
      dateVenue: true,
      schedule: false,
    },
  });
  assert.equal("unsafeCss" in design, false);
});

test("unsupported or malformed options fall back safely on the frontend", () => {
  const normalized = normalizeStudioDesign({
    font: "malicious",
    palette: "custom-hex",
    background: "url(https://example.com/evil.png)",
    sections: { message: "false", family: false },
  });

  assert.equal(normalized.font, "original");
  assert.equal(normalized.palette, "original");
  assert.equal(normalized.background, "original");
  assert.equal(normalized.sections.message, true);
  assert.equal(normalized.sections.family, false);
});
