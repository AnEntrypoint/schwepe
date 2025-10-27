import { CorsProxyCore } from './lib/cors-proxy-core.js'

/**
 * Vite Plugin: CORS Proxy Middleware (Refactored)
 * Provides CORS proxy functionality as sub-paths of the main server
 * Uses framework-agnostic core implementation to avoid circular dependencies
 */

// Create global CORS core instance
const corsCore = new CorsProxyCore({
  allowedOrigins: ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

export function corsProxyPlugin(options = {}) {
  const pluginCorsCore = new CorsProxyCore(options);
  
  return {
    name: 'cors-proxy-middleware',
    configureServer(server) {
      // Main proxy endpoint
      server.middlewares.use('/api/proxy', async (req, res, next) => {
        // Handle preflight
        if (pluginCorsCore.handlePreflight(req, res)) {
          return;
        }

        // Extract target URL
        const targetUrl = req.url.replace('/api/proxy?url=', '');
        const decodedUrl = decodeURIComponent(targetUrl);
        
        // Proxy the request
        await pluginCorsCore.proxyRequest(req, res, decodedUrl);
      });

      // API proxy endpoint for specific services
      server.middlewares.use('/api', async (req, res, next) => {
        // Handle preflight
        if (pluginCorsCore.handlePreflight(req, res)) {
          return;
        }
        
        // Handle API-specific proxy logic
        await pluginCorsCore.handleApiProxy(req, res);
      });
    }
  }
}

// Export utility functions for external use
export { CorsProxyCore };

// Default configuration
export default corsProxyPlugin;