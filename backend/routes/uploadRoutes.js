const express = require("express");
const { uploadAudioFile, getUploadedAudioFile } = require("../controllers/uploadController");
const { uploadImageFile, getUploadedImageFile } = require("../controllers/imageGridFsController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const { uploadImage, audioUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public playback endpoints: GridFS keeps uploaded media available between deploys.
router.get("/audio/:id", getUploadedAudioFile);
router.get("/image/:filename", getUploadedImageFile);

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
