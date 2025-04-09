// server.js
const app = require("./app");
const config = require("./config/env");

// Start the server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
