const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const musicRoutes = require("./routes/musicRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const { getUploadedImageFile } = require("./controllers/imageGridFsController");
const seedAdmin = require("./services/adminSeed");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/uploads/:filename", getUploadedImageFile);

app.use("/api/auth", authRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/uploads", uploadRoutes);

// In production, serve the Vite build from the same origin as the API.
const frontendDistPath = path.join(__dirname, "../frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

app.use((req, res, next) => {
  const isApiRequest = req.path === "/api" || req.path.startsWith("/api/");
  const isUploadRequest = req.path === "/uploads" || req.path.startsWith("/uploads/");

  if (req.method !== "GET" || isApiRequest || isUploadRequest) {
    return next();
  }

  if (!fs.existsSync(frontendIndexPath)) {
    return res.status(404).json({
      success: false,
      message: "Frontend is hosted separately from this API.",
    });
  }

  return res.sendFile(frontendIndexPath, (error) => {
    if (error) next(error);
  });
});

const startServer = async () => {
  await connectDB();
  await seedAdmin();

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Server startup failed:", error);
    process.exit(1);
  });
}

module.exports = { app, startServer, connectDB, seedAdmin };
