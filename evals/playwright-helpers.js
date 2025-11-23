/**
 * Playwright Test Helpers for Schwelevision
 * Common patterns for testing debug hooks, page readiness, and video playback
 *
 * Usage with Playwright MCP or standalone Playwright tests
 */

/**
 * Page readiness detection - wait for Schwelevision to fully initialize
 */
export async function waitForPageReady(page, options = {}) {
  const {
    timeout = 30000,
    checkDebugUtils = true,
    checkVideoPlayer = true,
    checkScheduler = true
  } = options;

  const checks = [];

  // Wait for DOM content loaded
  checks.push(page.waitForLoadState('domcontentloaded', { timeout }));

  // Wait for Schwelevision global object
  checks.push(page.waitForFunction(() => {
    return typeof window.tv !== 'undefined' || typeof window.Schwelevision !== 'undefined';
  }, { timeout }));

  // Wait for video elements to be present
  if (checkVideoPlayer) {
    checks.push(page.waitForSelector('#currentVideo', { timeout }));
  }

  // Wait for debug utilities if enabled
  if (checkDebugUtils) {
    checks.push(page.waitForFunction(() => {
      return typeof window.debugUtils !== 'undefined' || typeof window.schwepeDebug !== 'undefined';
    }, { timeout }).catch(() => {
      // Debug utils may not be enabled, that's OK
      return null;
    }));
  }

  await Promise.all(checks);

  // Additional stabilization wait
  await page.waitForTimeout(500);

  return true;
}

/**
 * Wait for video playback to start
 */
export async function waitForVideoPlaying(page, options = {}) {
  const { timeout = 15000, videoSelector = '#currentVideo' } = options;

  await page.waitForFunction(
    (selector) => {
      const video = document.querySelector(selector);
      return video && !video.paused && video.currentTime > 0 && video.readyState >= 3;
    },
    videoSelector,
    { timeout }
  );

  return true;
}

/**
 * Wait for video to be buffered
 */
export async function waitForVideoBuffered(page, options = {}) {
  const { timeout = 30000, videoSelector = '#currentVideo', minBufferSeconds = 5 } = options;

  await page.waitForFunction(
    ({ selector, minBuffer }) => {
      const video = document.querySelector(selector);
      if (!video || !video.buffered || video.buffered.length === 0) return false;
      const buffered = video.buffered.end(video.buffered.length - 1) - video.currentTime;
      return buffered >= minBuffer;
    },
    { selector: videoSelector, minBuffer: minBufferSeconds },
    { timeout }
  );

  return true;
}

/**
 * Get current playback state
 */
export async function getPlaybackState(page) {
  return await page.evaluate(() => {
    const video = document.querySelector('#currentVideo');
    const nowPlaying = document.querySelector('#nowPlaying');
    const playback = window.playback || window.tv?.playback;

    return {
      isPlaying: video && !video.paused,
      currentTime: video?.currentTime || 0,
      duration: video?.duration || 0,
      buffered: video?.buffered?.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0,
      readyState: video?.readyState || 0,
      volume: video?.volume || 0,
      muted: video?.muted || false,
      src: video?.src || '',
      nowPlayingText: nowPlaying?.textContent || '',
      nowPlayingColor: nowPlaying?.style.color || '',
      scheduleIndex: playback?.scheduleIndex || 0,
      fillerIndex: playback?.fillerIndex || 0,
      playingScheduled: playback?.playingScheduled || false,
      showingStatic: playback?.showingStatic || false
    };
  });
}

/**
 * Get debug utilities state from page
 */
export async function getDebugState(page) {
  return await page.evaluate(() => {
    const debug = window.debugUtils || window.schwepeDebug;
    if (!debug || !debug.isEnabled || !debug.isEnabled()) {
      return { enabled: false };
    }

    return {
      enabled: true,
      report: debug.getReport ? debug.getReport() : null,
      hasSnapshots: debug.state?.getRecent(1).length > 0,
      networkStats: debug.network?.getStats() || null,
      errorCount: debug.errors?.getRecent(100).length || 0,
      perfStats: debug.perf?.getAllStats() || {}
    };
  });
}

/**
 * Take a state snapshot via debug utils
 */
export async function takeStateSnapshot(page, label = 'test') {
  return await page.evaluate((snapLabel) => {
    const debug = window.debugUtils || window.schwepeDebug;
    if (!debug || !debug.state) return null;

    const playback = window.playback || window.tv?.playback;
    if (!playback) return null;

    return debug.state.snapshot(snapLabel, {
      scheduleIndex: playback.scheduleIndex,
      fillerIndex: playback.fillerIndex,
      playingScheduled: playback.playingScheduled,
      showingStatic: playback.showingStatic,
      queueIndex: playback.queueIndex
    });
  }, label);
}

