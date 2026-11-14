const express = require("express");
const {
  getAdminInvitations,
  getAdminInvitation,
  createInvitation,
  updateInvitation,
  deleteInvitation,
  updateInvitationStatus,
  updateInvitationTheme,
  unlockInvitation,
  getPublicInvitation,
} = require("../controllers/invitationController");
const { protect, requireAdmin, requireInvitationUnlock } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/public/:slug", getPublicInvitation);

router.use(protect, requireAdmin);

router.get("/", getAdminInvitations);
router.post("/:id/unlock", unlockInvitation);
router.get("/:id", requireInvitationUnlock, getAdminInvitation);
router.post("/", createInvitation);
router.put("/:id", requireInvitationUnlock, updateInvitation);
router.patch("/:id/status", requireInvitationUnlock, updateInvitationStatus);
router.patch("/:id/theme", requireInvitationUnlock, updateInvitationTheme);
router.delete("/:id", requireInvitationUnlock, deleteInvitation);

module.exports = router;
