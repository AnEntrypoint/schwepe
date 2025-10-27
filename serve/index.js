// Enhanced health check handler for Coolify deployment
async function handler(req, res) {
  const url = req.url;
  const method = req.method;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (url === '/health' || url === '/') {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      platform: process.platform
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData, null, 2));
    return;
  }
  
  // API endpoint for status
  if (url === '/api/status') {
    const statusData = {
      service: 'schwepe',
      status: 'running',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3000
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(statusData, null, 2));
    return;
  }
  
  // Default response for other routes
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>Schwepe Application</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .status { color: #28a745; }
        .container { background: #f8f9fa; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Schwepe Application</h1>
        <p class="status">✅ Server is running successfully!</p>
        <p>Deployed via Coolify on ${new Date().toLocaleString()}</p>
        <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
        <p>Port: ${process.env.PORT || 3000}</p>
        <hr>
        <h3>Available Endpoints:</h3>
        <ul>
            <li><a href="/health">Health Check</a></li>
            <li><a href="/api/status">API Status</a></li>
        </ul>
    </div>
</body>
</html>
  `);
}

module.exports = { handler };
