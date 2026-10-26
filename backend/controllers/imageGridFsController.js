const path = require("path");
const mongoose = require("mongoose");

function getImageBucket() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB is not ready to store images.");
  }

  return new mongoose.mongo.GridFSBucket(db, { bucketName: "imageUploads" });
}

const uploadImageFile = async (req, res) => {
  if (!req.file?.buffer || !req.file.originalname) {
    return res.status(400).json({
      success: false,
      message: "Please select an image.",
    });
  }

  try {
    const extension = path.extname(req.file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(req.file.originalname, extension)
      .replace(/[^a-z0-9-_]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase() || "image";
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBaseName}${extension}`;
    const bucket = getImageBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date(),
      },
    });

    await new Promise((resolve, reject) => {
      uploadStream.once("finish", resolve);
      uploadStream.once("error", reject);
      uploadStream.end(req.file.buffer);
    });

    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const relativePath = `/uploads/${filename}`;

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      url: `${baseUrl}${relativePath}`,
      path: relativePath,
      filename,
    });
  } catch (error) {
    console.error("Image upload failed:", error);
    return res.status(500).json({
      success: false,
      message: "Could not save the image. Please retry the upload.",
    });
  }
};

const getUploadedImageFile = async (req, res) => {
  if (!mongoose.connection.db) {
    return res.status(503).end();
  }

  try {
    const bucket = getImageBucket();
    const files = await bucket.find({ filename: req.params.filename }).limit(1).toArray();
    const file = files[0];

    if (!file) {
      return res.status(404).end();
    }

    res.set({
      "Content-Type": file.contentType || "application/octet-stream",
      "Content-Length": String(file.length),
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    });

    const stream = bucket.openDownloadStream(file._id);
    stream.on("error", (error) => {
      console.error("Image stream failed:", error);
      if (!res.headersSent) res.status(500).end();
      else res.destroy(error);
    });
    return stream.pipe(res);
  } catch (error) {
    console.error("Image retrieval failed:", error);
    if (!res.headersSent) return res.status(500).end();
    return res.destroy(error);
  }
};

module.exports = { uploadImageFile, getUploadedImageFile };
