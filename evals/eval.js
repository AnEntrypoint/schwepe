import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const http = require('http');

const PORT = 3051;

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function runTests() {
  const server = spawn('node', ['server.cjs'], {
    env: { ...process.env, PORT: String(PORT) },
    cwd: new URL('..', import.meta.url).pathname,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  server.stderr.on('data', (d) => process.stderr.write(d));

  await new Promise(r => setTimeout(r, 2000));

  const base = `http://localhost:${PORT}`;
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log('PASS:', name);
      passed++;
    } catch (err) {
      console.log('FAIL:', name, '-', err.message);
      failed++;
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg);
  }

  try {
    await test('health endpoint returns ok', async () => {
      const r = await get(`${base}/api/health`);
      assert(r.status === 200, `status ${r.status}`);
      const body = JSON.parse(r.data);
      assert(body.status === 'ok', 'status not ok');
    });

    await test('time endpoint returns serverTime', async () => {
      const r = await get(`${base}/api/time`);
      assert(r.status === 200, `status ${r.status}`);
      const body = JSON.parse(r.data);
      assert(typeof body.serverTime === 'number', 'serverTime not a number');
    });

    await test('index page loads', async () => {
      const r = await get(`${base}/`);
      assert(r.status === 200, `status ${r.status}`);
      assert(r.data.includes('<html') || r.data.includes('<!DOCTYPE'), 'no html tag');
    });

    await test('videos page loads with canvas', async () => {
      const r = await get(`${base}/videos-thread.html`);
      assert(r.status === 200, `status ${r.status}`);
      assert(r.data.includes('noiseCanvas'), 'missing noiseCanvas');
    });

    await test('playback-handler.js serves as JS', async () => {
      const r = await get(`${base}/playback-handler.js`);
      assert(r.status === 200, `status ${r.status}`);
      assert(r.headers['content-type'].includes('javascript'), 'wrong content-type');
      assert(r.data.includes('PlaybackHandler'), 'missing PlaybackHandler class');
    });

    await test('tv-scheduler.js serves correctly', async () => {
      const r = await get(`${base}/tv-scheduler.js`);
      assert(r.status === 200, `status ${r.status}`);
      assert(r.headers['content-type'].includes('javascript'), 'wrong content-type');
    });

    await test('videos.json exists with entries', async () => {
      const r = await get(`${base}/public/videos.json`);
      assert(r.status === 200, `status ${r.status}`);
      const data = JSON.parse(r.data);
      assert(Array.isArray(data) && data.length > 0, `got ${data.length} videos`);
    });

    await test('week_1.json schedule exists with content', async () => {
      const r = await get(`${base}/public/schedule_weeks/week_1.json`);
      assert(r.status === 200, `status ${r.status}`);
      const data = JSON.parse(r.data);
      const count = data.v ? Object.keys(data.v).length : 0;
      assert(count > 0, `schedule empty, got ${count} entries`);
    });

    await test('lib/debug-hooks.js serves correctly', async () => {
      const r = await get(`${base}/lib/debug-hooks.js`);
      assert(r.status === 200, `status ${r.status}`);
      assert(r.headers['content-type'].includes('javascript'), 'wrong content-type');
    });

  } finally {
    server.kill();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
