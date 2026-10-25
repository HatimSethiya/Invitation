const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9-_]/gi, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${baseName || "image"}${extension}`);
  },
});

const imageFilter = (_req, file, callback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!allowedTypes.includes(file.mimetype)) {
    return callback(new Error("Only JPG, PNG, WEBP and GIF images are allowed."));
  }

  callback(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const audioExtensions = new Set([".mp3", ".mpeg", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm"]);
const audioMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "video/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "application/ogg",
  "audio/aac",
  "audio/flac",
  "audio/x-flac",
  "audio/webm",
  "application/octet-stream",
]);

const audioFilter = (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const isMpegMimeAlias = extension === ".mpeg" && file.mimetype === "video/mpeg";

  if (!audioExtensions.has(extension) || (file.mimetype && !audioMimeTypes.has(file.mimetype) && !isMpegMimeAlias)) {
    return callback(new Error("Choose an MP3/MPEG, WAV, OGG, M4A, AAC, FLAC or WebM audio file."));
  }

  return callback(null, true);
};

const audioUpload = multer({
  storage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

module.exports = { uploadImage, audioUpload };
