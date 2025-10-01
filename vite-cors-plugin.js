import { defineConfig } from 'vite'

/**
 * Vite Plugin: CORS Proxy Middleware
 * Provides CORS proxy functionality as sub-paths of the main server
 */
export function corsProxyPlugin() {
  return {
    name: 'cors-proxy-middleware',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res, next) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        try {
          const targetUrl = req.url.replace('/api/proxy?url=', '')
          const decodedUrl = decodeURIComponent(targetUrl)

          console.log(`🔗 CORS Proxy: ${decodedUrl}`)

          const response = await fetch(decodedUrl, {
            headers: {
              'Accept': 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const contentType = response.headers.get('content-type') || ''
          let data

          if (contentType.includes('application/json')) {
            data = await response.json()
            res.setHeader('Content-Type', 'application/json')
          } else {
            data = await response.text()
            res.setHeader('Content-Type', 'text/html')
          }

          res.writeHead(200)
          res.end(typeof data === 'string' ? data : JSON.stringify(data))
        } catch (error) {
          console.error('CORS Proxy error:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            error: 'CORS Proxy Error',
            message: error.message
          }))
        }
      })

      // Token-specific endpoints
      server.middlewares.use('/api/token', async (req, res, next) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        try {
          const pathParts = req.url.split('/').filter(part => part) // Remove empty parts
          const tokenAddress = pathParts[pathParts.length - 1]
          const isCounters = pathParts.includes('counters')

          let apiUrl
          if (isCounters) {
            // Remove 'counters' from path parts to get token address
            const tokenIndex = pathParts.indexOf('token') + 1
            const address = pathParts[tokenIndex]
            apiUrl = `https://explorer.somnia.network/api/v2/tokens/${address}/counters`
            console.log(`🔗 Token API (counters): ${apiUrl}`)
          } else {
            apiUrl = `https://explorer.somnia.network/api/v2/tokens/${tokenAddress}`
            console.log(`🔗 Token API: ${apiUrl}`)
          }

          const response = await fetch(apiUrl)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()

          res.setHeader('Content-Type', 'application/json')
          res.writeHead(200)
          res.end(JSON.stringify(data))
        } catch (error) {
          console.error('Token API error:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            error: 'Token API Error',
            message: error.message
          }))
        }
      })

      // Health check endpoint
      server.middlewares.use('/api/health', (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Type', 'application/json')
        res.writeHead(200)
        res.end(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          proxy: 'vite-cors-middleware',
          endpoints: [
            '/api/health',
            '/api/token/:address',
            '/api/token/:address/counters',
            '/api/proxy?url=<encoded_url>'
          ]
        }))
      })

      console.log('🚀 CORS Proxy middleware configured on main server')
    },
    configurePreviewServer(server) {
      // Same middleware for preview server
      server.middlewares.use('/api/proxy', async (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        try {
          const targetUrl = req.url.replace('/api/proxy?url=', '')
          const decodedUrl = decodeURIComponent(targetUrl)

          console.log(`🔗 CORS Proxy (preview): ${decodedUrl}`)

          const response = await fetch(decodedUrl, {
            headers: {
              'Accept': 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const contentType = response.headers.get('content-type') || ''
          let data

          if (contentType.includes('application/json')) {
            data = await response.json()
            res.setHeader('Content-Type', 'application/json')
          } else {
            data = await response.text()
            res.setHeader('Content-Type', 'text/html')
          }

          res.writeHead(200)
          res.end(typeof data === 'string' ? data : JSON.stringify(data))
        } catch (error) {
          console.error('CORS Proxy error (preview):', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            error: 'CORS Proxy Error',
            message: error.message
          }))
        }
      })

      server.middlewares.use('/api/token', async (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        try {
          const pathParts = req.url.split('/').filter(part => part) // Remove empty parts
          const tokenAddress = pathParts[pathParts.length - 1]
          const isCounters = pathParts.includes('counters')

          let apiUrl
          if (isCounters) {
            // Remove 'counters' from path parts to get token address
            const tokenIndex = pathParts.indexOf('token') + 1
            const address = pathParts[tokenIndex]
            apiUrl = `https://explorer.somnia.network/api/v2/tokens/${address}/counters`
            console.log(`🔗 Token API (preview, counters): ${apiUrl}`)
          } else {
            apiUrl = `https://explorer.somnia.network/api/v2/tokens/${tokenAddress}`
            console.log(`🔗 Token API (preview): ${apiUrl}`)
          }

          const response = await fetch(apiUrl)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()

          res.setHeader('Content-Type', 'application/json')
          res.writeHead(200)
          res.end(JSON.stringify(data))
        } catch (error) {
          console.error('Token API error (preview):', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            error: 'Token API Error',
            message: error.message
          }))
        }
      })

      server.middlewares.use('/api/health', (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Type', 'application/json')
        res.writeHead(200)
        res.end(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          proxy: 'vite-cors-middleware-preview',
          endpoints: [
            '/api/health',
            '/api/token/:address',
            '/api/token/:address/counters',
            '/api/proxy?url=<encoded_url>'
          ]
        }))
      })

      console.log('🚀 CORS Proxy middleware configured on preview server')
    }
  }
}