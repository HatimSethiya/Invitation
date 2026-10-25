const express = require("express");
const { uploadImageFile, uploadAudioFile, getUploadedAudioFile } = require("../controllers/uploadController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const { uploadImage, audioUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public playback endpoint: GridFS keeps uploaded music available between deploys.
router.get("/audio/:id", getUploadedAudioFile);

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
