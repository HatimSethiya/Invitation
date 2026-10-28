const mongoose = require("mongoose");

const coupleSchema = new mongoose.Schema(
  {
    brideName: { type: String, trim: true, default: "" },
    groomName: { type: String, trim: true, default: "" },
    nameOrder: { type: String, enum: ["brideFirst", "groomFirst"], default: "groomFirst" },
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
    audioUrl: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    artist: { type: String, trim: true, default: "" },
    provider: { type: String, enum: ["", "jamendo", "internet-archive", "custom"], default: "" },
    trackId: { type: String, trim: true, default: "" },
    shareUrl: { type: String, trim: true, default: "" },
    licenseUrl: { type: String, trim: true, default: "" },
    attribution: { type: String, trim: true, default: "" },
    autoplay: { type: Boolean, default: false },
    loop: { type: Boolean, default: true },
  },
  { _id: false }
);

const firstNikahSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true, default: "First Nikah Ceremony" },
    officiant: { type: String, trim: true, default: "" },
    hijriDate: { type: String, trim: true, default: "" },
    time: { type: String, trim: true, default: "" },
    venue: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const bohraDetailsSchema = new mongoose.Schema(
  {
    openingBlessing: { type: String, trim: true, default: "With The Grace of Allah & Panjatan Pak (AS)" },
    razaDuaLine: { type: String, trim: true, default: "With Raza & Dua Mubarak of" },
    spiritualLeader: { type: String, trim: true, default: "Aqa Maula Syedna Mufaddal Saifuddin (TUS)" },
    hostFamilyOne: { type: String, trim: true, default: "" },
    hostBridge: { type: String, trim: true, default: "Thereafter" },
    hostFamilyTwo: { type: String, trim: true, default: "" },
    invitationWording: { type: String, trim: true, default: "Cordially Invite & Request The Honor Of Your Presence To Grace The Wedding Ceremony Of Their Grand Son" },
    brideFamilyLine: { type: String, trim: true, default: "" },
    nikahOfficiantIntro: { type: String, trim: true, default: "Nikah Solemnised On The Hand Mubarak Of His Holiness" },
    nikahOfficiant: { type: String, trim: true, default: "" },
    programmeHeading: { type: String, trim: true, default: "Programme Inshallah" },
    programmeTitle: { type: String, trim: true, default: "Daris & Dinner" },
    hijriDate: { type: String, trim: true, default: "" },
    programmeTime: { type: String, trim: true, default: "" },
    programmeVenue: { type: String, trim: true, default: "" },
    invitees: { type: String, trim: true, default: "" },
    complimentsFrom: { type: String, trim: true, default: "" },
    specialRequest: { type: String, trim: true, default: "" },
    heavenlyBlessings: { type: String, trim: true, default: "" },
    senderName: { type: String, trim: true, default: "" },
    senderFirm: { type: String, trim: true, default: "" },
    senderAddress: { type: String, trim: true, default: "" },
    senderContacts: { type: String, trim: true, default: "" },
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
      enum: ["draft", "published", "paused", "archived"],
      default: "draft",
      index: true,
    },
    theme: {
      type: String,
      default: "royalRose",
      trim: true,
    },
    cardType: {
      type: String,
      enum: ["single", "double"],
      default: "single",
    },
    coverImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    secondCouple: {
      type: coupleSchema,
      default: () => ({}),
    },
    firstNikah: {
      type: firstNikahSchema,
      default: () => ({}),
    },
    couple: {
      type: coupleSchema,
      default: () => ({}),
    },
    bohraDetails: {
      type: bohraDetailsSchema,
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
