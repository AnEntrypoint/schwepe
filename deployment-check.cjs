#!/usr/bin/env node

const https = require('https');
const http = require('http');

const urls = {
  main: 'https://schwepe.247420.xyz',
  actual: 'https://c0s8g4k00oss8kkcoccs88g0.247420.xyz'
};

function checkUrl(url, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, { 
      timeout: 10000,
      rejectUnauthorized: false
    }, (res) => {
      resolve({
        name,
        url,
        status: res.statusCode,
        responseTime: Date.now() - startTime,
        success: res.statusCode < 400
      });
    });
    
    req.on('error', () => {
      resolve({
        name,
        url,
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        success: false
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        url,
        status: 'TIMEOUT',
        responseTime: 10000,
        success: false
      });
    });
  });
}

async function main() {
  console.log('⏰ Deployment Check -', new Date().toLocaleTimeString());
  console.log('─'.repeat(40));
  
  const [mainResult, actualResult] = await Promise.all([
    checkUrl(urls.main, 'Main URL'),
    checkUrl(urls.actual, 'Actual URL')
  ]);
  
  console.log(`🌐 ${mainResult.name}: ${mainResult.status} (${mainResult.responseTime}ms)`);
  console.log(`🔗 ${actualResult.name}: ${actualResult.status} (${actualResult.responseTime}ms)`);
  
  if (mainResult.success && actualResult.success) {
    console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
    console.log('🎉 All URLs accessible');
    
    const deployStatus = {
      timestamp: new Date().toISOString(),
      status: 'deployment-success',
      urls: urls,
      responseTimes: {
        main: mainResult.responseTime,
        actual: actualResult.responseTime
      },
      statusCodes: {
        main: mainResult.status,
        actual: actualResult.status
      }
    };
    
    require('fs').writeFileSync('/mnt/c/dev/schwepe/deployment-status.json', JSON.stringify(deployStatus, null, 2));
    
  } else {
    console.log('\n❌ DEPLOYMENT ISSUES DETECTED');
    
    let issue = 'unknown';
    if (mainResult.status === 404) {
      issue = 'deployment-incomplete';
      console.log('🔧 Main URL returns 404 - deployment may not be complete');
    } else if (mainResult.status >= 500) {
      issue = 'server-error';
      console.log('🔧 Server error - application running but has issues');
    } else if (mainResult.status === 502) {
      issue = 'coolify-permission-denied';
      console.log('🔧 502 Bad Gateway - permission/configuration issue');
    } else {
      console.log('🔧 Connection or other error detected');
    }
    
    const deployStatus = {
      timestamp: new Date().toISOString(),
      status: 'deployment-failed',
      issue: issue,
      urls: urls,
      errors: {
        main: mainResult.status === 'ERROR' ? 'Connection failed' : `HTTP ${mainResult.status}`,
        actual: actualResult.status === 'ERROR' ? 'Connection failed' : `HTTP ${actualResult.status}`
      },
      nextSteps: [
        'Check Coolify admin panel: https://coolify.247420.xyz',
        'Verify Dockerfile.coolify is selected',
        'Review deployment logs for specific errors',
        'Confirm all configuration changes are applied'
      ]
    };
    
    require('fs').writeFileSync('/mnt/c/dev/schwepe/deployment-status.json', JSON.stringify(deployStatus, null, 2));
  }
  
  console.log('\n🎯 COOLIFY CONFIGURATION CHECKLIST:');
  console.log('□ Dockerfile: Dockerfile.coolify');
  console.log('□ Build Command: npm run build');
  console.log('□ Start Command: npm start');
  console.log('□ Environment: NODE_ENV=production');
  console.log('□ Port: 3000');
  console.log('□ Health Check: /api/health');
  console.log('\n🌐 Coolify Admin: https://coolify.247420.xyz');
}

main().catch(console.error);