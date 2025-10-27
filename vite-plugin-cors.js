import { CorsProxyCore } from '../lib/cors-proxy-core.js'

/**
 * Vite Plugin Wrapper for CORS Proxy
 * Uses the framework-agnostic core implementation
 */
export function corsProxyPlugin(options = {}) {
  const corsCore = new CorsProxyCore(options);
  
  return {
    name: 'cors-proxy-middleware',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res, next) => {
        if (corsCore.handlePreflight(req, res)) {
          return;
        }

        const targetUrl = req.url.replace('/api/proxy?url=', '');
        const decodedUrl = decodeURIComponent(targetUrl);
        await corsCore.proxyRequest(req, res, decodedUrl);
      });

      server.middlewares.use('/api', async (req, res, next) => {
        if (corsCore.handlePreflight(req, res)) {
          return;
        }
        await corsCore.handleApiProxy(req, res);
      });
    }
  }
}