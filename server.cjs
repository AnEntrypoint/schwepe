const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple middleware for JSON
app.use(express.json());

// Health endpoint - must be first and very simple
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve static files from the build directory
const distPath = path.join(__dirname, 'dist', '247420', 'site-assets');
const fallbackPath = path.join(__dirname, 'dist', 'schwepe');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log(`Serving static files from: ${distPath}`);
}

if (fs.existsSync(fallbackPath)) {
  app.use(express.static(fallbackPath));
  console.log(`Serving static files from fallback: ${fallbackPath}`);
}

// Main route - serve index.html
app.get('/', (req, res) => {
  const indexPath = path.join(distPath, 'templates', 'index.html');
  const fallbackIndexPath = path.join(fallbackPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else if (fs.existsSync(fallbackIndexPath)) {
    res.sendFile(fallbackIndexPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Schwepe Application</title></head>
      <body>
        <h1>🚀 Schwepe Application</h1>
        <p>Server is running successfully!</p>
        <p><a href="/api/health">Health Check</a></p>
      </body>
      </html>
    `);
  }
});

// All other routes redirect to home
app.get('*', (req, res) => {
  res.redirect('/');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health endpoint: http://0.0.0.0:${PORT}/api/health`);
});
