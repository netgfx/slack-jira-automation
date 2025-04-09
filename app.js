// app.js
const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes");

// Initialize Express app
const app = express();

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies
app.use(bodyParser.json());

// Mount routes
app.use(routes);

module.exports = app;
