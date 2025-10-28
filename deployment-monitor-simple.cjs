#!/usr/bin/env node

/**
 * Simplified Coolify Deployment Monitor
 * Focuses on local checks first, then minimal URL checks
 */

const fs = require('fs');

function simpleUrlCheck(url, timeout = 3000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      const http = require('url').parse(url).protocol === 'https:' ? require('https') : require('http');
      
      const req = http.get(url, { timeout }, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({
          url,
          status: res.statusCode,
          responseTime,
          success: res.statusCode < 400
        });
        res.destroy(); // Close connection immediately
      });
      
      req.on('error', () => {
        resolve({ url, success: false, error: 'Connection error' });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ url, success: false, error: 'Timeout' });
      });
      
      req.setTimeout(timeout);
    } catch (error) {
      resolve({ url, success: false, error: error.message });
    }
  });
}

async function main() {
  console.log('🚀 Coolify Deployment Monitor');
  console.log('============================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  // Local file checks
  console.log('📁 Local Deployment Status:');
  console.log('----------------------------');
  
  const files = {
    '.deployment-issue.json': false,
    'deployment-status.json': false,
    'build.log': false,
    'dist': false,
    'server.cjs': false
  };
  
  let localStatus = 0;
  
  for (const [file, _] of Object.entries(files)) {
    if (fs.existsSync(file)) {
      files[file] = true;
      const stats = fs.statSync(file);
      console.log(`✅ ${file} (modified: ${stats.mtime.toISOString()})`);
      localStatus++;
    } else {
      console.log(`❌ ${file} not found`);
    }
  }
  
  console.log(`\n📊 Local Status: ${localStatus}/${Object.keys(files).length} files found`);
  
  // Parse build.log if it exists
  if (files['build.log']) {
    try {
      const buildLog = JSON.parse(fs.readFileSync('build.log', 'utf8'));
      console.log(`📋 Build Info:`);
      console.log(`   Last build: ${buildLog.timestamp}`);
      console.log(`   Sites: ${buildLog.sites ? buildLog.sites.join(', ') : 'Unknown'}`);
      console.log(`   Success: ${buildLog.success ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ Could not parse build.log`);
    }
  }
  
  // Quick URL checks
  console.log('\n🌐 Quick URL Checks:');
  console.log('-------------------');
  
  const urls = [
    'https://schwepe.247420.xyz',
    'https://coolify.247420.xyz'
  ];
  
  let urlSuccess = 0;
  
  for (const url of urls) {
    console.log(`Checking ${url}...`);
    try {
      const result = await simpleUrlCheck(url, 2000);
      if (result.success) {
        console.log(`✅ ${url} - HTTP ${result.status} (${result.responseTime}ms)`);
        urlSuccess++;
      } else {
        console.log(`❌ ${url} - ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${url} - ${error.message}`);
    }
  }
  
  // Overall status
  console.log('\n🎯 Overall Status:');
  console.log('-----------------');
  
  const maxScore = Object.keys(files).length + urls.length;
  const currentScore = localStatus + urlSuccess;
  const percentage = Math.round((currentScore / maxScore) * 100);
  
  console.log(`Score: ${currentScore}/${maxScore} (${percentage}%)`);
  
  let status = '❌ FAILED';
  let exitCode = 1;
  
  if (percentage >= 80) {
    status = '✅ SUCCESS';
    exitCode = 0;
  } else if (percentage >= 50) {
    status = '⚠️  PARTIAL';
    exitCode = 0;
  }
  
  console.log(`Status: ${status}`);
  
  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    localFiles: files,
    urlChecks: { successful: urlSuccess, total: urls.length },
    score: { current: currentScore, max: maxScore, percentage },
    status: status.replace(/[✅❌⚠️]\s*/, '').trim()
  };
  
  fs.writeFileSync(`deployment-status-${Date.now()}.json`, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved`);
  
  process.exit(exitCode);
}

// Run with timeout protection
const timeout = setTimeout(() => {
  console.log('\n⏰ Monitor timeout - exiting with partial results');
  process.exit(0);
}, 15000);

main().finally(() => clearTimeout(timeout));

