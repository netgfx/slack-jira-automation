// controllers/slackController.js
const jiraService = require("../services/jiraService");
const slackService = require("../services/slackService");
const fileService = require("../services/fileService");
const SlackTemplateFactory = require("../templates/slackTemplates");
const Helpers = require("../utils/helpers");
const config = require("../config/env");

/**
 * Controller for handling Slack interactions
 */
class SlackController {
  /**
   * Handle slash command
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async handleSlashCommand(req, res) {
    try {
      // Get the trigger ID and channel ID
      const triggerId = req.body.trigger_id;
      const channelId = req.body.channel_id;

      // Store the channel ID in the private_metadata of the modal
      const privateMetadata = JSON.stringify({ channelId });

      // Fetch issue types and projects
      const issueTypes = await jiraService.fetchIssueTypes();
      const projects = await jiraService.fetchProjects();

      // Create modal view
      const viewPayload = SlackTemplateFactory.createQAIssueModal(
        projects,
        issueTypes,
        privateMetadata
      );

      // Open the modal
      await slackService.openModal(triggerId, viewPayload);

      // Immediately respond to Slack
      return res.status(200).send();
    } catch (error) {
      console.error("Error handling slash command:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Handle modal submission
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async handleModalSubmission(req, res) {
    // Acknowledge the request immediately to prevent timeout
    res.status(200).send();

    try {
      const payload = req.slackPayload;

      // Extract values from the modal submission
      const values = Helpers.extractValuesFromView(payload.view.state);

      // Parse private metadata to get channel ID
      const metadata = Helpers.parsePrivateMetadata(
        payload.view.private_metadata
      );
      const channelId = metadata.channelId || payload.user.id;

      // Get assignee email if assignee was selected
      let assigneeAccountId = null;
      if (values.assigneeSlackId) {
        const slackUser = await slackService.getUserInfo(
          values.assigneeSlackId
        );
        if (slackUser?.profile?.email) {
          const jiraUser = await jiraService.findUserByEmail(
            slackUser.profile.email
          );
          if (jiraUser) {
            assigneeAccountId = jiraUser.accountId;
          }
        }
      }

      // Convert description to ADF format
      const descriptionADF = jiraService.convertToADF(values.description);

      // Map priority to Jira priority ID
      const priorityId = jiraService.mapPriority(values.priority);

      // Build issue data
      const issueData = Helpers.buildIssueData({
        projectKey: values.projectKey,
        title: values.title,
        descriptionADF: descriptionADF,
        issueTypeId: values.selectedComponent,
        priorityId: priorityId,
        assigneeAccountId: assigneeAccountId,
      });

      // Create the issue in Jira
      const jiraResponse = await jiraService.createIssue(issueData);
      const issueKey = jiraResponse.key;

      // Process and attach files if any
      if (values.files && values.files.length > 0) {
        await fileService.processAndAttachFiles(values.files, issueKey);
      }

      // Create and send success message
      const successMessage = SlackTemplateFactory.createSuccessMessage(
        issueKey,
        config.jira.host,
        values.title,
        values.description
      );

      await slackService.sendMessage(channelId, successMessage);
    } catch (error) {
      console.error("Error processing modal submission:", error);

      // Send error message to user
      const errorMessage = SlackTemplateFactory.createErrorMessage(
        error.message
      );
      await slackService.sendMessage(payload.user.id, errorMessage);
    }
  }

  /**
   * Handle health check
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  handleHealthCheck(req, res) {
    return res.status(200).send("Slack-Jira integration service is running");
  }
}

module.exports = new SlackController();
