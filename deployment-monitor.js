#!/usr/bin/env node

import https from 'https';
import fs from 'fs';
import { setTimeout } from 'timers/promises';

const CONFIG = {
  urls: {
    main: 'https://schwepe.247420.xyz',
    actual: 'https://c0s8g4k00oss8kkcoccs88g0.247420.xyz',
    admin: 'https://coolify.247420.xyz'
  },
  timeout: 3000, // Further reduced timeout
  retries: 1, // Single retry only
  overallTimeout: 8000 // Hard overall timeout
};

function checkUrlSync(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Set a hard timeout that cannot be exceeded
    const hardTimeout = setTimeout(() => {
      resolve({
        url,
        status: 'TIMEOUT',
        responseTime: CONFIG.timeout,
        success: false,
        error: 'Hard timeout exceeded'
      });
    }, CONFIG.timeout);

    const req = https.get(url, { 
      timeout: CONFIG.timeout,
      rejectUnauthorized: false,
      keepAlive: false,
      headers: {
        'User-Agent': 'schwepe-deployment-check/1.0',
        'Connection': 'close'
      }
    }, (res) => {
      clearTimeout(hardTimeout);
      // Don't wait for the full response, just status is enough
      resolve({
        url,
        status: res.statusCode,
        responseTime: Date.now() - startTime,
        success: res.statusCode < 400
      });
    });
    
    req.on('error', (error) => {
      clearTimeout(hardTimeout);
      resolve({
        url,
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      clearTimeout(hardTimeout);
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        responseTime: CONFIG.timeout,
        success: false,
        error: 'Socket timeout'
      });
    });
    
    req.end();
  });
}

async function quickCheckWithTimeout() {
  const overallTimeout = setTimeout(() => {
    console.log('❌ Overall timeout exceeded');
    process.exit(1);
  }, CONFIG.overallTimeout);

  try {
    console.log('🔍 Quick Deployment Check');
    console.log('========================');
    console.log(`⏰ ${new Date().toLocaleString()}`);
    console.log('');

    // Check URLs sequentially instead of parallel to avoid hanging
    const results = [];
    
    for (const [name, url] of Object.entries(CONFIG.urls)) {
      if (name === 'admin') continue; // Skip admin check for quick check
      
      console.log(`Checking ${name}...`);
      const result = await checkUrlSync(url);
      results.push(result);
      
      const icon = result.success ? '✅' : '❌';
      const displayName = name === 'main' ? 'Main' : 'Actual';
      console.log(`  ${icon} ${displayName}: ${result.status} (${result.responseTime}ms)`);
    }

    console.log('');
    const allGood = results.every(r => r.success);
    
    if (allGood) {
      console.log('✅ DEPLOYMENT OK');
      try {
        fs.writeFileSync('/mnt/c/dev/schwepe/.deployment-status.json', JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 'operational',
          check: 'quick',
          results: results
        }, null, 2));
      } catch (e) {
        // Ignore write errors
      }
    } else {
      console.log('❌ DEPLOYMENT ISSUES');
      try {
        fs.writeFileSync('/mnt/c/dev/schwepe/.deployment-issue.json', JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 'issues-detected',
          results: results
        }, null, 2));
      } catch (e) {
        // Ignore write errors
      }
    }
    
  } catch (error) {
    console.log('❌ Check failed:', error.message);
  } finally {
    clearTimeout(overallTimeout);
  }
}

// Set process timeout
setTimeout(() => {
  console.log('❌ Process timeout - exiting');
  process.exit(1);
}, CONFIG.overallTimeout + 1000);

quickCheckWithTimeout().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});