// middleware/slackMiddleware.js

/**
 * Middleware to verify Slack requests
 * Note: In a production environment, you should implement proper
 * signature verification using the Slack signing secret
 */
async function verifySlackRequest(req, res, next) {
  try {
    // In a production environment, you would verify the request signature here
    // using crypto.timingSafeEqual and the Slack signing secret

    // For now, we'll just pass through for simplicity
    // This should be replaced with proper verification in production
    req.slackBody = req.body;
    next();
  } catch (error) {
    console.error("Error verifying Slack request:", error);
    return res.status(401).json({ error: "Invalid request" });
  }
}

/**
 * Parse interactive payload from Slack
 */
function parseInteractivePayload(req, res, next) {
  try {
    if (req.body && req.body.payload) {
      req.slackPayload = JSON.parse(req.body.payload);
    }
    next();
  } catch (error) {
    console.error("Error parsing interactive payload:", error);
    return res.status(400).json({ error: "Invalid payload" });
  }
}

module.exports = {
  verifySlackRequest,
  parseInteractivePayload,
};
