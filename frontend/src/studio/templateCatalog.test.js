import assert from "node:assert/strict";
import test from "node:test";
import {
  STUDIO_CATEGORIES,
  STUDIO_TEMPLATES,
  getStudioTemplate,
  listStudioTemplates,
  resolveInvitationDesignEngine,
} from "./templateCatalog.js";

test("studio category identifiers are unique and stable", () => {
  assert.equal(STUDIO_CATEGORIES.length, 8);
  assert.equal(new Set(STUDIO_CATEGORIES.map((category) => category.id)).size, 8);

  for (const category of STUDIO_CATEGORIES) {
    assert.ok(category.id);
    assert.ok(category.name);
    assert.ok(category.description);
    assert.equal(category.colors.length, 2);
  }
});

test("unfinished card designs are not exposed as ready templates", () => {
  assert.equal(STUDIO_TEMPLATES.length, 0);
  assert.deepEqual(listStudioTemplates(), []);
  assert.deepEqual(listStudioTemplates("bohra"), []);
  assert.equal(getStudioTemplate("non-existent", 1), null);
});

test("existing and unknown invitation templates always use the legacy renderer", () => {
  const invitations = [
    {},
    { theme: "bohraNikah" },
    { theme: "whiteRoseGold", openingAnimation: "envelope" },
    { theme: "purpleWhite", cardType: "double" },
    { studioTemplateId: "not-registered", studioTemplateVersion: 1 },
  ];

  for (const invitation of invitations) {
    assert.equal(resolveInvitationDesignEngine(invitation), "legacy");
  }

  assert.equal(resolveInvitationDesignEngine(null), "legacy");
});
