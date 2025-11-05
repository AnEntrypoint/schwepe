import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let server;
let serverPort = null;
let browser;
let context;

const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

async function cleanupPorts() {
  return new Promise((resolve) => {
    const cleanup = spawn('sh', ['-c', 'lsof -ti:3100,3101,3102,3103,3104,3105,3106,3107,3108,3109 2>/dev/null | xargs -r kill -9 2>/dev/null || true']);
    let resolved = false;

    cleanup.on('close', () => {
      if (!resolved) {
        resolved = true;
        setTimeout(resolve, 1500);
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, 4000);
  });
}

async function startServer() {
  log('Cleaning up ports...', COLORS.BLUE);
  await cleanupPorts();

  return new Promise((resolve, reject) => {
    log('Starting server...', COLORS.BLUE);
    const projectRoot = path.join(__dirname, '..');
    let resolved = false;

    server = spawn('npm', ['start'], {
      cwd: projectRoot,
      env: { ...process.env, PORT: '3100' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let errOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
      if (!resolved && output.includes('Server running on')) {
        const match = output.match(/http:\/\/0\.0\.0\.0:(\d+)/);
        if (match) {
          serverPort = parseInt(match[1]);
          log(`Server started on port ${serverPort}`, COLORS.BLUE);
          resolved = true;
          setTimeout(() => resolve(), 2000);
        }
      }
    });

    server.stderr.on('data', (data) => {
      const msg = data.toString();
      errOutput += msg;
      if (!msg.includes('DeprecationWarning') && !msg.includes('ExperimentalWarning')) {
        console.error(msg);
      }
      if (!resolved && errOutput.includes('Could not find an available port')) {
        resolved = true;
        reject(new Error('All ports 3100-3109 in use'));
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Server timeout'));
      }
    }, 25000);
  });
}

async function stopServer() {
  if (server) {
    log('Stopping server...', COLORS.BLUE);
    server.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function initBrowser() {
  log('Launching browser...', COLORS.BLUE);
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
}

async function closeBrowser() {
  if (context) await context.close();
  if (browser) await browser.close();
}

async function testSchwelevisionInit() {
  log('Testing Schwelevision initialization...', COLORS.YELLOW);
  const page = await context.newPage();
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  await page.goto(`http://localhost:${serverPort}/videos-thread.html`);
  await page.waitForTimeout(4000);

  const initLog = logs.find(l => l.includes('Schwelevision System initialized'));
  if (!initLog) throw new Error('Schwelevision not initialized');

  const videosLog = logs.find(l => l.includes('Videos loaded'));
  if (!videosLog) throw new Error('Videos not loaded');

  log('✓ Schwelevision initializes', COLORS.GREEN);
  await page.close();
}

async function testVideoLibraryLoading() {
  log('Testing video library loading...', COLORS.YELLOW);
  const page = await context.newPage();
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  await page.goto(`http://localhost:${serverPort}/videos-thread.html`);
  await page.waitForTimeout(4000);

  const loadLog = logs.find(l => l.includes('Videos loaded:'));
  if (!loadLog) throw new Error('Video load log not found');

  const match = loadLog.match(/saved: (\d+), scheduled: (\d+), total: (\d+)/);
  if (!match) throw new Error('Invalid video counts format');

  const [, saved, scheduled, total] = match;
  const savedCount = parseInt(saved);
  const scheduledCount = parseInt(scheduled);
  const totalCount = parseInt(total);

  if (savedCount < 400) throw new Error(`Not enough saved videos: ${savedCount}`);
  if (scheduledCount < 300) throw new Error(`Not enough scheduled videos: ${scheduledCount}`);
  if (totalCount !== savedCount + scheduledCount) throw new Error('Total count mismatch');

  log(`✓ Video library loaded: ${savedCount} saved, ${scheduledCount} scheduled`, COLORS.GREEN);
  await page.close();
}

async function testVideoRotation() {
  log('Testing video rotation...', COLORS.YELLOW);
  const page = await context.newPage();
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  await page.goto(`http://localhost:${serverPort}/videos-thread.html`);
  await page.waitForTimeout(3000);

  const initialLogs = logs.length;
  await page.waitForTimeout(18000);

  const playLogs = logs.filter(l => l.includes('Playing ['));
  if (playLogs.length < 3) throw new Error(`Not enough video transitions: ${playLogs.length}`);

  log(`✓ Video rotation working: ${playLogs.length} transitions`, COLORS.GREEN);
  await page.close();
}

async function testVideoTypeInterleaving() {
  log('Testing video type interleaving...', COLORS.YELLOW);
  const page = await context.newPage();
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  await page.goto(`http://localhost:${serverPort}/videos-thread.html`);
  await page.waitForTimeout(30000);

  const playLogs = logs.filter(l => l.includes('Playing ['));
  const savedVideos = playLogs.filter(l => l.includes('[video]'));
  const scheduledVideos = playLogs.filter(l => l.includes('[scheduled]'));

  if (savedVideos.length === 0) throw new Error('No saved videos playing');
  if (scheduledVideos.length === 0) throw new Error('No scheduled videos playing');

  const ratio = savedVideos.length / scheduledVideos.length;
  if (ratio < 0.5 || ratio > 3) {
    throw new Error(`Bad interleaving ratio: ${ratio.toFixed(2)}`);
  }

  log(`✓ Both video types playing: ${savedVideos.length} saved, ${scheduledVideos.length} scheduled`, COLORS.GREEN);
  await page.close();
}

async function testColorCoding() {
  log('Testing color coding...', COLORS.YELLOW);
  const page = await context.newPage();
  const logs = [];
  const colors = new Set();

  page.on('console', msg => logs.push(msg.text()));

  await page.goto(`http://localhost:${serverPort}/videos-thread.html`);
  await page.waitForTimeout(5000);

  for (let i = 0; i < 6; i++) {
    const el = await page.locator('#currentVideo').first();
    const bgColor = await el.evaluate(e => e.style.backgroundColor);
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
      colors.add(bgColor);
    }
    await page.waitForTimeout(5000);
  }

  if (colors.size === 0) throw new Error('No background colors detected');
  if (colors.size < 2) throw new Error('Only one color detected, expected cyan and yellow');

  const hasYellow = Array.from(colors).some(c =>
    c.includes('255, 255, 0') || c.includes('rgb(255, 255, 0)')
  );
  const hasCyan = Array.from(colors).some(c =>
    c.includes('0, 255, 255') || c.includes('rgb(0, 255, 255)')
  );

  if (!hasYellow || !hasCyan) {
    throw new Error(`Missing expected colors. Found: ${Array.from(colors).join(', ')}`);
  }

  log('✓ Color coding working: cyan and yellow detected', COLORS.GREEN);
  await page.close();
}

async function testDisplayUpdates() {
  log('Testing display updates...', COLORS.YELLOW);
  const page = await context.newPage();

  await page.goto(`http://localhost:${serverPort}/videos-thread.html`);
  await page.waitForTimeout(3000);

  const el = await page.locator('#currentVideo').first();
  const initialText = await el.textContent();

  if (!initialText || initialText.trim() === '') {
    throw new Error('Initial video display is empty');
  }

  await page.waitForTimeout(6000);
  const updatedText = await el.textContent();

  if (initialText === updatedText) {
    throw new Error('Video display not updating');
  }

  if (!updatedText.includes('Now:')) {
    throw new Error('Invalid display format');
  }

  log('✓ Display updates correctly', COLORS.GREEN);
  await page.close();
}

async function testScheduledContentFormat() {
  log('Testing scheduled content format...', COLORS.YELLOW);
  const page = await context.newPage();
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  await page.goto(`http://localhost:${serverPort}/videos-thread.html`);
  await page.waitForTimeout(30000);

  const scheduledLogs = logs.filter(l => l.includes('Playing [scheduled]'));
  if (scheduledLogs.length === 0) throw new Error('No scheduled content played');

  const hasDash = scheduledLogs.some(log => {
    const match = log.match(/Playing \[scheduled\]: (.+)/);
    return match && match[1].includes(' - ');
  });

  if (!hasDash) throw new Error('Scheduled content missing "Show - Episode" format');

  log('✓ Scheduled content uses "Show - Episode" format', COLORS.GREEN);
  await page.close();
}

async function testPlaybackTiming() {
  log('Testing playback timing...', COLORS.YELLOW);
  const page = await context.newPage();
  const logs = [];
  const timestamps = [];

  page.on('console', msg => {
    if (msg.text().includes('Playing [')) {
      timestamps.push(Date.now());
      logs.push(msg.text());
    }
  });

  await page.goto(`http://localhost:${serverPort}/videos-thread.html`);
  await page.waitForTimeout(20000);

  if (timestamps.length < 3) throw new Error('Not enough transitions to test timing');

  const intervals = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (avgInterval < 4500 || avgInterval > 6000) {
    throw new Error(`Timing off: average ${avgInterval}ms (expected ~5000ms)`);
  }

  log(`✓ Playback timing correct: ~${Math.round(avgInterval)}ms per video`, COLORS.GREEN);
  await page.close();
}

async function runTVEvals() {
  try {
    await startServer();
    await initBrowser();

    await testSchwelevisionInit();
    await testVideoLibraryLoading();
    await testVideoRotation();
    await testVideoTypeInterleaving();
    await testColorCoding();
    await testDisplayUpdates();
    await testScheduledContentFormat();
    await testPlaybackTiming();

    log('\n✓ All Schwelevision tests passed!', COLORS.GREEN);
    process.exit(0);
  } catch (error) {
    log(`\n✗ TV eval failed: ${error.message}`, COLORS.RED);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await closeBrowser();
    await stopServer();
  }
}

runTVEvals();
