const test = require("node:test");
const assert = require("node:assert/strict");
const {
  STUDIO_TEMPLATE_IDS,
  DraftValidationError,
  validateDraftPayload,
  validateStudioDesign,
  isValidDraftPassword,
} = require("../utils/studioDraftValidation");

test("only the twelve registered Studio templates are accepted", () => {
  assert.equal(STUDIO_TEMPLATE_IDS.size, 12);
  assert.equal(STUDIO_TEMPLATE_IDS.has("fatemi-heritage"), true);
  assert.equal(STUDIO_TEMPLATE_IDS.has("chapel-blossom"), true);
  assert.equal(STUDIO_TEMPLATE_IDS.has("modern-editorial"), true);
  assert.equal(STUDIO_TEMPLATE_IDS.has("bohraNikah"), false);
  assert.equal(STUDIO_TEMPLATE_IDS.has("some-unknown-card"), false);
});

test("new Studio cards require an 8 to 72 character password", () => {
  assert.equal(isValidDraftPassword("12345678"), true);
  assert.equal(isValidDraftPassword("a".repeat(72)), true);
  assert.equal(isValidDraftPassword("1234567"), false);
  assert.equal(isValidDraftPassword("b".repeat(73)), false);
  assert.equal(isValidDraftPassword(null), false);
  assert.equal(isValidDraftPassword({ password: "secret" }), false);
});

test("empty and partial drafts remain savable without inventing names or dates", () => {
  const result = validateDraftPayload({});
  assert.equal(result.title, "Untitled Wedding Card");
  assert.equal(result.partner1, "");
  assert.equal(result.partner2, "");
  assert.equal(result.weddingDate, "");
  assert.deepEqual(result.venue, { name: "", address: "" });
  assert.deepEqual(result.events, []);
});

test("normalizes allowed wedding details without saving unapproved fields", () => {
  const result = validateDraftPayload({
    title: "  My Wedding  ",
    partner1: "  First Partner ",
    partner2: " Second Partner ",
    weddingDate: "2028-02-29",
    venue: { name: " Hall ", address: " India " },
    events: [{ title: " Nikah ", date: "2028-02-29", time: "7 PM", venue: " Hall " }],
    createdBy: "injected-owner",
    status: "published",
    passwordHash: "injected-hash",
    templateId: "injected-template",
  });

  assert.equal(result.title, "My Wedding");
  assert.equal(result.partner1, "First Partner");
  assert.equal(result.partner2, "Second Partner");
  assert.equal(result.weddingDate, "2028-02-29");
  assert.equal(result.venue.name, "Hall");
  assert.equal(result.events[0].title, "Nikah");
  assert.equal("createdBy" in result, false);
  assert.equal("status" in result, false);
  assert.equal("passwordHash" in result, false);
  assert.equal("templateId" in result, false);
});

test("invalid calendar dates, field types and event limits are rejected", () => {
  const badDrafts = [
    null,
    [],
    { weddingDate: "2026-02-29" },
    { weddingDate: "2028-02-30" },
    { weddingDate: "2028-13-01" },
    { weddingDate: "2028-01-1" },
    { weddingDate: "2028-01-01T12:00:00Z" },
    { weddingDate: 20281121 },
    { venue: [] },
    { title: "x".repeat(161) },
    { events: Array.from({ length: 9 }, () => ({ title: "Wedding" })) },
    { events: [null] },
    { events: [{ date: "2026-04-31" }] },
    { events: [{ title: 42 }] },
    { familyLine: "x".repeat(301) },
    { message: "x".repeat(801) },
  ];

  for (const draft of badDrafts) {
    assert.throws(
      () => validateDraftPayload(draft),
      DraftValidationError,
      JSON.stringify(draft)?.slice(0, 80)
    );
  }
});

test("existing Phase 4 Studio drafts receive safe original-style defaults", () => {
  const draft = validateDraftPayload({
    title: "Old Private Draft",
    partner1: "One",
    partner2: "Two",
  });

  assert.deepEqual(draft.design, {
    font: "original",
    palette: "original",
    background: "original",
    sections: {
      heading: true,
      family: true,
      message: true,
      dateVenue: true,
      schedule: true,
    },
  });
});

test("valid design presets and section visibility survive draft validation", () => {
  const design = {
    font: "romantic",
    palette: "sage",
    background: "linen",
    sections: {
      heading: false,
      family: true,
      message: false,
      dateVenue: true,
      schedule: false,
    },
    createdBy: "bad-owner",
    unsafeCss: "body{display:none}",
  };

  const draft = validateDraftPayload({ design });
  assert.deepEqual(draft.design, {
    font: "romantic",
    palette: "sage",
    background: "linen",
    sections: {
      heading: false,
      family: true,
      message: false,
      dateVenue: true,
      schedule: false,
    },
  });
  assert.equal("unsafeCss" in draft.design, false);
  assert.equal("createdBy" in draft.design, false);
});

test("invalid arbitrary style IDs and non-boolean section values are rejected", () => {
  const invalidDesigns = [
    null,
    "",
    [],
    "dangerous",
    { font: "url(javascript:alert(1))" },
    { font: 10 },
    { palette: "#999999" },
    { palette: "not-approved" },
    { background: "url(https://unknown.site/image.png)" },
    { background: "none; background-image: url(x)" },
    { sections: [] },
    { sections: null },
    { sections: { heading: "false" } },
    { sections: { message: 0 } },
    { sections: { schedule: "on" } },
  ];

  for (const design of invalidDesigns) {
    assert.throws(
      () => validateStudioDesign(design),
      DraftValidationError,
      JSON.stringify(design)
    );
  }
});
