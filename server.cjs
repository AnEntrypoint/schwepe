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

// Domain-based routing middleware
app.use((req, res, next) => {
  let host = req.headers.host || '';

  // Check for X-Forwarded-Host header (used by reverse proxies like Coolify)
  if (req.headers['x-forwarded-host']) {
    host = req.headers['x-forwarded-host'];
    console.log('Using X-Forwarded-Host:', host);
  }

  console.log('Request for host:', host);

  // Extract domain (remove port if present)
  const domain = host.split(':')[0];

  // Determine which site to serve based on domain
  let siteId = '247420'; // default

  if (domain === 'schwepe.247420.xyz' || domain === 'schwepe.247240.xyz') {
    siteId = 'schwepe';
  } else if (domain === '247420.xyz' || domain.includes('coolify')) {
    siteId = '247420';
  } else if (domain === 'localhost' || domain.startsWith('localhost:')) {
    // For local testing, default to schwepe so we can test the Schwelevision system
    siteId = 'schwepe';
  }

  console.log('Serving site:', siteId);
  
  // Set the correct static path for this request
  const staticPath = path.join(__dirname, 'dist', siteId, 'site-assets');
  const siteRoot = path.join(__dirname, 'dist', siteId);
  
  // Make paths available to subsequent middleware
  req.siteId = siteId;
  req.staticPath = staticPath;
  req.siteRoot = siteRoot;
  
  next();
});

// Serve static files from the appropriate site directory
app.use('/static', express.static(path.join(__dirname, 'dist', 'static')));
app.use('/public', express.static(path.join(__dirname, 'dist', 'public')));

// Serve site-specific assets
app.use((req, res, next) => {
  if (req.staticPath && fs.existsSync(req.staticPath)) {
    express.static(req.staticPath)(req, res, next);
  } else {
    next();
  }
});

// Serve site root files (including JS modules and lib directory)
app.use((req, res, next) => {
  if (!req.siteRoot) return next();

  const filePath = path.join(req.siteRoot, req.path);

  try {
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      return res.sendFile(filePath);
    } else if (stats.isDirectory()) {
      return next();
    }
  } catch (err) {
    // File doesn't exist or other error
  }

  next();
});

// Serve HTML pages from the correct site
app.get('*', (req, res) => {
  if (!req.siteRoot || !fs.existsSync(req.siteRoot)) {
    return res.status(404).send('Site not found');
  }
  
  // Try to serve the requested file
  const filePath = path.join(req.siteRoot, req.path);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  
  // Try index.html for directories
  const indexPath = path.join(req.siteRoot, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  // Return 404 if nothing found
  res.status(404).send('File not found');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal server error');
});

// Start the server with retry logic
function startServer(port) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log('🚀 Server running on http://0.0.0.0:' + port);
    console.log('🏥 Health endpoint: http://0.0.0.0:' + port + '/api/health');
    console.log('📁 Serving from:', path.join(__dirname, 'dist'));
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is already in use, trying next port...`);
      if (port < 3010) {
        startServer(port + 1);
      } else {
        console.error('❌ Could not find an available port');
        process.exit(1);
      }
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}

startServer(PORT);

module.exports = app;
