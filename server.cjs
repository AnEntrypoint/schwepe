const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo'
};

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

const getDomainIdFromHost = (host) => {
  const domain = host.split(':')[0];
  if (domain === 'schwepe.247420.xyz' || domain === 'schwepe.247240.xyz') return 'schwepe';
  if (domain === '247420.xyz' || domain.includes('coolify')) return '247420';
  if (domain === 'localhost' || domain.startsWith('localhost:')) return 'schwepe';
  return '247420';
};

app.get('/api/time', (req, res) => {
  res.json({ serverTime: Date.now(), utc: new Date().toISOString() });
});

app.get('/domain-config.json', (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const siteId = getDomainIdFromHost(host);
  try {
    const config = require(path.join(__dirname, 'domains', siteId, 'config.json'));
    res.json(config);
  } catch (err) {
    console.error('Failed to load domain config:', err.message);
    res.status(500).json({ error: 'Failed to load domain config' });
  }
});

app.use((req, res, next) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const siteId = getDomainIdFromHost(host);
  console.log('Request for host:', host, '-> site:', siteId);
  req.siteId = siteId;
  req.staticPath = path.join(__dirname, 'dist', siteId, 'site-assets');
  req.siteRoot = path.join(__dirname, 'dist', siteId);
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
      const mime = MIME_TYPES[path.extname(filePath).toLowerCase()];
      if (mime) res.type(mime);
      return res.sendFile(filePath);
    } else if (stats.isDirectory()) {
      return next();
    }
  } catch (err) {}
  next();
});

app.get('*', (req, res) => {
  if (!req.siteRoot || !fs.existsSync(req.siteRoot)) {
    return res.status(404).send('Site not found');
  }
  const filePath = path.join(req.siteRoot, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const mime = MIME_TYPES[path.extname(filePath).toLowerCase()];
    if (mime) res.type(mime);
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
    console.log('Server running on http://0.0.0.0:' + port);
    console.log('Health: http://0.0.0.0:' + port + '/api/health');
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < 3010) {
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer(PORT);

module.exports = app;