/**
 * Get console logs from the page
 */
export function setupConsoleCapture(page) {
  const logs = [];

  page.on('console', (msg) => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });

  return {
    getLogs: () => [...logs],
    getByType: (type) => logs.filter(l => l.type === type),
    clear: () => logs.length = 0,
    getVideoLogs: () => logs.filter(l =>
      l.text.includes('[SCHEDULE]') ||
      l.text.includes('[AD') ||
      l.text.includes('[FILLER]') ||
      l.text.includes('Completed') ||
      l.text.includes('error')
    )
  };
}

/**
 * State validation helpers
 */
export const StateValidators = {
  /**
   * Validate video element state
   */
  validateVideoElement: async (page, selector = '#currentVideo') => {
    const state = await page.evaluate((sel) => {
      const video = document.querySelector(sel);
      if (!video) return { valid: false, error: 'Video element not found' };

      return {
        valid: true,
        hasSource: !!video.src,
        isVisible: video.style.display !== 'none',
        readyState: video.readyState,
        networkState: video.networkState,
        error: video.error ? video.error.code : null
      };
    }, selector);

    return state;
  },

  /**
   * Validate playback handler state
   */
  validatePlaybackHandler: async (page) => {
    const state = await page.evaluate(() => {
      const playback = window.playback || window.tv?.playback;
      if (!playback) return { valid: false, error: 'PlaybackHandler not found' };

      return {
        valid: true,
        hasScheduledVideos: playback.scheduledVideos?.length > 0,
        hasSavedVideos: playback.savedVideos?.length > 0,
        scheduleIndex: playback.scheduleIndex,
        fillerIndex: playback.fillerIndex,
        videoQueueLength: playback.videoQueue?.length || 0
      };
    });

    return state;
  },

  /**
   * Validate debug utilities state
   */
  validateDebugUtils: async (page) => {
    const state = await page.evaluate(() => {
      const debug = window.debugUtils || window.schwepeDebug;
      if (!debug) return { valid: false, error: 'Debug utilities not found' };

      return {
        valid: true,
        isEnabled: debug.isEnabled ? debug.isEnabled() : false,
        hasState: !!debug.state,
        hasPerf: !!debug.perf,
        hasNetwork: !!debug.network,
        hasErrors: !!debug.errors
      };
    });

    return state;
  }
};

/**
 * Video playback assertions
 */
export const VideoAssertions = {
  /**
   * Assert video is playing
   */
  assertPlaying: async (page, options = {}) => {
    const state = await getPlaybackState(page);
    const assertions = [];

    if (!state.isPlaying) {
      assertions.push('Video is not playing');
    }
    if (state.currentTime === 0 && options.requireProgress !== false) {
      assertions.push('Video has not progressed (currentTime is 0)');
    }
    if (state.readyState < 3) {
      assertions.push(`Video not ready (readyState: ${state.readyState}, need >= 3)`);
    }

    return {
      passed: assertions.length === 0,
      assertions,
      state
    };
  },

  /**
   * Assert scheduled content is playing
   */
  assertScheduledPlaying: async (page) => {
    const state = await getPlaybackState(page);
    const assertions = [];

    if (!state.playingScheduled) {
      assertions.push('Not playing scheduled content');
    }
    if (!state.nowPlayingColor.includes('ffff00')) {
      assertions.push(`Wrong now-playing color (expected yellow, got ${state.nowPlayingColor})`);
    }

    return {
      passed: assertions.length === 0,
      assertions,
      state
    };
  },

  /**
   * Assert filler/ad content is playing
   */
  assertFillerPlaying: async (page) => {
    const state = await getPlaybackState(page);
    const assertions = [];

    if (state.playingScheduled) {
      assertions.push('Playing scheduled content instead of filler');
    }
    if (!state.nowPlayingColor.includes('00ffff')) {
      assertions.push(`Wrong now-playing color (expected cyan, got ${state.nowPlayingColor})`);
    }

    return {
      passed: assertions.length === 0,
      assertions,
      state
    };
  },

  /**
   * Assert video transition occurred
   */
  assertTransition: async (page, previousState) => {
    const currentState = await getPlaybackState(page);
    const assertions = [];

    if (currentState.src === previousState.src && currentState.scheduleIndex === previousState.scheduleIndex) {
      assertions.push('No video transition occurred (same source and index)');
    }

    return {
      passed: assertions.length === 0,
      assertions,
      previousState,
      currentState
    };
  }
};

