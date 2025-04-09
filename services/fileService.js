// services/fileService.js
const slackService = require("./slackService");
const jiraService = require("./jiraService");

class FileService {
  /**
   * Process and attach files from Slack to a Jira issue
   * @param {Array} files - Array of file objects from Slack
   * @param {string} issueKey - Jira issue key
   * @returns {Promise<Array>} - Array of attachment results
   */
  async processAndAttachFiles(files, issueKey) {
    const results = [];

    if (!files || files.length === 0) {
      console.log("No files to attach");
      return results;
    }

    console.log(
      `Processing ${files.length} files for attachment to ${issueKey}`
    );

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name} (${file.id})`);

        // Download file from Slack
        const fileBuffer = await slackService.downloadFile(file.url_private);

        // Attach to Jira issue
        const attachmentResult = await jiraService.attachFileToIssue(
          issueKey,
          fileBuffer,
          file.name,
          file.mimetype
        );

        console.log(
          `Successfully attached ${file.name} to Jira issue ${issueKey}`
        );
        results.push({
          fileId: file.id,
          fileName: file.name,
          success: true,
          data: attachmentResult,
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        results.push({
          fileId: file.id,
          fileName: file.name,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = new FileService();
