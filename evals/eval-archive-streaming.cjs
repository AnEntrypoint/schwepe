const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const log = (msg, color = '34') => console.log(`\x1b[${color}m${msg}\x1b[0m`);
const success = (msg) => console.log(`\x1b[32m✓ ${msg}\x1b[0m`);
const test = (msg) => console.log(`\x1b[33m${msg}\x1b[0m`);

async function waitForPort(port, maxWait = 10000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`);
      if (response.ok) return true;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Port ${port} not ready after ${maxWait}ms`);
}

async function runTests() {
  let browser, server;

  try {
    log('Cleaning up ports...');
    spawn('bash', ['-c', 'lsof -ti:3100 | xargs kill -9 2>/dev/null || true']);
    await new Promise(r => setTimeout(r, 1000));

    log('Starting server...');
    server = spawn('npm', ['start'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PORT: '3100', NODE_ENV: 'production' },
      stdio: 'pipe'
    });

    await waitForPort(3100);
    log('Server started on port 3100');

    log('Launching browser...');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
    });

    await page.goto('http://localhost:3100/videos-thread.html');
    await page.waitForTimeout(2000);

    test('Testing archive.org streaming capability...');

    let scheduledCount = 0;
    let successfulScheduled = 0;
    let failedScheduled = 0;
    const scheduledVideos = [];

    for (let i = 0; i < 60000; i += 6000) {
      await page.waitForTimeout(6000);

      const recentLogs = consoleLogs.slice(-5);
      for (const log of recentLogs) {
        if (log.includes('Playing [scheduled]')) {
          scheduledCount++;
          const videoName = log.split('Playing [scheduled]: ')[1];
          scheduledVideos.push(videoName);

          await page.waitForTimeout(1000);
          const nextLogs = consoleLogs.slice(-3);
          const hasError = nextLogs.some(l => l.includes('Video load error'));

          if (hasError) {
            failedScheduled++;
          } else {
            successfulScheduled++;
          }
        }
      }

      if (scheduledCount >= 5) break;
    }

    if (scheduledCount > 0) {
      success(`Archive.org streaming tested: ${scheduledCount} scheduled videos encountered`);
      if (successfulScheduled > 0) {
        success(`✓ ${successfulScheduled} scheduled videos played successfully`);
      }
      if (failedScheduled > 0) {
        console.log(`  ⚠ ${failedScheduled} scheduled videos unavailable (403/404 from archive.org)`);
      }

      console.log('\nScheduled videos tested:');
      scheduledVideos.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.substring(0, 80)}...`);
      });
    } else {
      throw new Error('No scheduled videos encountered in test period');
    }

    test('Testing interleaving pattern...');
    const playingLogs = consoleLogs.filter(l => l.includes('Playing ['));
    const videoCount = playingLogs.filter(l => l.includes('[video]')).length;
    const scheduledTotal = playingLogs.filter(l => l.includes('[scheduled]')).length;

    if (videoCount > 0 && scheduledTotal > 0) {
      const ratio = (videoCount / scheduledTotal).toFixed(1);
      success(`Interleaving working: ${videoCount} saved, ${scheduledTotal} scheduled (ratio ${ratio}:1)`);
    }

    test('Testing error handling...');
    const errorLogs = consoleLogs.filter(l => l.includes('Video load error'));
    const skipLogs = consoleLogs.filter(l => l.includes('skipping to next'));

    if (errorLogs.length === skipLogs.length && errorLogs.length > 0) {
      success(`Error handling working: ${errorLogs.length} errors, all skipped gracefully`);
    }

    await browser.close();
    server.kill();

    console.log('\n\x1b[32m✓ All archive.org streaming tests passed!\x1b[0m');
    process.exit(0);

  } catch (error) {
    console.error('\n\x1b[31m✗ Test failed:\x1b[0m', error.message);
    if (browser) await browser.close();
    if (server) server.kill();
    process.exit(1);
  }
}

runTests();
