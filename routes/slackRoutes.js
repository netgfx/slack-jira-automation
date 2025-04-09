// routes/slackRoutes.js
const express = require("express");
const router = express.Router();
const slackController = require("../controllers/slackController");
const {
  verifySlackRequest,
  parseInteractivePayload,
} = require("../middleware/slackMiddleware");

// Handle slash command
router.post(
  "/commands",
  verifySlackRequest,
  slackController.handleSlashCommand
);

// Handle interactive components (modal submissions)
router.post(
  "/interactive",
  verifySlackRequest,
  parseInteractivePayload,
  slackController.handleModalSubmission
);

module.exports = router;
