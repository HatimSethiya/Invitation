import assert from "node:assert/strict";
import test from "node:test";
import {
  STUDIO_CATEGORIES,
  STUDIO_TEMPLATES,
  filterStudioTemplates,
  getStudioTemplate,
  listStudioTemplates,
  resolveInvitationDesignEngine,
} from "./templateCatalog.js";

test("studio categories are complete and stable", () => {
  assert.equal(STUDIO_CATEGORIES.length, 8);
  assert.equal(new Set(STUDIO_CATEGORIES.map(({ id }) => id)).size, 8);

  for (const category of STUDIO_CATEGORIES) {
    assert.ok(category.id && category.name && category.description);
    assert.equal(category.colors.length, 2);
    assert.ok(STUDIO_TEMPLATES.some((template) => template.categoryId === category.id));
  }
});

test("twelve real layout previews have unique stable identifiers and metadata", () => {
  assert.equal(STUDIO_TEMPLATES.length, 12);
  assert.equal(new Set(STUDIO_TEMPLATES.map(({ id }) => id)).size, 12);
  assert.equal(new Set(STUDIO_TEMPLATES.map(({ layout }) => layout)).size, 12);

  for (const template of STUDIO_TEMPLATES) {
    assert.equal(template.version, 1);
    assert.equal(template.status, "preview");
    assert.ok(template.name && template.description && template.style && template.color);
    assert.equal(template.sample.names.length, 2);
    assert.ok(template.sample.heading && template.sample.ceremony);
    assert.equal(getStudioTemplate(template.id, 1), template);
    assert.equal(getStudioTemplate(template.id, 2), null);
  }
});

test("community, search, style and color filters find correct templates", () => {
  assert.equal(listStudioTemplates().length, 12);
  assert.equal(listStudioTemplates("hindu").length, 2);
  assert.equal(listStudioTemplates("regional").length, 3);
  assert.deepEqual(
    filterStudioTemplates({ category: "sikh" }).map(({ id }) => id),
    ["anand-karaj"]
  );
  assert.deepEqual(
    filterStudioTemplates({ category: "hindu", style: "floral", color: "pink" })
      .map(({ id }) => id),
    ["lotus-pichwai"]
  );
  assert.deepEqual(
    filterStudioTemplates({ search: "  GURMU KHI " }).map(({ id }) => id),
    []
  );
  assert.deepEqual(
    filterStudioTemplates({ search: " EMERALD " }).map(({ id }) => id),
    ["emerald-nikah"]
  );
  assert.equal(filterStudioTemplates({ category: "unknown" }).length, 0);
  assert.equal(filterStudioTemplates({ color: "unknown" }).length, 0);
  assert.equal(getStudioTemplate("unknown", 1), null);
});

test("preview-only templates never switch existing cards to a new public renderer", () => {
  const legacyInvitations = [
    null,
    {},
    { theme: "bohraNikah" },
    { theme: "whiteRoseGold", openingAnimation: "envelope" },
    { theme: "purpleWhite", cardType: "double" },
    { studioTemplateId: "non-existent", studioTemplateVersion: 1 },
    { studioTemplateId: "fatemi-heritage", studioTemplateVersion: 1 },
    { studioTemplateId: "mandap-marigold", studioTemplateVersion: 1 },
  ];

  for (const invitation of legacyInvitations) {
    assert.equal(resolveInvitationDesignEngine(invitation), "legacy");
  }

  for (const template of STUDIO_TEMPLATES) {
    assert.equal(
      resolveInvitationDesignEngine({
        studioTemplateId: template.id,
        studioTemplateVersion: template.version,
      }),
      "legacy"
    );
  }
});
