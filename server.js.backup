import { createServer } from 'http';
import handler from './serve/index.js';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 Starting Schwepe server in ' + NODE_ENV + ' mode on port ' + PORT);

const server = createServer(async (req, res) => {
  try {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Use the handler from serve/index.js
    await handler(req, res);
  } catch (error) {
    console.error('❌ Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal Server Error',
      message: NODE_ENV === 'development' ? error.message : 'Something went wrong'
    }));
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start listening
server.listen(PORT, '0.0.0.0', () => {
  console.log('🌐 Server listening on http://0.0.0.0:' + PORT);
  console.log('📍 Environment: ' + NODE_ENV);
  console.log('🏥 Health check: http://0.0.0.0:' + PORT + '/health');
});

export default server;
