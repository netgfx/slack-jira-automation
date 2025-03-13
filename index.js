// Importing required dependencies
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const FormData = require("form-data");
const { Buffer } = require("buffer");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Get credentials
const slackToken = process.env.SLACK_BOT_TOKEN;
const jiraHost = process.env.JIRA_HOST;
const jiraEmail = process.env.JIRA_USERNAME;
const jiraToken = process.env.JIRA_API_TOKEN;
const jiraProject = process.env.JIRA_PROJECT_KEY;

// Helper to verify Slack request signature
async function verifySlackRequest(req) {
  // Implement actual signature verification logic here
  // This is simplified for the example
  return { isValid: true, body: req.body };
}

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
// Parse JSON bodies
app.use(bodyParser.json());

// #components
const fetchComponents = async () => {
  try {
   
    const contextId = ""; // You might need to determine the correct context ID
    const optionsResponse = await axios.get(
      `https://netgfx.atlassian.net/rest/api/3/issuetype`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${jiraEmail}:${jiraToken}`
          ).toString("base64")}`,
          Accept: "application/json",
        },
      }
    );

    console.log("Issue type:", optionsResponse.data);

    if (optionsResponse.data) {
      componentOptions = optionsResponse.data.map((option) => ({
        text: {
          type: "plain_text",
          text: option.name,
        },
        value: option.id,
      }));
    }
  } catch (fieldError) {
    console.error("Error fetching custom field options:", fieldError);
  }

  console.log("Components RAW:", JSON.stringify(componentOptions));

  return componentOptions;

  ////
};

