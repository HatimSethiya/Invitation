const express = require("express");
const { getInstrumentalCatalog } = require("../controllers/musicController");

const router = express.Router();

router.get("/catalog", getInstrumentalCatalog);

module.exports = router;
