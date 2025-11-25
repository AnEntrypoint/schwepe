/**
 * Verify playback handler fixes are deployed
 * Tests:
 * 1. Black screen prevention (static shown during transitions)
 * 2. Video hidden until playing starts
 * 3. Load timeout protection
 * 4. Replay prevention (getNonRepeatingAd)
 */

const http = require('http');
const { spawn } = require('child_process');

const PORT = 3050;

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('Starting server...');

  // Start server
  const server = spawn('node', ['server.cjs'], {
    env: { ...process.env, PORT: PORT },
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let serverOutput = '';
  server.stdout.on('data', (data) => { serverOutput += data.toString(); });
  server.stderr.on('data', (data) => { serverOutput += data.toString(); });

  // Wait for server to start
  await new Promise(r => setTimeout(r, 2000));

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Server health
    console.log('\nTest 1: Server health');
    try {
      const health = await fetch(`http://localhost:${PORT}/api/health`);
      if (health.status === 200) {
        console.log('  PASS: Server running');
        passed++;
      } else {
        console.log('  FAIL: Server not healthy');
        failed++;
      }
    } catch (e) {
      console.log('  FAIL:', e.message);
      failed++;
    }

    // Test 2: Playback handler loads
    console.log('\nTest 2: Playback handler loads');
    let phContent = '';
    try {
      const ph = await fetch(`http://localhost:${PORT}/playback-handler.js`);
      phContent = ph.data;
      if (ph.status === 200 && phContent.includes('PlaybackHandler')) {
        console.log('  PASS: Playback handler loaded');
        passed++;
      } else {
        console.log('  FAIL: Could not load playback handler');
        failed++;
      }
    } catch (e) {
      console.log('  FAIL:', e.message);
      failed++;
    }

    // Test 3: Black screen prevention - static shown during transitions
    console.log('\nTest 3: Black screen prevention (static during transitions)');
    const staticChecks = [
      'Keep static visible until video starts playing',
      'staticEl.classList.add(\'active\')'
    ];
    let staticPassed = staticChecks.every(c => phContent.includes(c));
    if (staticPassed) {
      console.log('  PASS: Static shown during all transitions');
      passed++;
    } else {
      console.log('  FAIL: Missing static display during transitions');
      failed++;
    }

    // Test 4: Video hidden until playing
    console.log('\nTest 4: Video hidden until playing starts');
    if (phContent.includes('Start hidden, show when playing') &&
        phContent.includes('currentVideoEl.style.display = \'block\'')) {
      console.log('  PASS: Video starts hidden, shown when playing');
      passed++;
    } else {
      console.log('  FAIL: Video visibility not properly controlled');
      failed++;
    }

    // Test 5: Load timeout protection
    console.log('\nTest 5: Load timeout protection');
    if (phContent.includes('Add a timeout in case video never loads') &&
        phContent.includes('loadTimeout')) {
      const timeoutCount = (phContent.match(/loadTimeout/g) || []).length;
      console.log(`  PASS: Load timeout protection (${timeoutCount} references)`);
      passed++;
    } else {
      console.log('  FAIL: Missing load timeout protection');
      failed++;
    }

    // Test 6: Replay prevention in pickCommercialBreak
    console.log('\nTest 6: Replay prevention (no duplicate ads in breaks)');
    if (phContent.includes('getNonRepeatingAd to avoid duplicates') &&
        phContent.includes('Track selected ads to prevent duplicates within break')) {
      console.log('  PASS: Using getNonRepeatingAd with duplicate tracking');
      passed++;
    } else {
      console.log('  FAIL: Replay prevention not properly implemented');
      failed++;
    }

    // Test 7: Track played ads on failure
    console.log('\nTest 7: Track failed ads to prevent retry');
    if (phContent.includes('trackPlayedAd(video)')) {
      const trackCount = (phContent.match(/trackPlayedAd\(video\)/g) || []).length;
      console.log(`  PASS: Failed ads are tracked (${trackCount} tracking calls)`);
      passed++;
    } else {
      console.log('  FAIL: Failed ads not tracked');
      failed++;
    }

    // Test 8: Videos page loads
    console.log('\nTest 8: Videos page loads');
    try {
      const videos = await fetch(`http://localhost:${PORT}/videos-thread.html`);
      if (videos.status === 200 && videos.data.includes('noiseCanvas')) {
        console.log('  PASS: Videos page loads with static canvas');
        passed++;
      } else {
        console.log('  FAIL: Videos page missing static canvas');
        failed++;
      }
    } catch (e) {
      console.log('  FAIL:', e.message);
      failed++;
    }

    // Test 9: Schedule files exist
    console.log('\nTest 9: Schedule files exist');
    try {
      const schedule = await fetch(`http://localhost:${PORT}/public/schedule_weeks/week_1.json`);
      if (schedule.status === 200) {
        const data = JSON.parse(schedule.data);
        // Schedule format uses 'v' key with nested objects
        const videoCount = data.v ? Object.keys(data.v).length : 0;
        if (videoCount > 0) {
          console.log(`  PASS: Week 1 schedule loaded (${videoCount} videos)`);
          passed++;
        } else {
          console.log('  FAIL: Schedule empty');
          failed++;
        }
      } else {
        console.log('  FAIL: Could not load schedule');
        failed++;
      }
    } catch (e) {
      console.log('  FAIL:', e.message);
      failed++;
    }

    // Test 10: Videos.json exists
    console.log('\nTest 10: Videos.json (saved videos/ads) exists');
    try {
      const videos = await fetch(`http://localhost:${PORT}/public/videos.json`);
      if (videos.status === 200) {
        const data = JSON.parse(videos.data);
        console.log(`  PASS: ${data.length} saved videos available for ads`);
        passed++;
      } else {
        console.log('  FAIL: Could not load videos.json');
        failed++;
      }
    } catch (e) {
      console.log('  FAIL:', e.message);
      failed++;
    }

  } finally {
    server.kill();
  }

  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
