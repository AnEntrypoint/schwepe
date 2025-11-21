#!/usr/bin/env node

/**
 * Debug script for Schwelevision TV page on localhost
 */

import { chromium } from 'playwright';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function debugVideosPage() {
  const url = 'http://localhost:3100/schwepe/videos-thread.html';
  log('blue', '\n🎬 Schwelevision TV Debug Session (localhost)');
  log('blue', '===============================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });

    // Log interesting messages immediately
    if (type === 'error') {
      log('red', `❌ Console Error: ${text}`);
    } else if (type === 'warning') {
      log('yellow', `⚠️  Console Warning: ${text}`);
    } else if (text.includes('✓') || text.includes('❌') || text.includes('📺')) {
      log('cyan', `   ${text}`);
    }
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    log('red', `❌ Page Error: ${error.message}`);
  });

  // Monitor failed requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    const failure = {
      url: request.url(),
      failure: request.failure()?.errorText || 'Unknown error'
    };
    failedRequests.push(failure);
    log('red', `❌ Failed Request: ${request.url()} - ${failure.failure}`);
  });

  try {
    log('cyan', `📡 Navigating to ${url}...`);
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    log('green', '✓ Page loaded successfully\n');

    // Wait for JavaScript to initialize
    await page.waitForTimeout(5000);

    // Check for critical elements
    log('cyan', '🔍 Checking page structure...');

    const hasContainer = await page.locator('.tv-container').count() > 0;
    log(hasContainer ? 'green' : 'red',
      hasContainer ? '✓ TV container found' : '❌ TV container missing');

    const videoCount = await page.locator('video').count();
    log(videoCount > 0 ? 'green' : 'red',
      videoCount > 0 ? `✓ Found ${videoCount} video elements` : '❌ No video elements found');

    const hasNowPlaying = await page.locator('.now-playing').count() > 0;
    log(hasNowPlaying ? 'green' : 'red',
      hasNowPlaying ? '✓ Now Playing display found' : '❌ Now Playing display missing');

    // Check window objects
    log('cyan', '\n🔍 Checking JavaScript initialization...');

    const playbackExists = await page.evaluate(() => typeof window.playback !== 'undefined');
    log(playbackExists ? 'green' : 'red',
      playbackExists ? '✓ window.playback initialized' : '❌ window.playback not found');

    // Get playback handler details
    if (playbackExists) {
      const playbackInfo = await page.evaluate(() => {
        const pb = window.playback;
        return {
          hasScheduledVideos: pb.scheduledVideos?.length > 0,
          scheduledCount: pb.scheduledVideos?.length || 0,
          hasFillerVideos: pb.fillerVideos?.length > 0,
          fillerCount: pb.fillerVideos?.length || 0,
          hasSavedVideos: pb.savedVideos?.length > 0,
          savedCount: pb.savedVideos?.length || 0,
          currentScheduleIndex: pb.scheduleIndex,
          playingScheduled: pb.playingScheduled,
          currentVideoSrc: pb.currentVideo?.src || 'none'
        };
      });

      log('cyan', '\n📊 Playback Handler Status:');
      log('blue', `   Scheduled Videos: ${playbackInfo.scheduledCount}`);
      log('blue', `   Saved Videos (ads): ${playbackInfo.savedCount}`);
      log('blue', `   Filler Videos: ${playbackInfo.fillerCount}`);
      log('blue', `   Current Index: ${playbackInfo.currentScheduleIndex}`);
      log('blue', `   Playing Scheduled: ${playbackInfo.playingScheduled}`);
      log('blue', `   Current Video: ${playbackInfo.currentVideoSrc.substring(0, 80)}...`);

      if (playbackInfo.scheduledCount === 0) {
        log('yellow', '⚠️  No scheduled videos loaded!');
      }
    }

    // Check video element status
    log('cyan', '\n🎥 Checking video element status...');
    const videoStatus = await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll('video'));
      return videos.map((v, i) => ({
        index: i,
        src: v.src?.substring(0, 80) || 'no src',
        readyState: v.readyState,
        networkState: v.networkState,
        paused: v.paused,
        muted: v.muted,
        currentTime: v.currentTime,
        duration: v.duration,
        error: v.error?.message || null
      }));
    });

    videoStatus.forEach(v => {
      log('blue', `   Video ${v.index}:`);
      log('blue', `      src: ${v.src}...`);
      log('blue', `      readyState: ${v.readyState} (0=nothing, 4=enough)`);
      log('blue', `      paused: ${v.paused}, time: ${v.currentTime.toFixed(1)}s / ${v.duration.toFixed(1)}s`);
      if (v.error) {
        log('red', `      ❌ error: ${v.error}`);
      }
    });

    // Summary
    log('cyan', '\n📋 Summary:');
    log('blue', `   Console messages: ${consoleMessages.length}`);
    log('blue', `   Errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
    log('blue', `   Warnings: ${consoleMessages.filter(m => m.type === 'warning').length}`);
    log('blue', `   Failed requests: ${failedRequests.length}`);
    log('blue', `   Page errors: ${pageErrors.length}`);

    if (failedRequests.length > 0) {
      log('red', '\n❌ Failed Requests:');
      failedRequests.forEach(req => {
        log('red', `   ${req.url}`);
      });
    }

    // Return summary
    return {
      success: pageErrors.length === 0 && failedRequests.length === 0,
      errors: pageErrors,
      failedRequests,
      consoleErrors: consoleMessages.filter(m => m.type === 'error'),
      warnings: consoleMessages.filter(m => m.type === 'warning')
    };

  } catch (error) {
    log('red', `\n❌ Fatal Error: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the debug session
debugVideosPage()
  .then(result => {
    if (result.success && result.errors.length === 0) {
      log('green', '\n✅ Debug session completed - No critical issues found!');
      process.exit(0);
    } else {
      log('yellow', '\n⚠️  Debug session completed - Issues detected (see above)');
      process.exit(1);
    }
  })
  .catch(error => {
    log('red', '\n❌ Debug session failed');
    console.error(error);
    process.exit(1);
  });
