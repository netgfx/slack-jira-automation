// services/slackService.js
const axios = require("axios");
const config = require("../config/env");

class SlackService {
  constructor() {
    this.token = config.slack.botToken;
  }

  /**
   * Get headers for Slack API requests
   * @returns {Object} - Headers object
   */
  getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Open a modal in Slack
   * @param {string} triggerId - Trigger ID
   * @param {Object} viewPayload - View payload
   * @returns {Promise<Object>} - Modal open response
   */
  async openModal(triggerId, viewPayload) {
    try {
      const response = await axios.post(
        "https://slack.com/api/views.open",
        {
          trigger_id: triggerId,
          view: viewPayload,
        },
        { headers: this.getHeaders() }
      );

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data;
    } catch (error) {
      console.error("Error opening Slack modal:", error);
      throw error;
    }
  }

  /**
   * Get user information from Slack
   * @param {string} userId - Slack user ID
   * @returns {Promise<Object>} - User data
   */
  async getUserInfo(userId) {
    try {
      const response = await axios.get(
        `https://slack.com/api/users.info?user=${userId}`,
        { headers: this.getHeaders() }
      );

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data.user;
    } catch (error) {
      console.error("Error getting Slack user info:", error);
      throw error;
    }
  }

  /**
   * Download a file from Slack
   * @param {string} fileUrl - File URL
   * @returns {Promise<Buffer>} - File buffer
   */
  async downloadFile(fileUrl) {
    try {
      const response = await axios.get(fileUrl, {
        headers: { Authorization: `Bearer ${this.token}` },
        responseType: "arraybuffer",
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error("Error downloading file from Slack:", error);
      throw error;
    }
  }

  /**
   * Send a message to a Slack channel
   * @param {string} channelId - Channel ID
   * @param {string} text - Message text
   * @returns {Promise<Object>} - Send message response
   */
  async sendMessage(channelId, text) {
    try {
      const response = await axios.post(
        "https://slack.com/api/chat.postMessage",
        {
          channel: channelId,
          text: text,
        },
        { headers: this.getHeaders() }
      );

      if (!response.data.ok) {
        throw new Error(`Slack API error: ${response.data.error}`);
      }

      return response.data;
    } catch (error) {
      console.error("Error sending Slack message:", error);
      throw error;
    }
  }
}

module.exports = new SlackService();