/**
 * Debug overlay interaction helpers
 */
export const DebugOverlay = {
  /**
   * Toggle debug overlay
   */
  toggle: async (page) => {
    await page.keyboard.down('Control');
    await page.keyboard.press('d');
    await page.keyboard.up('Control');
    await page.waitForTimeout(100);
  },

  /**
   * Check if debug overlay is visible
   */
  isVisible: async (page) => {
    return await page.evaluate(() => {
      const overlay = document.getElementById('schwepe-debug-overlay');
      return overlay && overlay.style.display !== 'none';
    });
  },

  /**
   * Get debug overlay content
   */
  getContent: async (page) => {
    return await page.evaluate(() => {
      const overlay = document.getElementById('schwepe-debug-overlay');
      if (!overlay) return null;

      return {
        visible: overlay.style.display !== 'none',
        innerHTML: overlay.innerHTML,
        metrics: {
          fps: overlay.querySelector('[data-metric="fps"]')?.textContent,
          scheduleIndex: overlay.querySelector('[data-metric="scheduleIndex"]')?.textContent,
          networkRequests: overlay.querySelector('[data-metric="networkRequests"]')?.textContent
        }
      };
    });
  }
};

/**
 * Test scenario helpers
 */
export const TestScenarios = {
  /**
   * Test basic playback flow
   */
  testBasicPlayback: async (page, options = {}) => {
    const results = { steps: [], passed: true };

    try {
      // Step 1: Wait for page ready
      results.steps.push({ name: 'pageReady', status: 'running' });
      await waitForPageReady(page, options);
      results.steps[results.steps.length - 1].status = 'passed';

      // Step 2: Validate video element
      results.steps.push({ name: 'validateVideo', status: 'running' });
      const videoValid = await StateValidators.validateVideoElement(page);
      results.steps[results.steps.length - 1].status = videoValid.valid ? 'passed' : 'failed';
      results.steps[results.steps.length - 1].data = videoValid;

      // Step 3: Wait for video playing
      results.steps.push({ name: 'videoPlaying', status: 'running' });
      await waitForVideoPlaying(page, { timeout: options.timeout || 20000 });
      results.steps[results.steps.length - 1].status = 'passed';

      // Step 4: Assert playback
      results.steps.push({ name: 'assertPlayback', status: 'running' });
      const playbackAssert = await VideoAssertions.assertPlaying(page);
      results.steps[results.steps.length - 1].status = playbackAssert.passed ? 'passed' : 'failed';
      results.steps[results.steps.length - 1].data = playbackAssert;

    } catch (error) {
      results.passed = false;
      results.steps[results.steps.length - 1].status = 'failed';
      results.steps[results.steps.length - 1].error = error.message;
    }

    results.passed = results.steps.every(s => s.status === 'passed');
    return results;
  },

  /**
   * Test debug utilities integration
   */
  testDebugUtils: async (page) => {
    const results = { steps: [], passed: true };

    try {
      // Step 1: Validate debug utils present
      results.steps.push({ name: 'validateDebugUtils', status: 'running' });
      const debugValid = await StateValidators.validateDebugUtils(page);
      results.steps[results.steps.length - 1].status = debugValid.valid ? 'passed' : 'failed';
      results.steps[results.steps.length - 1].data = debugValid;

      if (!debugValid.valid || !debugValid.isEnabled) {
        results.passed = false;
        return results;
      }

      // Step 2: Take snapshot
      results.steps.push({ name: 'takeSnapshot', status: 'running' });
      const snapshotId = await takeStateSnapshot(page, 'test-snapshot');
      results.steps[results.steps.length - 1].status = snapshotId ? 'passed' : 'failed';
      results.steps[results.steps.length - 1].data = { snapshotId };

      // Step 3: Get debug state
      results.steps.push({ name: 'getDebugState', status: 'running' });
      const debugState = await getDebugState(page);
      results.steps[results.steps.length - 1].status = debugState.enabled ? 'passed' : 'failed';
      results.steps[results.steps.length - 1].data = debugState;

    } catch (error) {
      results.passed = false;
      results.steps[results.steps.length - 1].status = 'failed';
      results.steps[results.steps.length - 1].error = error.message;
    }

    results.passed = results.steps.every(s => s.status === 'passed');
    return results;
  }
};

export default {
  waitForPageReady,
  waitForVideoPlaying,
  waitForVideoBuffered,
  getPlaybackState,
  getDebugState,
  takeStateSnapshot,
  setupConsoleCapture,
  StateValidators,
  VideoAssertions,
  DebugOverlay,
  TestScenarios
};
