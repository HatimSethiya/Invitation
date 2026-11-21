const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const StudioDraft = require("../models/StudioDraft");

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
  const parsed = new Date(Date.UTC(year, month - 1, day));
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
  };
}

function signDraftUnlock(req, draftId) {
  return jwt.sign(
    { id: req.user.id, studioDraftId: draftId.toString(), type: "studio_draft_unlock" },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function requireDraftUnlock(req, res, next) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid draft identifier." });
  }

  const token = req.get("X-Studio-Draft-Unlock");
  if (!token) {
    return res.status(423).json({ success: false, message: "Unlock this draft using its password." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (
      payload.type !== "studio_draft_unlock"
      || payload.studioDraftId !== req.params.id
      || payload.id !== req.user.id
    ) {
      return res.status(423).json({ success: false, message: "Draft unlock is invalid." });
    }
    return next();
  } catch {
    return res.status(423).json({ success: false, message: "Draft unlock has expired. Unlock again." });
  }
}

async function listStudioDrafts(req, res) {
  try {
    // Only metadata: locked drafts must not leak names, venue or event details.
    const drafts = await StudioDraft.find({ createdBy: req.user.id })
      .select("_id templateId templateVersion updatedAt")
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    return res.json({ success: true, drafts });
  } catch (error) {
    console.error("List studio drafts error:", error);
    return res.status(500).json({ success: false, message: "Unable to load studio drafts." });
  }
}

async function createStudioDraft(req, res) {
  try {
    const { templateId, templateVersion, password } = req.body || {};
    if (!STUDIO_TEMPLATE_IDS.has(templateId) || templateVersion !== 1) {
      return res.status(400).json({ success: false, message: "Choose a supported wedding design." });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
      return res.status(400).json({ success: false, message: "Set a password of 8–72 characters." });
    }

    const details = validateDraftPayload(req.body);
    const passwordHash = await bcrypt.hash(password, 12);
    const draft = await StudioDraft.create({
      templateId,
      templateVersion: 1,
      ...details,
      passwordHash,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      draft,
      unlockToken: signDraftUnlock(req, draft._id),
    });
  } catch (error) {
    if (error instanceof DraftValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Create studio draft error:", error);
    return res.status(500).json({ success: false, message: "Unable to save the draft." });
  }
}

async function unlockStudioDraft(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid draft identifier." });
  }
  if (typeof req.body?.password !== "string" || !req.body.password) {
    return res.status(400).json({ success: false, message: "Enter your draft password." });
  }

  try {
    const draft = await StudioDraft.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).select("+passwordHash");

    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found." });
    }
    if (!(await bcrypt.compare(req.body.password, draft.passwordHash))) {
      return res.status(401).json({ success: false, message: "Incorrect draft password." });
    }

    return res.json({
      success: true,
      unlockToken: signDraftUnlock(req, draft._id),
    });
  } catch (error) {
    console.error("Unlock studio draft error:", error);
    return res.status(500).json({ success: false, message: "Unable to unlock the draft." });
  }
}

async function getStudioDraft(req, res) {
  try {
    const draft = await StudioDraft.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!draft) return res.status(404).json({ success: false, message: "Draft not found." });
    return res.json({ success: true, draft });
  } catch (error) {
    console.error("Read studio draft error:", error);
    return res.status(500).json({ success: false, message: "Unable to load the draft." });
  }
}

async function updateStudioDraft(req, res) {
  try {
    const draft = await StudioDraft.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });
    if (!draft) return res.status(404).json({ success: false, message: "Draft not found." });

    // Template selection is immutable for a saved draft. No mass assignment.
    const details = validateDraftPayload(req.body);
    draft.set(details);
    await draft.save();

    return res.json({ success: true, draft });
  } catch (error) {
    if (error instanceof DraftValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Update studio draft error:", error);
    return res.status(500).json({ success: false, message: "Unable to update the draft." });
  }
}

module.exports = {
  listStudioDrafts,
  createStudioDraft,
  unlockStudioDraft,
  requireDraftUnlock,
  getStudioDraft,
  updateStudioDraft,
};
