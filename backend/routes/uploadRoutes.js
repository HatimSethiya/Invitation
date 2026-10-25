const express = require("express");
const { uploadImageFile, uploadAudioFile } = require("../controllers/uploadController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const { uploadImage, audioUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
  "/image",
  protect,
  requireAdmin,
  uploadImage.single("image"),
  uploadImageFile
);

router.post("/audio", protect, requireAdmin, (req, res) => {
  audioUpload.single("audio")(req, res, (error) => {
    if (error) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({
        success: false,
        message: error.message || "Unable to upload audio file.",
      });
    }

    return uploadAudioFile(req, res);
  });
});

module.exports = router;
