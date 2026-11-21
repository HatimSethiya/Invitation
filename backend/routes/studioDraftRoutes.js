const express = require("express");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const {
  listStudioDrafts,
  createStudioDraft,
  unlockStudioDraft,
  requireDraftUnlock,
  getStudioDraft,
  updateStudioDraft,
} = require("../controllers/studioDraftController");

const router = express.Router();

// No public draft endpoint: authenticated admins only, with ownership checks.
router.use(protect, requireAdmin);

router.get("/drafts", listStudioDrafts);
router.post("/drafts", createStudioDraft);
router.post("/drafts/:id/unlock", unlockStudioDraft);
router.get("/drafts/:id", requireDraftUnlock, getStudioDraft);
router.put("/drafts/:id", requireDraftUnlock, updateStudioDraft);

module.exports = router;
