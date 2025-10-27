const https = require('https');
const http = require('http');

class URLMonitor {
  constructor(urls, options = {}) {
    this.urls = urls;
    this.timeout = options.timeout || 5000;
    this.retries = options.retries || 2;
  }

  async checkUrl(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const protocol = url.startsWith('https') ? https : http;
      
      const req = protocol.get(url, { 
        timeout: this.timeout,
        rejectUnauthorized: false
      }, (res) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        resolve({
          url,
          status: res.statusCode,
          responseTime,
          success: res.statusCode < 400,
          redirect: res.statusCode >= 300 && res.statusCode < 400
        });
      });
      
      req.on('error', (error) => {
        const endTime = Date.now();
        resolve({
          url,
          status: 'ERROR',
          responseTime: endTime - startTime,
          success: false,
          error: error.message
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        const endTime = Date.now();
        resolve({
          url,
          status: 'TIMEOUT',
          responseTime: endTime - startTime,
          success: false,
          error: 'Request timeout'
        });
      });
    });
  }

  async checkAllUrls() {
    console.log('=== URL Health Check ===');
    const results = [];
    
    for (const url of this.urls) {
      try {
        console.log(`Checking ${url}...`);
        const result = await this.checkUrl(url);
        results.push(result);
        
        if (result.success) {
          if (result.redirect) {
            console.log(`➡️  ${url} - Status: ${result.status} (Redirect), Response time: ${result.responseTime}ms`);
          } else {
            console.log(`✅ ${url} - Status: ${result.status}, Response time: ${result.responseTime}ms`);
          }
        } else {
          console.log(`❌ ${url} - Status: ${result.status}, Error: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`❌ ${url} - Critical error: ${error.message}`);
        results.push({
          url,
          status: 'CRITICAL_ERROR',
          success: false,
          error: error.message
        });
      }
    }
    
    console.log('\n=== Summary ===');
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${results.length}`);
    
    return results;
  }
}

if (require.main === module) {
  const urls = [
    'https://schwepe.247420.xyz',
    'https://coolify.247420.xyz',
    'https://c0s8g4k00oss8kkcoccs88g0.247420.xyz',
    'https://schwepe.com'
  ];
  
  const monitor = new URLMonitor(urls);
  monitor.checkAllUrls().catch(console.error);
}

module.exports = URLMonitor;