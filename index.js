require('dotenv').config(); // Load environment variables from .env file
const http = require('http');
const axios = require('axios');
const cron = require('node-cron');

// Get environment variables
const SERVER_ENDPOINT = process.env.SERVER_ENDPOINT || 'http://default-service.com/health';
const PORT = process.env.PORT || 3000;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/your/default/webhook/url';

// Alert function to send POST request to Slack webhook
async function alertFunction(error) {
  console.error(`ALERT! The server is not responding. Error: ${error}`);

  try {
    await axios.post(SLACK_WEBHOOK_URL, {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Health Check Alert!* :rotating_light:"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Error:*\n${error}`
            },
            {
              type: "mrkdwn",
              text: `*Timestamp:*\n${new Date().toUTCString()}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Please investigate the issue. :mag:"
          }
        }
      ]
    });

    console.log('Alert sent to Slack successfully.');
  } catch (err) {
    console.error('Could not send alert to Slack:', err);
  }
}

// Function to ping another service's health check endpoint
async function healthCheck() {
  try {
    const response = await axios.get(SERVER_ENDPOINT);

    // Check if the status code is 200 (OK)
    if (response.status !== 200) {
      alertFunction(`Received status code: ${response.status}`);
    }

    console.log('Server is healthy', response.data);
  } catch (error) {
    alertFunction(error);
  }
}

// Schedule a cron job to run every 10 minutes
cron.schedule('*/1 * * * *', () => {
  console.log('Running a health check every 10 minutes');
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

