const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const StudioDraft = require("../models/StudioDraft");
const {
  STUDIO_TEMPLATE_IDS,
  DraftValidationError,
  validateDraftPayload,
  isValidDraftPassword,
} = require("../utils/studioDraftValidation");

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
    if (!isValidDraftPassword(password)) {
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
