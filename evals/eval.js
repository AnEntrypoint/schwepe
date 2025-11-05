import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let server;

const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

async function startServer() {
  return new Promise((resolve, reject) => {
    log('Starting server...', COLORS.BLUE);
    const projectRoot = path.join(__dirname, '..');
    server = spawn('npm', ['start'], {
      cwd: projectRoot,
      env: { ...process.env, PORT: '3100' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    server.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Server running on')) {
        setTimeout(() => resolve(), 2000);
      }
    });

    server.stderr.on('data', (data) => {
      const msg = data.toString();
      if (!msg.includes('DeprecationWarning')) {
        console.error(msg);
      }
    });

    setTimeout(() => reject(new Error('Server timeout')), 15000);
  });
}

async function stopServer() {
  if (server) {
    log('Stopping server...', COLORS.BLUE);
    server.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function testWithFetch(url, description) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    log(`✓ ${description}`, COLORS.GREEN);
    return await response.text();
  } catch (error) {
    throw new Error(`${description} failed: ${error.message}`);
  }
}

async function runBasicTests() {
  log('Testing health endpoint...', COLORS.YELLOW);
  const health = await testWithFetch('http://localhost:3100/api/health', 'Health endpoint');
  const healthJson = JSON.parse(health);
  if (healthJson.status !== 'ok') throw new Error('Health status not ok');

  log('Testing schwepe site...', COLORS.YELLOW);
  const schwepe = await testWithFetch('http://localhost:3100/', 'Schwepe homepage');
  if (!schwepe.includes('schwepe')) throw new Error('Schwepe content missing');

  log('Testing Schwelevision page...', COLORS.YELLOW);
  const videos = await testWithFetch('http://localhost:3100/videos-thread.html', 'Schwelevision page');
  if (!videos.includes('BROADCASTING')) throw new Error('Schwelevision content missing');

  log('Testing lore page...', COLORS.YELLOW);
  await testWithFetch('http://localhost:3100/lore.html', 'Lore page');

  log('Testing gallery page...', COLORS.YELLOW);
  await testWithFetch('http://localhost:3100/gallery.html', 'Gallery page');

  log('Testing images page...', COLORS.YELLOW);
  await testWithFetch('http://localhost:3100/images-thread.html', 'Images page');

  log('Testing navigation CSS...', COLORS.YELLOW);
  const css = await testWithFetch('http://localhost:3100/navbar.css', 'Navbar CSS');
  if (!css.includes('nav') && !css.includes('color')) throw new Error('Invalid CSS content');

  log('Testing playback handler...', COLORS.YELLOW);
  const handler = await testWithFetch('http://localhost:3100/playback-handler.js', 'Playback handler');
  if (!handler.includes('PlaybackHandler')) throw new Error('Invalid playback handler');

  log('Testing TV scheduler...', COLORS.YELLOW);
  const scheduler = await testWithFetch('http://localhost:3100/tv-scheduler.js', 'TV scheduler');
  if (!scheduler.includes('TVScheduler')) throw new Error('Invalid TV scheduler');

  log('Testing videos.json...', COLORS.YELLOW);
  const videosJson = await testWithFetch('http://localhost:3100/public/videos.json', 'Videos JSON');
  const videos_data = JSON.parse(videosJson);
  if (!Array.isArray(videos_data) || videos_data.length < 400) {
    throw new Error('Invalid videos.json');
  }
  log(`  Found ${videos_data.length} saved videos`, COLORS.BLUE);

  log('Testing schedule week 1...', COLORS.YELLOW);
  const week1 = await testWithFetch('http://localhost:3100/public/schedule_weeks/week_1.json', 'Week 1 schedule');
  const week1_data = JSON.parse(week1);
  if (!week1_data.v || typeof week1_data.v !== 'object') {
    throw new Error('Invalid week schedule format');
  }
  const scheduleCount = Object.keys(week1_data.v).length;
  log(`  Found ${scheduleCount} scheduled programs`, COLORS.BLUE);
}

async function runEvals() {
  try {
    await startServer();
    await runBasicTests();

    log('\n✓ All evals passed!', COLORS.GREEN);
    log('\nNote: For comprehensive UI testing including video playback rotation,', COLORS.YELLOW);
    log('colors, and interleaving, use Playwright MCP browser tests.', COLORS.YELLOW);
    process.exit(0);
  } catch (error) {
    log(`\n✗ Eval failed: ${error.message}`, COLORS.RED);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await stopServer();
  }
}

runEvals();
