/**
 * CORS Proxy Core Logic
 * Framework-agnostic implementation for CORS proxy functionality
 */

export class CorsProxyCore {
  constructor(options = {}) {
    this.options = {
      allowedOrigins: ['*'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      ...options
    };
  }

  /**
   * Handle CORS preflight requests
   */
  handlePreflight(req, res) {
    res.setHeader('Access-Control-Allow-Origin', this.options.allowedOrigins.join(', '));
    res.setHeader('Access-Control-Allow-Methods', this.options.allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', this.options.allowedHeaders.join(', '));
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return true;
    }
    return false;
  }

  /**
   * Set CORS headers for response
   */
  setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', this.options.allowedOrigins.join(', '));
    res.setHeader('Access-Control-Allow-Methods', this.options.allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', this.options.allowedHeaders.join(', '));
  }

  /**
   * Proxy request to target URL
   */
  async proxyRequest(req, res, targetUrl) {
    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          ...req.headers,
          host: new URL(targetUrl).host
        }
      });

      const contentType = response.headers.get('content-type') || '';
      this.setCorsHeaders(res);
      res.setHeader('Content-Type', contentType);

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        res.write(Buffer.from(buffer));
        res.end();
      } else {
        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy request failed' }));
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }

  /**
   * Handle API proxy requests with path parsing
   */
  async handleApiProxy(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const pathParts = url.pathname.split('/').filter(part => part);
    
    if (pathParts.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid API path' }));
      return;
    }

    const lastPart = pathParts[pathParts.length - 1];
    const isCounters = pathParts.includes('counters');
    const isToken = pathParts.includes('token');
    const isStats = pathParts.includes('stats');

    let apiUrl = '';

    if (isToken) {
      const tokenIndex = pathParts.indexOf('token') + 1;
      const address = pathParts[tokenIndex];
      const endpoint = isCounters ? 'counters' : 'stats';
      apiUrl = `https://api.opensea.io/api/v1/asset/${address}/1/${endpoint}`;
    } else if (isStats) {
      apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${lastPart}&vs_currencies=usd`;
    } else {
      apiUrl = `https://api.opensea.io/api/v1/asset/${lastPart}/1/stats`;
    }

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      this.setCorsHeaders(res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (error) {
      this.setCorsHeaders(res);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch API data' }));
    }
  }
}