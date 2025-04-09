// templates/slackTemplates.js

/**
 * Factory for building Slack UI components
 */
class SlackTemplateFactory {
  /**
   * Create a QA issue modal view
   * @param {Array} projects - List of projects formatted for select options
   * @param {Array} issueTypes - List of issue types formatted for select options
   * @param {string} privateMetadata - JSON string with private metadata
   * @returns {Object} - Modal view payload
   */
  static createQAIssueModal(projects, issueTypes, privateMetadata) {
    return {
      type: "modal",
      callback_id: "qa_issue_modal",
      private_metadata: privateMetadata,
      title: {
        type: "plain_text",
        text: "Report QA Issue",
      },
      submit: {
        type: "plain_text",
        text: "Submit",
      },
      blocks: [
        {
          type: "input",
          block_id: "project_select",
          element: {
            type: "static_select",
            action_id: "project",
            placeholder: {
              type: "plain_text",
              text: "Select project",
            },
            options: projects.map((project) => ({
              text: {
                type: "plain_text",
                text: `${project.key} - ${project.name}`,
              },
              value: project.key,
            })),
          },
          label: {
            type: "plain_text",
            text: "Project",
          },
          optional: false,
        },
        {
          type: "input",
          block_id: "issue_title",
          element: {
            type: "plain_text_input",
            action_id: "title",
            placeholder: {
              type: "plain_text",
              text: "e.g: [Platform] Issue with live match",
            },
          },
          label: {
            type: "plain_text",
            text: "Issue Title (Include platform)",
          },
          optional: false,
        },
        {
          type: "input",
          block_id: "issue_description",
          element: {
            type: "plain_text_input",
            action_id: "description",
            multiline: true,
            placeholder: {
              type: "plain_text",
              text: "Describe the issue",
            },
          },
          label: {
            type: "plain_text",
            text: "Description",
          },
          optional: false,
        },
        {
          type: "input",
          block_id: "issue_priority",
          element: {
            type: "static_select",
            action_id: "priority",
            options: [
              {
                text: {
                  type: "plain_text",
                  text: "High",
                },
                value: "High",
              },
              {
                text: {
                  type: "plain_text",
                  text: "Medium",
                },
                value: "Medium",
              },
              {
                text: {
                  type: "plain_text",
                  text: "Low",
                },
                value: "Low",
              },
            ],
          },
          label: {
            type: "plain_text",
            text: "Priority",
          },
        },
        {
          type: "input",
          block_id: "issue_components",
          element: {
            type: "static_select",
            action_id: "components",
            placeholder: {
              type: "plain_text",
              text: "Select issue type",
            },
            options: issueTypes,
          },
          label: {
            type: "plain_text",
            text: "Issue Type",
          },
          optional: true,
        },
        {
          type: "input",
          block_id: "issue_attachments",
          element: {
            type: "file_input",
            action_id: "attachments",
            filetypes: [
              "jpg",
              "jpeg",
              "png",
              "gif",
              "mp4",
              "mov",
              "wmv",
              "webm",
            ],
            max_files: 5,
          },
          label: {
            type: "plain_text",
            text: "Screenshots & Recordings",
          },
          optional: true,
        },
        {
          type: "input",
          block_id: "issue_assignee",
          element: {
            type: "users_select",
            action_id: "assignee",
            placeholder: {
              type: "plain_text",
              text: "Select assignee",
            },
          },
          label: {
            type: "plain_text",
            text: "Assign To",
          },
          optional: false,
        },
      ],
    };
  }

  /**
   * Create a success message for issue creation
   * @param {string} issueKey - Jira issue key
   * @param {string} jiraHost - Jira host
   * @param {string} title - Issue title
   * @param {string} description - Issue description
   * @returns {string} - Formatted message
   */
  static createSuccessMessage(issueKey, jiraHost, title, description) {
    const issueUrl = `https://${jiraHost}/browse/${issueKey}`;
    const truncatedDescription =
      description.length > 280
        ? description.substring(0, 277) + "..."
        : description;

    return `✅ Issue created successfully: <${issueUrl}|${issueKey}>\n*Title:* ${title}\n*Description:* ${truncatedDescription}`;
  }

  /**
   * Create an error message for issue creation
   * @param {string} errorMessage - Error message
   * @returns {string} - Formatted message
   */
  static createErrorMessage(errorMessage) {
    return `❌ Failed to create issue in Jira: ${errorMessage}`;
  }
}

module.exports = SlackTemplateFactory;
