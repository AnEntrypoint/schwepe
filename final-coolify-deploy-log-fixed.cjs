#!/usr/bin/env node

/**
 * Fixed Coolify Deployment Log Tool
 * 
 * This tool monitors deployment status with proper timeout handling
 * and works with the existing build system.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

function checkUrlWithTimeout(url, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, { 
      timeout: timeout,
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Coolify-Deploy-Monitor/1.0)'
      }
    }, (res) => {
      const responseTime = Date.now() - startTime;
      resolve({
        url,
        status: res.statusCode,
        responseTime,
        success: res.statusCode < 400,
        message: `HTTP ${res.statusCode}`
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        success: false,
        error: error.message,
        message: `Error: ${error.message}`
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        success: false,
        error: 'Timeout',
        message: 'Connection timeout'
      });
    });
    
    req.end();
  });
}

async function checkDeploymentStatus() {
  console.log('🚀 Coolify Deployment Status Tool');
  console.log('===============================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  // Method 1: Check local deployment files
  console.log('📋 Checking local deployment files...');
  const files = ['.deployment-issue.json', 'deployment-status.json', 'build.log'];
  
  let hasLocalInfo = false;
  const localFiles = {};
  
  for (const file of files) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const stats = fs.statSync(file);
        console.log(`✅ ${file} (modified: ${stats.mtime.toISOString()})`);
        
        // Try to parse JSON files
        if (file.endsWith('.json')) {
          try {
            localFiles[file] = JSON.parse(content);
            console.log(`   Parsed JSON: ${Object.keys(localFiles[file]).join(', ')}`);
          } catch (e) {
            console.log(`   Content: ${content.substring(0, 100)}...`);
          }
        } else {
          console.log(`   Content: ${content.substring(0, 100)}...`);
        }
        console.log('');
        hasLocalInfo = true;
      } else {
        console.log(`❌ ${file} not found`);
      }
    } catch (error) {
      console.log(`❌ Could not read ${file}: ${error.message}`);
    }
  }

  // Method 2: Check if build exists
  console.log('🏗️  Checking build artifacts...');
  const distExists = fs.existsSync('dist');
  const buildLogExists = fs.existsSync('build.log');
  
  console.log(`   dist directory: ${distExists ? '✅' : '❌'}`);
  console.log(`   build.log: ${buildLogExists ? '✅' : '❌'}`);
  
  if (buildLogExists) {
    try {
      const buildLog = JSON.parse(fs.readFileSync('build.log', 'utf8'));
      console.log(`   Last build: ${buildLog.timestamp || 'Unknown'}`);
      console.log(`   Sites built: ${buildLog.sites ? buildLog.sites.join(', ') : 'Unknown'}`);
      console.log(`   Build success: ${buildLog.success ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ Could not parse build.log`);
    }
  }
  console.log('');

  // Method 3: URL checks with proper timeout
  console.log('🌐 Checking deployment URLs...');
  const urls = [
    'https://schwepe.247420.xyz',
    'https://coolify.247420.xyz',
    'http://localhost:3000'  // Also check local server
  ];

  const urlChecks = [];
  
  for (const url of urls) {
    console.log(`   Checking ${url}...`);
    try {
      const result = await checkUrlWithTimeout(url, 5000);
      const icon = result.success ? '✅' : '❌';
      console.log(`   ${icon} ${url} - ${result.message}`);
      if (result.responseTime) {
        console.log(`      Response time: ${result.responseTime}ms`);
      }
      urlChecks.push(result);
    } catch (error) {
      console.log(`   ❌ ${url} - Error: ${error.message}`);
      urlChecks.push({
        url,
        success: false,
        error: error.message,
        message: `Error: ${error.message}`
      });
    }
  }

  console.log('\n📊 SUMMARY');
  console.log('==========');
  
  const successfulUrls = urlChecks.filter(u => u.success).length;
  console.log(`URL Status: ${successfulUrls}/${urlChecks.length} accessible`);
  console.log(`Local Files: ${hasLocalInfo ? 'Found' : 'Not found'}`);
  console.log(`Build Artifacts: ${distExists ? 'Present' : 'Missing'}`);
  
  // Determine overall status
  let overallStatus = 'Failed';
  let statusCode = 1;
  
  if (successfulUrls > 0) {
    overallStatus = 'Partial Success';
    statusCode = 0;
  }
  
  if (successfulUrls === urls.length) {
    overallStatus = 'Full Success';
    statusCode = 0;
  }
  
  if (hasLocalInfo && distExists) {
    overallStatus = 'Build Successful - Checking Deployment';
    statusCode = 0;
  }
  
  console.log(`Overall Status: ${overallStatus}`);
  
  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    localFilesFound: hasLocalInfo,
    localFiles: localFiles,
    buildArtifacts: {
      distExists,
      buildLogExists
    },
    urlChecks: urlChecks,
    summary: {
      accessibleUrls: successfulUrls,
      totalUrls: urlChecks.length,
      status: overallStatus
    }
  };
  
  const logFile = `deployment-status-${Date.now()}.json`;
  fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${logFile}`);
  
  console.log(`\n${overallStatus.includes('Success') ? '✅' : '❌'} DEPLOYMENT STATUS: ${overallStatus}`);
  
  // Exit with appropriate code
  process.exit(statusCode);
}

// Run the check
checkDeploymentStatus().catch(error => {
  console.error('❌ Fatal error in deployment check:', error);
  process.exit(1);
});

