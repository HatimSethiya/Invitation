const express = require("express");
const { uploadImageFile } = require("../controllers/uploadController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const { uploadImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
  "/image",
  protect,
  requireAdmin,
  uploadImage.single("image"),
  uploadImageFile
);

module.exports = router;
