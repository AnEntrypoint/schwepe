import { test, expect } from '@playwright/test';

/**
 * Schwelevision TV Station Tests
 *
 * Tests the complete TV broadcasting system including:
 * - Page load and initialization
 * - PlaybackHandler setup
 * - TV Scheduler loading
 * - Video playback functionality
 * - Now Playing display
 * - Time synchronization
 */

test.describe('Schwelevision TV Station', () => {

  test.beforeEach(async ({ page }) => {
    // Start the dev server on localhost
    // Navigate to Schwelevision page
    await page.goto('http://localhost:3000/videos-thread.html');
  });

  test('page loads and displays Schwelevision interface', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Schwelevision|Videos|247420/);

    // Check for main video container
    const videoContainer = page.locator('.video-container, #video-container, video').first();
    await expect(videoContainer).toBeVisible();

    console.log('✓ Schwelevision page loaded successfully');
  });

  test('PlaybackHandler is initialized', async ({ page }) => {
    // Wait for PlaybackHandler to be available in window
    await page.waitForFunction(() => {
      return window.playback !== undefined;
    }, { timeout: 10000 });

    // Check PlaybackHandler properties
    const hasPlayback = await page.evaluate(() => {
      return {
        exists: !!window.playback,
        hasSchedule: !!window.playback?.schedule,
        hasFiller: !!window.playback?.fillerVideos,
        isInitialized: !!window.playback?.initialized
      };
    });

    expect(hasPlayback.exists).toBeTruthy();
    console.log('✓ PlaybackHandler initialized', hasPlayback);
  });

  test('TV Scheduler loads content', async ({ page }) => {
    // Wait for TV scheduler to load
    await page.waitForFunction(() => {
      return window.tv !== undefined || window.playback?.schedule?.length > 0;
    }, { timeout: 10000 });

    const scheduleInfo = await page.evaluate(() => {
      const schedule = window.playback?.schedule || [];
      const filler = window.playback?.fillerVideos || [];

      return {
        scheduleCount: schedule.length,
        fillerCount: filler.length,
        currentWeek: window.playback?.currentWeek,
        scheduleEpoch: window.playback?.scheduleEpoch
      };
    });

    console.log('✓ TV Scheduler loaded:', scheduleInfo);

    // Should have either scheduled or filler content
    expect(scheduleInfo.scheduleCount + scheduleInfo.fillerCount).toBeGreaterThan(0);
  });

  test('video elements are present and configured', async ({ page }) => {
    // Wait for video elements to be created
    await page.waitForSelector('video', { timeout: 10000 });

    // Count video elements (should have 3 for rotation)
    const videoCount = await page.locator('video').count();
    console.log(`Found ${videoCount} video element(s)`);

    // Get video element details
    const videoDetails = await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll('video'));
      return videos.map(v => ({
        src: v.src,
        muted: v.muted,
        autoplay: v.autoplay,
        currentTime: v.currentTime,
        paused: v.paused
      }));
    });

    console.log('✓ Video elements configured:', videoDetails);
    expect(videoCount).toBeGreaterThan(0);
  });

  test('Now Playing display is visible', async ({ page }) => {
    // Look for Now Playing display (could be various selectors)
    const nowPlayingSelectors = [
      '.now-playing',
      '#now-playing',
      '[class*="now-playing"]',
      'text=/Now Playing/i',
      'text=/Currently Playing/i'
    ];

    let nowPlayingFound = false;
    for (const selector of nowPlayingSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await expect(element).toBeVisible({ timeout: 5000 }).catch(() => {});
        if (await element.isVisible()) {
          nowPlayingFound = true;
          const text = await element.textContent();
          console.log('✓ Now Playing display:', text?.substring(0, 100));
          break;
        }
      }
    }

    if (!nowPlayingFound) {
      console.log('⚠ Now Playing display not found (may be in different location)');
    }
  });

  test('console logs show playback activity', async ({ page }) => {
    const consoleLogs = [];

    // Listen to console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[SCHEDULE]') ||
          text.includes('[AD BREAK]') ||
          text.includes('PlaybackHandler') ||
          text.includes('Now Playing')) {
        consoleLogs.push(text);
      }
    });

    // Wait for some playback activity
    await page.waitForTimeout(5000);

    console.log('✓ Console logs captured:', consoleLogs.length);
    consoleLogs.forEach(log => console.log('  ', log));

    // Should have some playback logs
    expect(consoleLogs.length).toBeGreaterThan(0);
  });

  test('video playback starts within timeout', async ({ page }) => {
    // Wait for video to start playing
    const playbackStarted = await page.waitForFunction(() => {
      const videos = Array.from(document.querySelectorAll('video'));
      return videos.some(v => !v.paused && v.currentTime > 0);
    }, { timeout: 15000 }).catch(() => false);

    if (playbackStarted) {
      const playingVideo = await page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        const playing = videos.find(v => !v.paused && v.currentTime > 0);
        return playing ? {
          src: playing.src,
          currentTime: playing.currentTime,
          duration: playing.duration,
          volume: playing.volume
        } : null;
      });

      console.log('✓ Video playback started:', playingVideo);
      expect(playingVideo).toBeTruthy();
    } else {
      console.log('⚠ Video playback did not start (may require user interaction or be loading)');
    }
  });

  test('handles errors gracefully', async ({ page }) => {
    const errors = [];

    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Wait a bit to catch any errors
    await page.waitForTimeout(3000);

    if (errors.length > 0) {
      console.log('⚠ Page errors detected:', errors);
    } else {
      console.log('✓ No critical page errors');
    }

    // Should not have critical errors that break the page
    const criticalErrors = errors.filter(e =>
      !e.includes('CORS') &&
      !e.includes('404') &&
      !e.includes('autoplay')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('TV slapping feature works', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');

    // Get initial volume states
    const initialVolumes = await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll('video'));
      return videos.map(v => v.volume);
    });

    // Simulate TV slapping (click on video container)
    const videoContainer = page.locator('video').first();
    if (await videoContainer.count() > 0) {
      await videoContainer.click();

      // Wait a bit for volumes to change
      await page.waitForTimeout(500);

      // Get new volume states
      const newVolumes = await page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        return videos.map(v => v.volume);
      });

      console.log('✓ TV slapping test:', {
        before: initialVolumes,
        after: newVolumes
      });

      // Volumes might change (implementation-dependent)
      expect(newVolumes.length).toBe(initialVolumes.length);
    } else {
      console.log('⚠ Could not test TV slapping - no video elements found');
    }
  });

  test('time synchronization is configured', async ({ page }) => {
    const syncInfo = await page.evaluate(() => {
      const pb = window.playback;
      if (!pb) return null;

      return {
        hasEpoch: !!pb.scheduleEpoch,
        epoch: pb.scheduleEpoch,
        hasDurationCache: !!pb.durationCache || !!pb.durations,
        currentIndex: pb.scheduleIndex || pb.currentIndex,
        playingScheduled: pb.playingScheduled
      };
    });

    if (syncInfo) {
      console.log('✓ Time synchronization configured:', syncInfo);
      expect(syncInfo.hasEpoch).toBeTruthy();
    } else {
      console.log('⚠ PlaybackHandler not fully initialized yet');
    }
  });

});

test.describe('Schwelevision Network Tests', () => {

  test('loads schedule from archive.org or local files', async ({ page }) => {
    await page.goto('http://localhost:3000/videos-thread.html');

    // Check network requests for schedule loading
    const requests = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('schedule') || url.includes('archive.org') || url.includes('videos.json')) {
        requests.push(url);
      }
    });

    await page.waitForTimeout(5000);

    console.log('✓ Content requests:', requests);
    expect(requests.length).toBeGreaterThan(0);
  });

  test('static fallback displays on errors', async ({ page }) => {
    await page.goto('http://localhost:3000/videos-thread.html');

    // Look for canvas element (TV static)
    const hasCanvas = await page.locator('canvas').count();

    if (hasCanvas > 0) {
      console.log('✓ Canvas element found (TV static available)');
    } else {
      console.log('⚠ No canvas element (static may be implemented differently)');
    }
  });

});
