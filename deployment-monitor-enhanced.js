#!/usr/bin/env node

import https from 'https';
import fs from 'fs';
import { setTimeout } from 'timers/promises';

// WFGY v2.0 Enhanced Configuration
const WFGY_CONFIG = {
  // Dynamic thresholds based on deployment state
  B_s: 0.85,           // Success threshold baseline
  theta_c: 0.75,       // Change threshold
  zeta_min: 0.10,      // Minimum progress
  omega: 1,            // Progress exponent
  
  // Adaptive timing
  baseTimeout: 10000,
  progressiveTimeout: [5000, 8000, 12000, 15000],
  checkIntervals: [5000, 8000, 10000, 15000],
  maxChecks: 18,       // Maximum monitoring cycles
  
  // Target URLs
  urls: {
    main: 'https://schwepe.247420.xyz',
    actual: 'https://c0s8g4k00oss8kkcoccs88g0.247420.xyz',
    admin: 'https://coolify.247420.xyz'
  },
  
  healthEndpoints: [
    'https://schwepe.247420.xyz/api/health',
    'https://c0s8g4k00oss8kkcoccs88g0.247420.xyz/api/health'
  ],
  
  // WFGY state tracking
  state: {
    previous_delta_s: null,
    attempts: 0,
    success_history: [],
    failure_patterns: [],
    convergence_zone: 'safe',
    continuous_mode: process.argv.includes('--continuous'),
    start_time: Date.now()
  }
};

function calculateDeltaS(current, target) {
  // Calculate delta_s = 1 - cos(I, G)
  const similarity = current === target ? 1 : (current >= 200 && target >= 200 ? 0.8 : 0.2);
  return 1 - similarity;
}

function determineZone(delta_s) {
  if (delta_s < 0.40) return 'safe';
  if (delta_s < 0.60) return 'transit';
  if (delta_s < 0.85) return 'risk';
  return 'danger';
}

function calculateProgress(delta_s, attempt) {
  const { zeta_min, omega, state } = WFGY_CONFIG;
  
  if (attempt === 1) {
    return zeta_min;
  }
  
  const prog = Math.max(zeta_min, state.previous_delta_s - delta_s);
  return Math.pow(prog, omega);
}

function adaptTimeout(attempt, delta_s) {
  const zone = determineZone(delta_s);
  const { progressiveTimeout } = WFGY_CONFIG;
  
  // Adaptive timeout based on zone and attempt
  if (zone === 'danger') {
    return progressiveTimeout[Math.min(attempt - 1, progressiveTimeout.length - 1)] * 1.5;
  }
  
  return progressiveTimeout[Math.min(attempt - 1, progressiveTimeout.length - 1)];
}

