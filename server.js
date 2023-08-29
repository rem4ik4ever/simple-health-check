const express = require('express');
const app = express();
const PORT = 4000; // You can choose any port that's available

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Health check passed' });
});

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}/`);
});

