const Invitation = require("../models/Invitation");

const normalizeSlug = (value = "") =>
  value.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const uniqueSlug = async (value, excludeId = null) => {
  const base = normalizeSlug(value) || `invitation-${Date.now()}`;
  let slug = base;
  let counter = 2;
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    if (!(await Invitation.exists(query))) return slug;
    slug = `${base}-${counter++}`;
  }
};

const getAdminInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ createdBy: req.user.id }).sort({ createdAt: -1 }).lean();
    const stats = {
      total: invitations.length,
      published: invitations.filter((item) => item.status === "published").length,
      drafts: invitations.filter((item) => item.status === "draft").length,
      archived: invitations.filter((item) => item.status === "archived").length,
    };
    return res.json({ success: true, stats, invitations });
  } catch (error) {
    console.error("Get invitations error:", error);
    return res.status(500).json({ success: false, message: "Failed to load invitations." });
  }
};

const getAdminInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!invitation) return res.status(404).json({ success: false, message: "Invitation not found." });
    return res.json({ success: true, invitation });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load invitation." });
  }
};

const createInvitation = async (req, res) => {
  try {
    const { title, slug, weddingDate, status, theme, couple, events, family, story, gallery, venue, music } = req.body;
    if (!title?.trim() || !weddingDate) {
      return res.status(400).json({ success: false, message: "Title and wedding date are required." });
    }

    const invitation = await Invitation.create({
      title: title.trim(),
      slug: await uniqueSlug(slug || title),
      weddingDate,
      status,
      theme,
      couple,
      events,
      family,
      story,
      gallery,
      venue,
      music,
      createdBy: req.user.id,
    });

    return res.status(201).json({ success: true, invitation });
  } catch (error) {
    console.error("Create invitation error:", error);
    return res.status(500).json({ success: false, message: "Failed to create invitation." });
  }
};

const updateInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!invitation) return res.status(404).json({ success: false, message: "Invitation not found." });

    const { title, slug, weddingDate, status, theme, couple, events, family, story, gallery, venue, music } = req.body;
    if (title !== undefined) invitation.title = title.trim();
    if (weddingDate !== undefined) invitation.weddingDate = weddingDate;
    if (slug !== undefined && slug.trim() !== invitation.slug) invitation.slug = await uniqueSlug(slug, invitation._id);
    if (status !== undefined) invitation.status = status;
    if (theme !== undefined) invitation.theme = theme;
    if (couple !== undefined) invitation.couple = couple;
    if (events !== undefined) invitation.events = events;
    if (family !== undefined) invitation.family = family;
    if (story !== undefined) invitation.story = story;
    if (gallery !== undefined) invitation.gallery = gallery;
    if (venue !== undefined) invitation.venue = venue;
    if (music !== undefined) invitation.music = music;

    await invitation.save();
    return res.json({ success: true, invitation });
  } catch (error) {
    console.error("Update invitation error:", error);
    return res.status(500).json({ success: false, message: "Failed to update invitation." });
  }
};

const deleteInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!invitation) return res.status(404).json({ success: false, message: "Invitation not found." });
    return res.json({ success: true, message: "Invitation deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete invitation." });
  }
};

const updateInvitationStatus = async (req, res) => {
  try {
    const allowed = ["draft", "published", "archived"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid invitation status." });

    const invitation = await Invitation.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!invitation) return res.status(404).json({ success: false, message: "Invitation not found." });
    return res.json({ success: true, invitation });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update invitation status." });
  }
};

const getPublicInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ slug: req.params.slug.toLowerCase(), status: "published" }).lean();
    if (!invitation) return res.status(404).json({ success: false, message: "Invitation not found." });
    return res.json({ success: true, invitation });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load invitation." });
  }
};

module.exports = {
  getAdminInvitations,
  getAdminInvitation,
  createInvitation,
  updateInvitation,
  deleteInvitation,
  updateInvitationStatus,
  getPublicInvitation,
};