async function checkUrl(url, attempt = 1) {
  const delta_s = calculateDeltaS(404, 200); // Current 404 vs target 200
  const timeout = adaptTimeout(attempt, delta_s);
  
  try {
    const result = await new Promise((resolve, reject) => {
      const startTime = Date.now();
      const req = https.get(url, { 
        timeout,
        rejectUnauthorized: false
      }, (res) => {
        resolve({
          status: res.statusCode,
          responseTime: Date.now() - startTime,
          success: res.statusCode < 400,
          headers: res.headers,
          attempt
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
    
    // Update WFGY state
    const new_delta_s = calculateDeltaS(result.status, 200);
    WFGY_CONFIG.state.previous_delta_s = new_delta_s;
    WFGY_CONFIG.state.convergence_zone = determineZone(new_delta_s);
    
    return { ...result, url, delta_s: new_delta_s };
  } catch (error) {
    return {
      url,
      status: 'ERROR',
      responseTime: timeout,
      success: false,
      error: error.message,
      attempt,
      delta_s: 1.0 // Maximum delta for errors
    };
  }
}

function generateWFGYReport(results) {
  const { B_s, theta_c, state } = WFGY_CONFIG;
  const avgDeltaS = results.reduce((sum, r) => sum + (r.delta_s || 0), 0) / results.length;
  const zone = determineZone(avgDeltaS);
  
  // Calculate coupling coefficient
  const P = calculateProgress(avgDeltaS, state.attempts);
  const W_c = Math.max(-theta_c, Math.min(theta_c, B_s * P));
  
  return {
    zone,
    avgDeltaS,
    progress: P,
    coupling: W_c,
    recommendation: W_c < 0.5 * theta_c ? 'OPTIMAL' : 'NEEDS_ADJUSTMENT',
    convergence: state.convergence_zone
  };
}

async function performHealthCheck() {
  const urlResults = await Promise.all([
    checkUrl(WFGY_CONFIG.urls.main, WFGY_CONFIG.state.attempts),
    checkUrl(WFGY_CONFIG.urls.actual, WFGY_CONFIG.state.attempts),
    checkUrl(WFGY_CONFIG.urls.admin, WFGY_CONFIG.state.attempts)
  ]);

  const healthResults = await Promise.all([
    checkUrl(WFGY_CONFIG.healthEndpoints[0], WFGY_CONFIG.state.attempts),
    checkUrl(WFGY_CONFIG.healthEndpoints[1], WFGY_CONFIG.state.attempts)
  ]);

  return { urlResults, healthResults };
}

function displayResults(urlResults, healthResults, wfgyReport, checkNum) {
  const elapsedSeconds = Math.floor((Date.now() - WFGY_CONFIG.state.start_time) / 1000);
  
  console.log(`--- Deployment Check ${checkNum}/${WFGY_CONFIG.maxChecks} ---`);
  console.log(`Time elapsed: ${elapsedSeconds} seconds`);
  
  // Main site status
  const mainStatus = urlResults[0].status;
  const httpVersion = urlResults[0].headers?.['http-version'] || 'HTTP/2';
  console.log(`Site status: ${httpVersion} ${mainStatus}`);
  
  if (mainStatus === 404) {
    console.log('⏳ Deployment in progress (404 - expected during deployment)');
  } else if (mainStatus === 200) {
    console.log('✅ Deployment successful!');
  } else if (mainStatus === 502) {
    console.log('❌ Coolify configuration error');
  } else {
    console.log(`⚠️  Unexpected status: ${mainStatus}`);
  }
  
  // WFGY Analysis
  console.log(`🧠 WFGY Analysis: ${wfgyReport.zone} zone (Δs: ${wfgyReport.avgDeltaS.toFixed(3)})`);
  console.log(`📊 Progress: ${(wfgyReport.progress * 100).toFixed(1)}%`);
  console.log(`🔗 Coupling: ${wfgyReport.coupling.toFixed(3)}`);
  
  return mainStatus === 200;
}

async function main() {
  const startTime = Date.now();
  WFGY_CONFIG.state.attempts++;
  
  console.log('🧠 WFGY v2.0 ENHANCED DEPLOYMENT MONITOR');
  console.log('=====================================');
  console.log(`⏰ Start time: ${new Date().toLocaleString()}`);
  console.log(`🎯 Mode: ${WFGY_CONFIG.state.continuous_mode ? 'Continuous' : 'Single check'}`);
  console.log('');

  let deploymentSuccessful = false;
  let checkCount = 0;

  if (WFGY_CONFIG.state.continuous_mode) {
    console.log('🔄 Starting continuous monitoring...');
    
    while (checkCount < WFGY_CONFIG.maxChecks && !deploymentSuccessful) {
      checkCount++;
      WFGY_CONFIG.state.attempts = checkCount;
      
      const { urlResults, healthResults } = await performHealthCheck();
      const allResults = [...urlResults, ...healthResults];
      const wfgyReport = generateWFGYReport(allResults);
      
      deploymentSuccessful = displayResults(urlResults, healthResults, wfgyReport, checkCount);
      
      // Save status files
      if (deploymentSuccessful) {
        const status = {
          timestamp: new Date().toISOString(),
          status: 'operational',
          wfgy: wfgyReport,
          elapsed_seconds: Math.floor((Date.now() - WFGY_CONFIG.state.start_time) / 1000),
          checks_performed: checkCount
        };
        fs.writeFileSync('/mnt/c/dev/schwepe/.deployment-status.json', JSON.stringify(status, null, 2));
        console.log('\n✅ Deployment completed successfully!');
        break;
      }
      
      if (checkCount < WFGY_CONFIG.maxChecks) {
        const interval = WFGY_CONFIG.checkIntervals[Math.min(checkCount - 1, WFGY_CONFIG.checkIntervals.length - 1)];
        await setTimeout(interval);
      }
    }
    
    if (!deploymentSuccessful && checkCount >= WFGY_CONFIG.maxChecks) {
      console.log('\n❌ Deployment monitoring timeout - manual intervention required');
      const issue = {
        timestamp: new Date().toISOString(),
        status: 'timeout',
        error: 'Deployment did not complete within monitoring window',
        elapsed_seconds: Math.floor((Date.now() - WFGY_CONFIG.state.start_time) / 1000),
        checks_performed: checkCount,
        recommendation: 'Check Coolify logs and redeploy manually'
      };
      fs.writeFileSync('/mnt/c/dev/schwepe/.deployment-issue.json', JSON.stringify(issue, null, 2));
    }
    
  } else {
    // Single check mode
    const { urlResults, healthResults } = await performHealthCheck();
    const allResults = [...urlResults, ...healthResults];
    const wfgyReport = generateWFGYReport(allResults);
    
    displayResults(urlResults, healthResults, wfgyReport, 1);
  }

  console.log('\n🎯 QUICK ACTIONS:');
  console.log('  • Coolify Admin: https://coolify.247420.xyz');
  console.log('  • Main URL: https://schwepe.247420.xyz');
  console.log('  • Continuous monitor: node deployment-monitor-enhanced.js --continuous');
  console.log(`  • Total runtime: ${Date.now() - startTime}ms`);
}

main().catch(console.error);
