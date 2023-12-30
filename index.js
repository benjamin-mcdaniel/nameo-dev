const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/motd', async (req, res) => {
  try {
    const motdFilePath = path.join(__dirname, 'public', 'motd');
    const motdContent = await fs.readFile(motdFilePath, 'utf8');
    res.send(motdContent);
  } catch (error) {
    console.error('Error fetching Message of the Day:', error);
    res.status(500).send('Failed to fetch Message of the Day.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
