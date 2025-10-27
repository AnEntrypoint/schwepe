const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS for API routes
app.use(cors());

// Health endpoint - must be first
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Serve static files from the built assets
const staticPath = path.join(__dirname, 'dist', '247420', 'site-assets');
app.use('/static', express.static(staticPath));
app.use('/assets', express.static(staticPath));
app.use(express.static(staticPath));

// Also serve from schwepe directory as fallback
const schwepePath = path.join(__dirname, 'dist', 'schwepe');
app.use(express.static(schwepePath));

// Main route handler - serve index.html
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', '247420', 'site-assets', 'templates', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Schwepe Application</title></head>
      <body>
        <h1>🚀 Schwepe Application</h1>
        <p>Server is running but no content found.</p>
        <p><a href="/api/health">Health Check</a></p>
      </body>
      </html>
    `);
  }
});

// Handle other HTML routes
app.get('/gallery', (req, res) => {
  const galleryPath = path.join(__dirname, 'dist', '247420', 'site-assets', 'templates', 'gallery.html');
  if (fs.existsSync(galleryPath)) {
    res.sendFile(galleryPath);
  } else {
    res.redirect('/');
  }
});

app.get('/lore', (req, res) => {
  const lorePath = path.join(__dirname, 'dist', '247420', 'site-assets', 'templates', 'lore.html');
  if (fs.existsSync(lorePath)) {
    res.sendFile(lorePath);
  } else {
    res.redirect('/');
  }
});

// Catch all other routes
app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Static files: ${staticPath}`);
  console.log(`🏥 Health endpoint: http://0.0.0.0:${PORT}/api/health`);
});
