const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const musicRoutes = require("./routes/musicRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const seedAdmin = require("./services/adminSeed");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/uploads", uploadRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Wedding Invitation API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

// In production, serve the Vite build from the same origin as the API.
// This keeps public invitation routes and API calls working on one hosted URL.
const frontendDistPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDistPath));

app.use((req, res, next) => {
  const isApiRequest = req.path === "/api" || req.path.startsWith("/api/");
  const isUploadRequest = req.path === "/uploads" || req.path.startsWith("/uploads/");

  if (req.method !== "GET" || isApiRequest || isUploadRequest) {
    return next();
  }

  return res.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
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

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
