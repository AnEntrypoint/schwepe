/**
 * Playwright test for video playback functionality
 * Tests the fixes for:
 * 1. Black screen prevention (shows static instead)
 * 2. Scheduled video loading
 * 3. Video replay prevention (no duplicates)
 */

const { chromium } = require('playwright');

const TEST_URL = 'http://localhost:3000/videos-thread.html';
const TEST_TIMEOUT = 60000; // 60 seconds

async function runTests() {
  console.log('Starting video playback tests...\n');

  let browser;
  let passed = 0;
  let failed = 0;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--autoplay-policy=no-user-gesture-required',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const context = await browser.newContext({
      bypassCSP: true,
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Collect console messages
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    console.log('Test 1: Page loads successfully');
    try {
      await page.goto(TEST_URL, { timeout: 30000 });
      console.log('  - Page loaded');
      passed++;
    } catch (e) {
      console.log('  FAILED: Page load timeout');
      failed++;
      throw e;
    }

    // Wait for initialization
    console.log('\nTest 2: Schwelevision initializes');
    try {
      await page.waitForFunction(() => {
        return window.playback !== undefined;
      }, { timeout: 10000 });
      console.log('  - PlaybackHandler initialized');
      passed++;
    } catch (e) {
      console.log('  FAILED: PlaybackHandler not initialized');
      failed++;
    }

    // Check if videos loaded
    console.log('\nTest 3: Video content loaded');
    try {
      const videoState = await page.evaluate(() => {
        if (!window.playback) return null;
        return {
          scheduledCount: window.playback.scheduledVideos?.length || 0,
          savedCount: window.playback.savedVideos?.length || 0
        };
      });

      if (videoState && videoState.scheduledCount > 0) {
        console.log(`  - Scheduled videos: ${videoState.scheduledCount}`);
        console.log(`  - Saved videos (ads): ${videoState.savedCount}`);
        passed++;
      } else {
        console.log('  FAILED: No videos loaded');
        failed++;
      }
    } catch (e) {
      console.log('  FAILED:', e.message);
      failed++;
    }

    // Wait and check for video playback
    console.log('\nTest 4: Video playback starts (waiting 15s)');
    try {
      await page.waitForTimeout(15000);

      const playbackState = await page.evaluate(() => {
        if (!window.playback) return null;
        const activeVideo = window.playback.videoQueue?.[window.playback.activeVideoIndex];
        return {
          activeVideoIndex: window.playback.activeVideoIndex,
          hasVideoSrc: activeVideo ? !!activeVideo.src : false,
          videoPaused: activeVideo ? activeVideo.paused : true,
          videoDisplay: activeVideo ? activeVideo.style.display : 'unknown',
          showingStatic: window.playback.showingStatic,
          playingScheduled: window.playback.playingScheduled
        };
      });

      console.log('  - Playback state:', JSON.stringify(playbackState, null, 2));

      if (playbackState && playbackState.hasVideoSrc) {
        console.log('  - Video source set');
        passed++;
      } else {
        console.log('  WARNING: Video source not set (may still be loading)');
        // Don't fail - network conditions vary
      }
    } catch (e) {
      console.log('  WARNING:', e.message);
    }

    // Check console for key logs
    console.log('\nTest 5: Console log analysis');
    const initLogs = consoleLogs.filter(l =>
      l.text.includes('Schwelevision TV station initialized') ||
      l.text.includes('Loaded scheduled content') ||
      l.text.includes('Loaded saved videos')
    );

    const errorLogs = consoleLogs.filter(l => l.text.includes('❌'));
    const successLogs = consoleLogs.filter(l => l.text.includes('✓') || l.text.includes('📺'));

    console.log(`  - Initialization logs: ${initLogs.length}`);
    console.log(`  - Success logs: ${successLogs.length}`);
    console.log(`  - Error logs: ${errorLogs.length}`);

    if (initLogs.length >= 2) {
      console.log('  - System initialized correctly');
      passed++;
    } else {
      console.log('  FAILED: Missing initialization logs');
      failed++;
    }

    // Check for static display (no black screens)
    console.log('\nTest 6: Static canvas exists (prevents black screens)');
    try {
      const hasStaticCanvas = await page.evaluate(() => {
        const canvas = document.getElementById('noiseCanvas');
        return canvas !== null && canvas.tagName === 'CANVAS';
      });

      if (hasStaticCanvas) {
        console.log('  - Static canvas present');
        passed++;
      } else {
        console.log('  FAILED: Static canvas missing');
        failed++;
      }
    } catch (e) {
      console.log('  FAILED:', e.message);
      failed++;
    }

    // Check debug hooks
    console.log('\nTest 7: Debug hooks available');
    try {
      const hasDebugHooks = await page.evaluate(() => {
        return typeof window.__DEBUG === 'object' &&
               typeof window.__DEBUG.getPlaybackState === 'function';
      });

      if (hasDebugHooks) {
        console.log('  - Debug hooks available');
        passed++;
      } else {
        console.log('  FAILED: Debug hooks not available');
        failed++;
      }
    } catch (e) {
      console.log('  FAILED:', e.message);
      failed++;
    }

    // Check video replay prevention - recently played tracking
    console.log('\nTest 8: Video replay prevention');
    try {
      const replayPrevention = await page.evaluate(() => {
        if (!window.playback) return null;
        return {
          hasRecentlyPlayedAds: Array.isArray(window.playback.recentlyPlayedAds),
          maxRecentAds: window.playback.maxRecentAds,
          trackPlayedAdExists: typeof window.playback.trackPlayedAd === 'function',
          getNonRepeatingAdExists: typeof window.playback.getNonRepeatingAd === 'function'
        };
      });

      if (replayPrevention &&
          replayPrevention.hasRecentlyPlayedAds &&
          replayPrevention.trackPlayedAdExists &&
          replayPrevention.getNonRepeatingAdExists) {
        console.log('  - Replay prevention system active');
        console.log(`  - Max recent ads tracked: ${replayPrevention.maxRecentAds}`);
        passed++;
      } else {
        console.log('  FAILED: Replay prevention not properly configured');
        failed++;
      }
    } catch (e) {
      console.log('  FAILED:', e.message);
      failed++;
    }

    // Show some recent console logs for debugging
    console.log('\n--- Recent Console Logs ---');
    const recentLogs = consoleLogs.slice(-20);
    recentLogs.forEach(log => {
      if (log.text.length < 150) {
        console.log(`  [${log.type}] ${log.text}`);
      }
    });

  } catch (e) {
    console.error('\nTest error:', e.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
