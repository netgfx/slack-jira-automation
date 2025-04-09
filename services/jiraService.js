// services/jiraService.js
const axios = require("axios");
const { Buffer } = require("buffer");
const config = require("../config/env");

class JiraService {
  constructor() {
    this.host = config.jira.host;
    this.username = config.jira.username;
    this.apiToken = config.jira.apiToken;
    this.authHeader = `Basic ${Buffer.from(
      `${this.username}:${this.apiToken}`
    ).toString("base64")}`;
  }

  /**
   * Get headers for Jira API requests
   * @param {boolean} isFormData - Whether the request is form data
   * @returns {Object} - Headers object
   */
  getHeaders(isFormData = false) {
    const headers = {
      Authorization: this.authHeader,
      Accept: "application/json",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    } else {
      headers["X-Atlassian-Token"] = "no-check";
    }

    return headers;
  }

  /**
   * Test Jira authentication
   * @returns {Promise<Object>} - Authentication status
   */
  async testAuth() {
    try {
      const response = await axios.get(
        `https://${this.host}/rest/api/3/myself`,
        { headers: this.getHeaders() }
      );
      return { status: response.status, success: true };
    } catch (error) {
      console.error("Jira auth test failed:", error);
      throw error;
    }
  }

  /**
   * Fetch issue types from Jira
   * @returns {Promise<Array>} - List of issue types formatted for Slack dropdowns
   */
  async fetchIssueTypes() {
    try {
      const response = await axios.get(
        `https://${this.host}/rest/api/3/issuetype`,
        { headers: this.getHeaders() }
      );

      console.log("Issue types:", response.data);

      return response.data.map((option) => ({
        text: {
          type: "plain_text",
          text: option.name,
        },
        value: option.id,
      }));
    } catch (error) {
      console.error("Error fetching issue types:", error);
      return [];
    }
  }

  /**
   * Fetch projects from Jira
   * @returns {Promise<Array>} - List of projects
   */
  async fetchProjects() {
    try {
      const response = await axios.get(
        `https://${this.host}/rest/api/3/project`,
        { headers: this.getHeaders() }
      );

      return response.data.map((project) => ({
        id: project.id,
        key: project.key,
        name: project.name,
      }));
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  }

  /**
   * Fetch priorities from Jira
   * @returns {Promise<Array>} - List of priorities
   */
  async fetchPriorities() {
    try {
      const response = await axios.get(
        `https://${this.host}/rest/api/3/priority`,
        { headers: this.getHeaders() }
      );

      return response.data.map((p) => ({ id: p.id, name: p.name }));
    } catch (error) {
      console.error("Error fetching priorities:", error);
      return [];
    }
  }

  /**
   * Get issue creation metadata for a project
   * @param {string} projectKey - Project key
   * @returns {Promise<Object>} - Issue creation metadata
   */
  async getIssueCreateMeta(projectKey) {
    try {
      const response = await axios.get(
        `https://${this.host}/rest/api/3/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching issue creation metadata:", error);
      throw error;
    }
  }

  /**
   * Find Jira user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - Jira user or null
   */
  async findUserByEmail(email) {
    try {
      const response = await axios.get(
        `https://${this.host}/rest/api/3/user/search?query=${encodeURIComponent(
          email
        )}`,
        { headers: this.getHeaders() }
      );

      if (response.data && response.data.length > 0) {
        return response.data[0];
      }
      return null;
    } catch (error) {
      console.error("Error finding Jira user:", error);
      return null;
    }
  }

  /**
   * Create a new issue in Jira
   * @param {Object} issueData - Issue data
   * @returns {Promise<Object>} - Created issue data
   */
  async createIssue(issueData) {
    try {
      const response = await axios.post(
        `https://${this.host}/rest/api/3/issue`,
        issueData,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error("Error creating Jira issue:", error);
      throw error;
    }
  }

  /**
   * Attach a file to a Jira issue
   * @param {string} issueKey - Issue key
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} contentType - File content type
   * @returns {Promise<Object>} - Attachment response
   */
  async attachFileToIssue(issueKey, fileBuffer, fileName, contentType) {
    try {
      const FormData = require("form-data");
      const formData = new FormData();

      formData.append("file", fileBuffer, {
        filename: fileName,
        contentType: contentType,
      });

      const response = await axios.post(
        `https://${this.host}/rest/api/3/issue/${issueKey}/attachments`,
        formData,
        {
          headers: {
            ...this.getHeaders(true),
            ...formData.getHeaders(),
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error attaching file ${fileName} to Jira:`, error);
      throw error;
    }
  }

  /**
   * Convert plain text to Atlassian Document Format
   * @param {string} text - Plain text
   * @returns {Object} - ADF object
   */
  convertToADF(text) {
    return {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: text,
            },
          ],
        },
      ],
    };
  }

  /**
   * Map Slack priority to Jira priority ID
   * @param {string} priority - Priority name
   * @returns {string} - Priority ID
   */
  mapPriority(priority) {
    switch (priority) {
      case "High":
        return "2";
      case "Medium":
        return "3";
      case "Low":
        return "4";
      default:
        return "3"; // Default to Medium
    }
  }
}

module.exports = new JiraService();
