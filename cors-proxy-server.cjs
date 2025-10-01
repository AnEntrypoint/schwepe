#!/usr/bin/env node
/**
 * Simple CORS Proxy Server for SCHWEPE Project
 * Runs locally and can be deployed with Nixpacks
 */

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.CORS_PROXY_PORT || 3001;
const TARGET_BASE = process.env.TARGET_BASE || 'https://explorer.somnia.network';

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    target: TARGET_BASE
  });
});

// Proxy middleware configuration
const proxyOptions = {
  target: TARGET_BASE,
  changeOrigin: true,
  pathRewrite: (path, req) => {
    // Remove /proxy prefix if present
    return path.replace(/^\/proxy/, '');
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying to: ${TARGET_BASE}${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Response status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({
      error: 'Proxy error',
      message: err.message,
      target: TARGET_BASE
    });
  }
};

// Create proxy middleware
const proxy = createProxyMiddleware(proxyOptions);

// Generic proxy endpoint - catches all requests
app.use('/proxy', proxy);

// Direct API endpoints for common requests
app.get('/api/token/:address', async (req, res) => {
  try {
    const tokenAddress = req.params.address;
    const apiUrl = `${TARGET_BASE}/api/v2/tokens/${tokenAddress}`;

    console.log(`Fetching token data from: ${apiUrl}`);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Add CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    res.json(data);
  } catch (error) {
    console.error('Token API error:', error);
    res.status(500).json({
      error: 'Failed to fetch token data',
      message: error.message
    });
  }
});

app.get('/api/token/:address/counters', async (req, res) => {
  try {
    const tokenAddress = req.params.address;
    const apiUrl = `${TARGET_BASE}/api/v2/tokens/${tokenAddress}/counters`;

    console.log(`Fetching token counters from: ${apiUrl}`);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Add CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    res.json(data);
  } catch (error) {
    console.error('Token counters API error:', error);
    res.status(500).json({
      error: 'Failed to fetch token counters',
      message: error.message
    });
  }
});

// Root endpoint with usage info
app.get('/', (req, res) => {
  res.json({
    name: 'SCHWEPE CORS Proxy',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      proxy: '/proxy/*',
      token: '/api/token/:address',
      tokenCounters: '/api/token/:address/counters'
    },
    examples: {
      token: `${req.protocol}://${req.get('host')}/api/token/0xDD10620866C4F586b1213d3818811Faf3718FCe3`,
      counters: `${req.protocol}://${req.get('host')}/api/token/0xDD10620866C4F586b1213d3818811Faf3718FCe3/counters`
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SCHWEPE CORS Proxy running on port ${PORT}`);
  console.log(`📡 Target API: ${TARGET_BASE}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Local endpoints:`);
  console.log(`   GET /api/token/:address`);
  console.log(`   GET /api/token/:address/counters`);
  console.log(`   GET /proxy/* (generic proxy)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});