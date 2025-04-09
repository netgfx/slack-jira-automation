// utils/helpers.js

/**
 * Helper functions for the application
 */
class Helpers {
  /**
   * Extract values from Slack view submission
   * @param {Object} viewState - View state object from Slack
   * @returns {Object} - Extracted values
   */
  static extractValuesFromView(viewState) {
    const values = viewState.values;

    return {
      title: values.issue_title?.title?.value || "",
      description: values.issue_description?.description?.value || "",
      priority:
        values.issue_priority?.priority?.selected_option?.value || "Medium",
      assigneeSlackId: values.issue_assignee?.assignee?.selected_user || "",
      selectedComponent:
        values.issue_components?.components?.selected_option?.value || "",
      projectKey: values.project_select?.project?.selected_option?.value || "",
      files: values.issue_attachments?.attachments?.files || [],
    };
  }

  /**
   * Parse private metadata from Slack view
   * @param {string} privateMetadata - JSON string
   * @returns {Object} - Parsed metadata
   */
  static parsePrivateMetadata(privateMetadata) {
    try {
      if (privateMetadata) {
        return JSON.parse(privateMetadata);
      }
    } catch (e) {
      console.error("Error parsing private_metadata:", e);
    }

    return {};
  }

  /**
   * Build Jira issue data
   * @param {Object} params - Parameters for issue creation
   * @returns {Object} - Issue data for Jira API
   */
  static buildIssueData({
    projectKey,
    title,
    descriptionADF,
    issueTypeId,
    priorityId,
    assigneeAccountId,
  }) {
    const issueData = {
      fields: {
        project: {
          key: projectKey,
        },
        summary: title,
        description: descriptionADF,
        issuetype: {
          id: issueTypeId || "10002", // Default to "Bug" if no issue type selected
        },
        priority: {
          id: priorityId || "3", // Default to Medium priority
        },
      },
    };

    // Add assignee if available
    if (assigneeAccountId) {
      issueData.fields.assignee = {
        id: assigneeAccountId,
      };
    }

    return issueData;
  }
}

module.exports = Helpers;
