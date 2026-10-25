const path = require("path");
const mongoose = require("mongoose");

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

function getCanonicalAudioMimeType(mimeType, fileName) {
  const extension = path.extname(fileName || "").toLowerCase();
  const byExtension = {
    ".mp3": "audio/mpeg",
    ".mpeg": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".aac": "audio/aac",
    ".flac": "audio/flac",
    ".webm": "audio/webm",
  };

  return byExtension[extension] || (
    mimeType === "video/mpeg" ? "audio/mpeg" : mimeType || "application/octet-stream"
  );
}

function getAudioBucket() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB is not ready to store audio.");
  }

  return new mongoose.mongo.GridFSBucket(db, { bucketName: "audioUploads" });
}

const uploadAudioFile = async (req, res) => {
  if (!req.file?.buffer || !req.file.originalname) {
    return res.status(400).json({
      success: false,
      message: "Please select an audio file.",
    });
  }

  try {
    const bucket = getAudioBucket();
    const extension = path.extname(req.file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(req.file.originalname, extension)
      .replace(/[^a-z0-9-_]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase() || "wedding-audio";
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBaseName}${extension}`;
    const mimeType = getCanonicalAudioMimeType(req.file.mimetype, req.file.originalname);

    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimeType,
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

    const relativePath = `/api/uploads/audio/${uploadStream.id.toString()}`;

    return res.status(201).json({
      success: true,
      message: "Audio uploaded successfully.",
      url: relativePath,
      path: relativePath,
      filename,
      mimeType,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Audio upload failed:", error);
    return res.status(500).json({
      success: false,
      message: "Could not save the audio file. Please retry the upload.",
    });
  }
};

const getUploadedAudioFile = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.connection.db) {
    return res.status(404).end();
  }

  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const bucket = getAudioBucket();
    const files = await bucket.find({ _id: fileId }).limit(1).toArray();
    const file = files[0];

    if (!file) {
      return res.status(404).end();
    }

    const contentType = getCanonicalAudioMimeType(
      file.contentType || file.metadata?.mimeType,
      file.filename
    );
    const totalSize = Number(file.length) || 0;

    res.set({
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.filename || "wedding-audio")}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    });

    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      const match = /^bytes=(\\d*)-(\\d*)$/.exec(rangeHeader.trim());
      if (!match || (!match[1] && !match[2])) {
        res.set("Content-Range", `bytes */${totalSize}`);
        return res.status(416).end();
      }

      let start;
      let end;
      if (!match[1]) {
        const suffixLength = Number(match[2]);
        if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
          res.set("Content-Range", `bytes */${totalSize}`);
          return res.status(416).end();
        }
        start = Math.max(totalSize - suffixLength, 0);
        end = totalSize - 1;
      } else {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : totalSize - 1;
      }

      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start < 0 ||
        start >= totalSize ||
        end < start ||
        end >= totalSize
      ) {
        res.set("Content-Range", `bytes */${totalSize}`);
        return res.status(416).end();
      }

      const chunkLength = end - start + 1;
      res.status(206);
      res.set({
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
        "Content-Length": String(chunkLength),
      });

      const stream = bucket.openDownloadStream(fileId, {
        start,
        end: end + 1,
      });
      stream.on("error", (error) => {
        console.error("Audio stream failed:", error);
        if (!res.headersSent) res.status(500).end();
        else res.destroy(error);
      });
      return stream.pipe(res);
    }

    res.set("Content-Length", String(totalSize));
    const stream = bucket.openDownloadStream(fileId);
    stream.on("error", (error) => {
      console.error("Audio stream failed:", error);
      if (!res.headersSent) res.status(500).end();
      else res.destroy(error);
    });
    return stream.pipe(res);
  } catch (error) {
    console.error("Audio playback request failed:", error);
    if (!res.headersSent) return res.status(500).end();
    return res.destroy(error);
  }
};

module.exports = { uploadImageFile, uploadAudioFile, getUploadedAudioFile };
