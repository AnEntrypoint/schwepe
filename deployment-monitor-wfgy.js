#!/usr/bin/env node

import https from 'https';
import fs from 'fs';

// WFGY v2.0 Adaptive Configuration
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
    convergence_zone: 'safe'
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

async function main() {
  const startTime = Date.now();
  WFGY_CONFIG.state.attempts++;
  
  console.log('🧠 WFGY v2.0 DEPLOYMENT MONITOR');
  console.log('==============================');
  console.log(`⏰ Check time: ${new Date().toLocaleString()}`);
  console.log(`🎯 Attempt: ${WFGY_CONFIG.state.attempts}`);
  console.log(`📊 Zone: ${WFGY_CONFIG.state.convergence_zone}`);
  console.log('');

  // Check main URLs with adaptive strategy
  console.log('🌐 ADAPTIVE URL STATUS:');
  const urlResults = await Promise.all([
    checkUrl(WFGY_CONFIG.urls.main, WFGY_CONFIG.state.attempts),
    checkUrl(WFGY_CONFIG.urls.actual, WFGY_CONFIG.state.attempts),
    checkUrl(WFGY_CONFIG.urls.admin, WFGY_CONFIG.state.attempts)
  ]);

  urlResults.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const name = result.url.includes('coolify') ? 'Admin' : 
                 result.url.includes('c0s8g4k') ? 'Actual' : 'Main';
    const zone = result.delta_s ? determineZone(result.delta_s) : 'unknown';
    console.log(`  ${icon} ${name}: ${result.status} (${result.responseTime}ms) [Δs: ${result.delta_s?.toFixed(3) || 'N/A'}] [${zone}]`);
  });

  // Check health endpoints
  console.log('\n🏥 HEALTH ENDPOINTS:');
  const healthResults = await Promise.all([
    checkUrl(WFGY_CONFIG.healthEndpoints[0], WFGY_CONFIG.state.attempts),
    checkUrl(WFGY_CONFIG.healthEndpoints[1], WFGY_CONFIG.state.attempts)
  ]);

  healthResults.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const name = result.url.includes('c0s8g4k') ? 'Actual Health' : 'Main Health';
    console.log(`  ${icon} ${name}: ${result.status}`);
  });

  // WFGY Analysis
  const allResults = [...urlResults, ...healthResults];
  const wfgyReport = generateWFGYReport(allResults);
  
  console.log('\n🧠 WFGY ANALYSIS:');
  console.log(`  📊 Convergence Zone: ${wfgyReport.zone}`);
  console.log(`  📈 Average Delta S: ${wfgyReport.avgDeltaS.toFixed(3)}`);
  console.log(`  ⚡ Progress: ${(wfgyReport.progress * 100).toFixed(1)}%`);
  console.log(`  🔗 Coupling: ${wfgyReport.coupling.toFixed(3)}`);
  console.log(`  🎯 Recommendation: ${wfgyReport.recommendation}`);

  // Adaptive response based on WFGY analysis
  console.log('\n🔧 ADAPTIVE RESPONSE:');
  
  const mainSuccess = urlResults[0].success;
  const healthSuccess = healthResults.some(h => h.success);
  
  if (mainSuccess && healthSuccess) {
    console.log('✅ DEPLOYMENT OPERATIONAL');
    WFGY_CONFIG.state.success_history.push(Date.now());
    
    const status = {
      timestamp: new Date().toISOString(),
      status: 'operational',
      wfgy: wfgyReport,
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
    
  } else if (wfgyReport.zone === 'danger') {
    console.log('⚠️  DANGER ZONE - ADAPTIVE ESCALATION');
    console.log('🔧 Immediate action required');
    
    // Save issue for recovery
    const issue = {
      timestamp: new Date().toISOString(),
      status: 'wfgy-danger-zone',
      wfgy: wfgyReport,
      error: 'Deployment in danger zone',
      recommendation: 'Check Coolify configuration and escalate',
      urls: urlResults.map(r => ({
        url: r.url,
        status: r.status,
        delta_s: r.delta_s
      }))
    };
    fs.writeFileSync('/mnt/c/dev/schwepe/.deployment-issue.json', JSON.stringify(issue, null, 2));
    
  } else if (urlResults[0].status === 502 || urlResults[1].status === 502) {
    console.log('❌ COOLIFY PERMISSION ISSUES');
    console.log('🔧 Fix server permissions: /data/coolify/applications/');
    
  } else if (urlResults[0].status === 404) {
    console.log('❌ APPLICATION NOT DEPLOYED');
    console.log(`🔄 Estimated recovery time: ${wfgyReport.zone === 'transit' ? '2-5 min' : '5-10 min'}`);
    
  } else {
    console.log('⚠️  PARTIAL ISSUES DETECTED');
    console.log(`🎯 Adaptive strategy: ${wfgyReport.recommendation}`);
  }

  console.log('\n🎯 QUICK ACTIONS:');
  console.log('  • Coolify Admin: https://coolify.247420.xyz');
  console.log('  • Main URL: https://schwepe.247420.xyz');
  console.log('  • Deploy: ./scripts/deploy-enhanced.sh');
  console.log(`  • Next check in: ${WFGY_CONFIG.checkIntervals[Math.min(WFGY_CONFIG.state.attempts - 1, WFGY_CONFIG.checkIntervals.length - 1)] / 1000}s`);
  console.log(`  • Total runtime: ${Date.now() - startTime}ms`);
}

main().catch(console.error);
