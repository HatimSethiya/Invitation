const path = require("path");

const uploadImageFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select an image.",
    });
  }

  const relativePath = `/uploads/${path.basename(req.file.filename)}`;
  const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;

  return res.status(201).json({
    success: true,
    message: "Image uploaded successfully.",
    url: `${baseUrl}${relativePath}`,
    path: relativePath,
    filename: req.file.filename,
  });
};

module.exports = { uploadImageFile };
