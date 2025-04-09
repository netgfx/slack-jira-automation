// routes/index.js
const express = require("express");
const router = express.Router();
const slackRoutes = require("./slackRoutes");
const slackController = require("../controllers/slackController");

// Root endpoint for health check
router.get("/", slackController.handleHealthCheck);

// Mount Slack routes
router.use("/slack", slackRoutes);

module.exports = router;
