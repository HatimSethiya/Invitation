const { app, connectDB, seedAdmin } = require("../server");

let initializationPromise;

async function initialize() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await connectDB();
      await seedAdmin();
    })().catch((error) => {
      initializationPromise = undefined;
      throw error;
    });
  }

  return initializationPromise;
}

module.exports = async (req, res) => {
  try {
    await initialize();
    return app(req, res);
  } catch (error) {
    console.error("API initialization failed:", error);
    return res.status(503).json({
      success: false,
      message: "API initialization failed. Check database and environment configuration.",
    });
  }
};
