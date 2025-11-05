const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use((req, res, next) => {
  let host = req.headers.host || '';

  if (req.headers['x-forwarded-host']) {
    host = req.headers['x-forwarded-host'];
  }

  console.log('Request for host:', host);

  const domain = host.split(':')[0];

  let siteId = '247420';

  if (domain === 'schwepe.247420.xyz' || domain === 'schwepe.247240.xyz') {
    siteId = 'schwepe';
  } else if (domain === '247420.xyz' || domain.includes('coolify')) {
    siteId = '247420';
  } else if (domain === 'localhost' || domain.startsWith('localhost:')) {
    siteId = 'schwepe';
  }

  console.log('Serving site:', siteId);
  
  const staticPath = path.join(__dirname, 'dist', siteId, 'site-assets');
  const siteRoot = path.join(__dirname, 'dist', siteId);
  
  req.siteId = siteId;
  req.staticPath = staticPath;
  req.siteRoot = siteRoot;
  
  next();
});

app.use('/static', express.static(path.join(__dirname, 'dist', 'static')));
app.use('/public', express.static(path.join(__dirname, 'dist', 'public')));

app.use((req, res, next) => {
  if (req.staticPath && fs.existsSync(req.staticPath)) {
    express.static(req.staticPath)(req, res, next);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  if (!req.siteRoot) return next();

  const filePath = path.join(req.siteRoot, req.path);

  try {
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.gif': 'image/gif',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp'
      };
      const ext = path.extname(filePath).toLowerCase();
      if (mimeTypes[ext]) {
        res.type(mimeTypes[ext]);
      }
      return res.sendFile(filePath);
    } else if (stats.isDirectory()) {
      return next();
    }
  } catch (err) {
  }

  next();
});

app.get('*', (req, res) => {
  if (!req.siteRoot || !fs.existsSync(req.siteRoot)) {
    return res.status(404).send('Site not found');
  }

  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
  };

  const filePath = path.join(req.siteRoot, req.path);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    if (mimeTypes[ext]) {
      res.type(mimeTypes[ext]);
    }
    return res.sendFile(filePath);
  }

  const indexPath = path.join(req.siteRoot, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.type('text/html');
    return res.sendFile(indexPath);
  }

  res.status(404).send('File not found');
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal server error');
});

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
