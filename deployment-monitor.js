#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const CONFIG = {
  urls: {
    main: 'https://schwepe.247420.xyz',
    actual: 'https://c0s8g4k00oss8kkcoccs88g0.247420.xyz',
    admin: 'https://coolify.247420.xyz'
  },
  healthEndpoints: [
    'https://schwepe.247420.xyz/api/health',
    'https://c0s8g4k00oss8kkcoccs88g0.247420.xyz/api/health'
  ],
  timeout: 10000,
  retries: 3
};

async function checkUrl(url, retries = CONFIG.retries) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await new Promise((resolve, reject) => {
        const startTime = Date.now();
        const req = https.get(url, { 
          timeout: CONFIG.timeout,
          rejectUnauthorized: false
        }, (res) => {
          resolve({
            status: res.statusCode,
            responseTime: Date.now() - startTime,
            success: res.statusCode < 400,
            headers: res.headers
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      return { ...result, url, attempts: i + 1 };
    } catch (error) {
      if (i === retries - 1) {
        return {
          url,
          status: 'ERROR',
          responseTime: CONFIG.timeout,
          success: false,
          error: error.message,
          attempts: retries
        };
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function main() {
  console.log('🔍 DEPLOYMENT MONITOR');
  console.log('====================');
  console.log(`⏰ Check time: ${new Date().toLocaleString()}`);
  console.log('');

  // Check main URLs
  console.log('🌐 URL STATUS:');
  const urlResults = await Promise.all([
    checkUrl(CONFIG.urls.main),
    checkUrl(CONFIG.urls.actual),
    checkUrl(CONFIG.urls.admin)
  ]);

  urlResults.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const name = result.url.includes('coolify') ? 'Admin' : 
                 result.url.includes('c0s8g4k') ? 'Actual' : 'Main';
    console.log(`  ${icon} ${name}: ${result.status} (${result.responseTime}ms)`);
  });

  // Check health endpoints
  console.log('\n🏥 HEALTH ENDPOINTS:');
  const healthResults = await Promise.all([
    checkUrl(CONFIG.healthEndpoints[0]),
    checkUrl(CONFIG.healthEndpoints[1])
  ]);

  healthResults.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const name = result.url.includes('c0s8g4k') ? 'Actual Health' : 'Main Health';
    console.log(`  ${icon} ${name}: ${result.status}`);
  });

  // Determine overall status
  const mainSuccess = urlResults[0].success;
  const healthSuccess = healthResults.some(h => h.success);

  console.log('\n📊 OVERALL STATUS:');
  
  if (mainSuccess && healthSuccess) {
    console.log('✅ DEPLOYMENT OPERATIONAL');
    const status = {
      timestamp: new Date().toISOString(),
      status: 'operational',
      urls: urlResults.reduce((acc, r) => {
        const name = r.url.includes('coolify') ? 'admin' : 
                     r.url.includes('c0s8g4k') ? 'actual' : 'main';
        acc[name] = { status: r.status, responseTime: r.responseTime };
        return acc;
      }, {}),
      health: healthResults.reduce((acc, r, i) => {
        const name = i === 0 ? 'main' : 'actual';
        acc[name] = { status: r.status };
        return acc;
      }, {})
    };
    fs.writeFileSync('/mnt/c/dev/schwepe/.deployment-status.json', JSON.stringify(status, null, 2));
    
  } else if (urlResults[0].status === 502 || urlResults[1].status === 502) {
    console.log('❌ COOLIFY PERMISSION ISSUES');
    console.log('🔧 Fix server permissions: /data/coolify/applications/');
    const issue = {
      timestamp: new Date().toISOString(),
      status: 'coolify-permission-error',
      error: '502 Bad Gateway - Coolify cannot write config files',
      fix: 'SSH into server and fix directory permissions',
      urls: urlResults.reduce((acc, r) => {
        const name = r.url.includes('coolify') ? 'admin' : 
                     r.url.includes('c0s8g4k') ? 'actual' : 'main';
        acc[name] = { status: r.status, error: r.error };
        return acc;
      }, {})
    };
    fs.writeFileSync('/mnt/c/dev/schwepe/.deployment-issue.json', JSON.stringify(issue, null, 2));
    
  } else if (urlResults[0].status === 404) {
    console.log('❌ APPLICATION NOT DEPLOYED');
    console.log('🔧 Check Coolify configuration and redeploy');
    
  } else {
    console.log('⚠️  PARTIAL ISSUES DETECTED');
    console.log('🔧 Check individual components above');
  }

  console.log('\n🎯 QUICK ACTIONS:');
  console.log('  • Coolify Admin: https://coolify.247420.xyz');
  console.log('  • Main URL: https://schwepe.247420.xyz');
  console.log('  • Deploy: ./scripts/deploy-enhanced.sh');
  console.log('  • Monitor: node deployment-monitor.js');
}

main().catch(console.error);
