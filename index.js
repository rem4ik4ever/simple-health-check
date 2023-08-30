require('dotenv').config(); // Load environment variables from .env file
const http = require('http');
const axios = require('axios');
const cron = require('node-cron');

// Get environment variables
const SERVER_ENDPOINT = process.env.SERVER_ENDPOINT || 'http://default-service.com/health';
const PORT = process.env.PORT || 3000;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/your/default/webhook/url';

let currentState = "UP"; // Initial state, you can start it as "UNKNOWN" or "DOWN" as per your need

// Alert function to send POST request to Slack webhook
// Alert function to send POST request to Slack webhook
async function alertFunction(message, status) {
  let color = status === "UP" ? "#36a64f" : "#ff0000"; // Green for UP, Red for DOWN
  if (status === "STABLE") return;
  try {
    await axios.post(SLACK_WEBHOOK_URL, {
      attachments: [
        {
          color: color,
          pretext: "Server Health Check Alert",
          title: `Server is currently ${status}`,
          text: message,
          fields: [
            {
              title: "Timestamp",
              value: getCurrentDateTimeET(),
              short: false
            }
          ],
          footer: "Health Monitor Bot",
          footer_icon: "https://platform.slack-edge.com/img/default_application_icon.png"
        }
      ]
    });
    console.log('Alert sent to Slack successfully.');
  } catch (err) {
    console.error('Could not send alert to Slack:', err);
  }
}
function getCurrentDateTimeET() {
  const date = new Date();
  return date.toLocaleString("en-US", { timeZone: "America/New_York" });
}

// Function to ping another service's health check endpoint
async function healthCheck() {
  try {
    const response = await axios.get(SERVER_ENDPOINT);

    // Check if the status code is 200 (OK)
    if (response.status === 200) {
      if (currentState === 'STABLE') {
        console.log("Server is stable")
        return;
      }
      if (currentState === "DOWN") {
        currentState = "UP";
        alertFunction(`The server is back up.`, currentState);
      } else {
        currentState = "STABLE";
        console.log("Server is stable")
      }
      console.log('Server is healthy', response.data);
    } else {
      currentState = "DOWN";
      alertFunction(`Received an unexpected status code: ${response.status}`, currentState);
    }

  } catch (error) {
    currentState = "DOWN";
    alertFunction(`:x: ALERT! The server is not responding. Error: ${error} as of ${getCurrentDateTimeET()}`);
  }
}

// Schedule a cron job to run every 10 minutes
cron.schedule('*/1 * * * *', () => {
  console.log('Running a health check every 1 minute');
  healthCheck();
});

// Create a simple server
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Simple Node.js server with cron job running!\n');
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
