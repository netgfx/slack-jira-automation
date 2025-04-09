// config/env.js
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Configuration object
const config = {
  port: process.env.PORT || 3000,
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
  },
  jira: {
    host: process.env.JIRA_HOST,
    username: process.env.JIRA_USERNAME,
    apiToken: process.env.JIRA_API_TOKEN,
  },
};

module.exports = config;
