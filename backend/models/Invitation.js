const mongoose = require("mongoose");

const coupleSchema = new mongoose.Schema(
  {
    brideName: { type: String, trim: true, default: "" },
    groomName: { type: String, trim: true, default: "" },
    bridePhoto: { type: String, default: "" },
    groomPhoto: { type: String, default: "" },
    couplePhoto: { type: String, default: "" },
    brideBio: { type: String, trim: true, default: "" },
    groomBio: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    date: { type: Date },
    time: { type: String, trim: true, default: "" },
    venue: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    mapUrl: { type: String, trim: true, default: "" },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const familySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    relation: { type: String, trim: true, default: "" },
    side: { type: String, enum: ["bride", "groom", "other"], default: "other" },
    photo: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const storySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    content: { type: String, trim: true, default: "" },
    image: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const gallerySchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    caption: { type: String, trim: true, default: "" },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    latitude: { type: Number },
    longitude: { type: Number },
    mapUrl: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const musicSchema = new mongoose.Schema(
  {
    audioUrl: { type: String, default: "" },
    title: { type: String, trim: true, default: "" },
    autoplay: { type: Boolean, default: false },
    loop: { type: Boolean, default: true },
  },
  { _id: false }
);

const invitationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    weddingDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    theme: {
      type: String,
      default: "royalRose",
      trim: true,
    },
    couple: {
      type: coupleSchema,
      default: () => ({}),
    },
    events: {
      type: [eventSchema],
      default: [],
    },
    family: {
      type: [familySchema],
      default: [],
    },
    story: {
      type: [storySchema],
      default: [],
    },
    gallery: {
      type: [gallerySchema],
      default: [],
    },
    venue: {
      type: venueSchema,
      default: () => ({}),
    },
    music: {
      type: musicSchema,
      default: () => ({}),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invitation", invitationSchema);
