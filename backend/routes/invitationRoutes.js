const express = require("express");
const {
  getAdminInvitations,
  getAdminInvitation,
  createInvitation,
  updateInvitation,
  deleteInvitation,
  updateInvitationStatus,
  getPublicInvitation,
} = require("../controllers/invitationController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/public/:slug", getPublicInvitation);

router.use(protect, requireAdmin);

router.get("/", getAdminInvitations);
router.get("/:id", getAdminInvitation);
router.post("/", createInvitation);
router.put("/:id", updateInvitation);
router.patch("/:id/status", updateInvitationStatus);
router.delete("/:id", deleteInvitation);

module.exports = router;
