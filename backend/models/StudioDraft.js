const mongoose = require("mongoose");

const studioEventSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 100, default: "" },
    date: { type: String, trim: true, maxlength: 10, default: "" },
    time: { type: String, trim: true, maxlength: 40, default: "" },
    venue: { type: String, trim: true, maxlength: 160, default: "" },
  },
  { _id: false }
);

/**
 * Completely separate from Invitation: legacy published cards and their
 * passwords/routes/rendering are never migrated into Studio drafts.
 *
 * Phase 4 drafts have no public slug or publish status. Public sharing will
 * be introduced only after its dedicated renderer and authorization tests.
 */
const studioDraftSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    templateId: { type: String, required: true, trim: true, maxlength: 80 },
    templateVersion: { type: Number, required: true, default: 1, enum: [1] },
    partner1: { type: String, trim: true, maxlength: 120, default: "" },
    partner2: { type: String, trim: true, maxlength: 120, default: "" },
    heading: { type: String, trim: true, maxlength: 160, default: "" },
    familyLine: { type: String, trim: true, maxlength: 300, default: "" },
    message: { type: String, trim: true, maxlength: 800, default: "" },
    weddingDate: { type: String, trim: true, maxlength: 10, default: "" },
    venue: {
      name: { type: String, trim: true, maxlength: 160, default: "" },
      address: { type: String, trim: true, maxlength: 360, default: "" },
    },
    events: { type: [studioEventSchema], default: [] },
    passwordHash: { type: String, required: true, select: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, result) {
        delete result.passwordHash;
        return result;
      },
    },
  }
);

module.exports = mongoose.model("StudioDraft", studioDraftSchema);