// Handle slash command
app.post("/slack/commands", async (req, res) => {
  try {
    const { isValid, body } = await verifySlackRequest(req);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid request" });
    }

    // Get the trigger ID and channel ID
    const triggerId = req.body.trigger_id;
    const channelId = req.body.channel_id;

    // Store the channel ID in the private_metadata of the modal
    const privateMetadata = JSON.stringify({ channelId });

    // Fetch the Slack token
    const slackToken = process.env.SLACK_BOT_TOKEN;

    // wait for components or other elements to be fetched
    const components = await fetchComponents();

    console.log("Components:", JSON.stringify(components));

    // Open a modal in Slack
    const response = await axios.post(
      "https://slack.com/api/views.open",
      {
        trigger_id: triggerId,
        view: {
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
              block_id: "issue_title",
              element: {
                type: "plain_text_input",
                action_id: "title",
                placeholder: {
                  type: "plain_text",
                  text: "Enter issue title",
                },
              },
              label: {
                type: "plain_text",
                text: "Issue Title",
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
                options: components,
              },
              label: {
                type: "plain_text",
                text: "Components",
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
        },
      },
      {
        headers: {
          Authorization: `Bearer ${slackToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).send();
  } catch (error) {
    console.error("Error handling slash command:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Handle interactive components (modal submissions)
app.post("/slack/interactive", async (req, res) => {
  try {
    const { isValid } = await verifySlackRequest(req);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid request" });
    }

    const payload = JSON.parse(req.body.payload);
    console.log(JSON.stringify(payload));

    if (
      payload.type === "view_submission" &&
      payload.view.callback_id === "qa_issue_modal"
    ) {
      // Acknowledge the request immediately
      res.status(200).send();

      // Process the form submission in the background
      const values = payload.view.state.values;
      const title = values.issue_title.title.value;
      const description = values.issue_description.description?.value || "";
      const priority = values.issue_priority.priority.selected_option.value;
      const assigneeSlackId =
        values.issue_assignee.assignee?.selected_user || "";
      // Extract selected components
      const selectedComponents =
        values.issue_components?.components?.selected_options || [];
      const componentIds = selectedComponents.map((option) => option.value);

      // Debug the entire payload structure
      console.log("Full view submission payload:", JSON.stringify(payload));
      console.log("Values object:", JSON.stringify(values));

      // Check specifically for the file input data
      const fileInputData = values.issue_attachments?.attachments;
      console.log("File input data:", JSON.stringify(fileInputData));

      console.log("Environment check:", {
        jiraHost: Boolean(jiraHost),
        jiraEmail: Boolean(jiraEmail),
        jiraToken: Boolean(jiraToken),
        jiraProject: Boolean(jiraProject),
        slackToken: Boolean(slackToken),
      });

      let channelId = payload.user.id;

      // Create issue in Jira
      try {
        // Convert plain text description to Atlassian Document Format (ADF)
        const descriptionADF = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: description,
                },
              ],
            },
          ],
        };

        // Get issue types
        const metaResponse = await axios.get(
          `https://${jiraHost}/rest/api/3/issue/createmeta?projectKeys=${jiraProject}&expand=projects.issuetypes.fields`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${jiraEmail}:${jiraToken}`
              ).toString("base64")}`,
              Accept: "application/json",
            },
          }
        );

        console.log(
          "Available issue types:",
          JSON.stringify(
            metaResponse.data?.projects?.[0]?.issuetypes?.map((t) => ({
              id: t.id,
              name: t.name,
            }))
          )
        );

        // Get priorities
        try {
          const priorityResponse = await axios.get(
            `https://${jiraHost}/rest/api/3/priority`,
            {
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${jiraEmail}:${jiraToken}`
                ).toString("base64")}`,
                Accept: "application/json",
              },
            }
          );

          console.log(
            "Available priorities:",
            priorityResponse.data.map((p) => ({ id: p.id, name: p.name }))
          );
        } catch (error) {
          console.error("Error fetching priorities:", error);
        }

        // Build the issue data
        const issueData = {
          fields: {
            assignee: {},
            project: {
              key: jiraProject,
            },
            summary: title,
            description: descriptionADF,
            issuetype: {
              id: componentIds.length > 0 ? componentIds[0] : "10004", // Default to "Bug" if no component selected
            },
            priority: {
              id: "3", // Medium priority ID
            },
            components:
              componentIds.length > 0
                ? componentIds.map((id) => ({ id }))
                : undefined,
          },
        };

        // Set priority
        if (priority) {
          let priorityId = mapPriority(priority);
          issueData.fields.priority = { id: priorityId };
        }

        // Handle assignee if selected
        if (assigneeSlackId) {
          try {
            // Get the Slack user's email
            const userResponse = await axios.get(
              `https://slack.com/api/users.info?user=${assigneeSlackId}`,
              {
                headers: {
                  Authorization: `Bearer ${slackToken}`,
                },
              }
            );

            console.log("Slack user data:", JSON.stringify(userResponse.data));

            if (
              userResponse.data.ok &&
              userResponse.data.user &&
              userResponse.data.user.profile &&
              userResponse.data.user.profile.email
            ) {
              const userEmail = userResponse.data.user.profile.email;
              console.log("Found user email:", userEmail);

              // Find Jira user by email
              const jiraUserResponse = await axios.get(
                `https://${jiraHost}/rest/api/3/user/search?query=${encodeURIComponent(
                  userEmail
                )}`,
                {
                  headers: {
                    Authorization: `Basic ${Buffer.from(
                      `${jiraEmail}:${jiraToken}`
                    ).toString("base64")}`,
                    Accept: "application/json",
                  },
                }
              );

              console.log(
                "Jira users found:",
                JSON.stringify(jiraUserResponse.data)
              );

              if (jiraUserResponse.data && jiraUserResponse.data.length > 0) {
                // Use accountId for Jira Cloud
                issueData.fields.assignee = {
                  id: jiraUserResponse.data[0].accountId,
                };
                console.log(
                  "Setting assignee with ID:",
                  jiraUserResponse.data[0].accountId
                );
              } else {
                console.log(
                  "No matching Jira user found for email:",
                  userEmail
                );
              }
            }
          } catch (error) {
            console.error("Error handling assignee:", error);
          }
        }

        // Log final request payload
        console.log("Final Jira request payload:", JSON.stringify(issueData));

        // Test Jira authentication
        try {
          const testResponse = await axios.get(
            `https://${jiraHost}/rest/api/3/myself`,
            {
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${jiraEmail}:${jiraToken}`
                ).toString("base64")}`,
                Accept: "application/json",
              },
            }
          );

          console.log("Jira auth test status:", testResponse.status);
        } catch (error) {
          console.error("Jira auth test failed:", error);
          throw error;
        }

        // Create the issue
        const jiraResponse = await axios.post(
          `https://${jiraHost}/rest/api/3/issue`,
          issueData,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${jiraEmail}:${jiraToken}`
              ).toString("base64")}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        // Add detailed logging
        console.log("Jira API Response Status:", jiraResponse.status);
        console.log(
          "Jira API Response Body:",
          JSON.stringify(jiraResponse.data)
        );

        const issueKey = jiraResponse.data.key;
        if (!issueKey) {
          throw new Error(
            `No issue key returned: ${JSON.stringify(jiraResponse.data)}`
          );
        }

        // Get file uploads if any were provided
        const files = fileInputData?.files || [];
        console.log(`Found ${files.length} files to attach to Jira issue`);

        // If there are files, attach them to the Jira issue
        if (files.length > 0) {
          for (const file of files) {
            try {
              console.log(`Processing file: ${file.name} (${file.id})`);

              // Download the file using the private URL with authorization
              const fileResponse = await axios.get(file.url_private, {
                headers: {
                  Authorization: `Bearer ${slackToken}`,
                },
                responseType: "arraybuffer",
              });

              // Create a FormData object for file upload to Jira
              const formData = new FormData();
              formData.append("file", Buffer.from(fileResponse.data), {
                filename: file.name,
                contentType: file.mimetype,
              });

              // Attach to Jira
              try {
                const attachResponse = await axios.post(
                  `https://${jiraHost}/rest/api/3/issue/${issueKey}/attachments`,
                  formData,
                  {
                    headers: {
                      Authorization: `Basic ${Buffer.from(
                        `${jiraEmail}:${jiraToken}`
                      ).toString("base64")}`,
                      "X-Atlassian-Token": "no-check",
                      Accept: "application/json",
                      ...formData.getHeaders(), // Important for multipart/form-data
                    },
                  }
                );

                console.log(
                  `Successfully attached ${file.name} to Jira issue ${issueKey}`
                );
              } catch (attachError) {
                console.error(
                  `Error attaching file ${file.name} to Jira:`,
                  attachError.response?.status,
                  attachError.response?.data
                );
              }
            } catch (error) {
              console.error(`Error processing file ${file.name}:`, error);
            }
          }
        }

        // Get channel ID from private metadata
        try {
          if (payload.view.private_metadata) {
            const metadata = JSON.parse(payload.view.private_metadata);
            if (metadata.channelId) {
              channelId = metadata.channelId;
            }
          }
        } catch (e) {
          console.error("Error parsing private_metadata:", e);
        }

        // Construct a clickable link
        const issueUrl = `https://${jiraHost}/browse/${issueKey}`;

        // Notify user of success
        await axios.post(
          "https://slack.com/api/chat.postMessage",
          {
            channel: channelId,
            text: `✅ Issue created successfully: <${issueUrl}|${issueKey}>`,
          },
          {
            headers: {
              Authorization: `Bearer ${slackToken}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Error creating Jira issue:", error);

        // Notify user of failure
        await axios.post(
          "https://slack.com/api/chat.postMessage",
          {
            channel: channelId,
            text: `❌ Failed to create issue in Jira: ${error.message}`,
          },
          {
            headers: {
              Authorization: `Bearer ${slackToken}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Return has already been sent
      return;
    }

    return res.status(200).send();
  } catch (error) {
    console.error("Unhandled error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Helper function to map Slack priority to Jira priority
function mapPriority(priority) {
  let priorityId;
  switch (priority) {
    case "High":
      priorityId = "2"; // From your list
      break;
    case "Medium":
      priorityId = "3"; // From your list
      break;
    case "Low":
      priorityId = "4"; // From your list
      break;
    default:
      priorityId = "3"; // Default to Medium
  }

  return priorityId;
}

// Root endpoint for health check
app.get("/", (req, res) => {
  res.status(200).send("Slack-Jira integration service is running");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
