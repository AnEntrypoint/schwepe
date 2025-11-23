/**
 * Playwright Helper Functions for Debug Hooks Testing
 * Common patterns and utilities for testing with Playwright
 * 
 * Usage:
 *   import { PlaywrightHelpers } from './evals/playwright-helpers.js'
 *   const helper = new PlaywrightHelpers(page)
 *   await helper.waitForDebugHooksReady()
 */

export class PlaywrightHelpers {
  constructor(page) {
    this.page = page;
    this.timeout = 10000;
  }

  /**
   * Wait for debug hooks to be initialized
   */
  async waitForDebugHooksReady() {
    return await this.page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const maxAttempts = 50;
        let attempts = 0;

        const checkReady = () => {
          attempts++;
          if (typeof window.__DEBUG !== 'undefined') {
            resolve(true);
          } else if (attempts < maxAttempts) {
            setTimeout(checkReady, 100);
          } else {
            reject(new Error('Debug hooks not initialized'));
          }
        };

        checkReady();
      });
    });
  }

  /**
   * Wait for videos to be loaded
   */
  async waitForVideosLoaded() {
    await this.waitForDebugHooksReady();

    return await this.page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const maxAttempts = 100;
        let attempts = 0;

        const checkLoaded = () => {
          attempts++;
          try {
            const state = window.__DEBUG.getPlaybackState();
            if (state.scheduledVideoCount > 0) {
              resolve(true);
            } else if (attempts < maxAttempts) {
              setTimeout(checkLoaded, 100);
            } else {
              reject(new Error('Videos not loaded'));
            }
          } catch (e) {
            reject(e);
          }
        };

        checkLoaded();
      });
    });
  }

  /**
   * Wait for health check to pass
   */
  async waitForHealthy() {
    await this.waitForDebugHooksReady();

    return await this.page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const maxAttempts = 50;
        let attempts = 0;

        const checkHealth = () => {
          attempts++;
          try {
            const health = window.__DEBUG.healthCheck();
            if (health.systems.playbackHandler && health.playback?.videosLoaded) {
              resolve(health);
            } else if (attempts < maxAttempts) {
              setTimeout(checkHealth, 100);
            } else {
              reject(new Error('System not healthy'));
            }
          } catch (e) {
            reject(e);
          }
        };

        checkHealth();
      });
    });
  }

  /**
   * Assert playback state matches expectations
   */
  async assertPlaybackState(expected) {
    const state = await this.page.evaluate(() => window.__DEBUG.getPlaybackState());

    const assertions = [];
    for (const [key, expectedValue] of Object.entries(expected)) {
      const actualValue = state[key];
      if (actualValue !== expectedValue) {
        assertions.push(`Expected ${key} to be ${expectedValue}, got ${actualValue}`);
      }
    }

    if (assertions.length > 0) {
      throw new Error(`Playback state assertions failed:\n${assertions.join('\n')}`);
    }

    return state;
  }

  /**
   * Assert video is currently playing
   */
  async assertVideoPlaying(shouldBePlaying = true) {
    const video = await this.page.evaluate(() => window.__DEBUG.getCurrentVideoInfo());

    if (shouldBePlaying && video.paused) {
      throw new Error(`Expected video to be playing, but it's paused`);
    }
    if (!shouldBePlaying && !video.paused) {
      throw new Error(`Expected video to be paused, but it's playing`);
    }

    return video;
  }

  /**
   * Assert video progress
   */
  async assertVideoProgress(minProgress = 0, maxProgress = 100) {
    const video = await this.page.evaluate(() => window.__DEBUG.getCurrentVideoInfo());

    if (!video.duration || video.duration === 0) {
      throw new Error('Video duration not available');
    }

    const progress = (video.currentTime / video.duration) * 100;

    if (progress < minProgress || progress > maxProgress) {
      throw new Error(`Expected progress between ${minProgress}% and ${maxProgress}%, got ${progress.toFixed(1)}%`);
    }

    return progress;
  }

  /**
   * Assert volume level
   */
  async assertVolume(expected) {
    const volume = await this.page.evaluate(() => window.__DEBUG.getVolume());

    if (Math.abs(volume.volume - expected) > 0.01) {
      throw new Error(`Expected volume ${expected}, got ${volume.volume}`);
    }

    return volume;
  }

  /**
   * Monitor video playback progression
   */
  async monitorPlayback(durationMs = 5000, interval = 1000) {
    const updates = [];
    const startTime = Date.now();

    while (Date.now() - startTime < durationMs) {
      const video = await this.page.evaluate(() => window.__DEBUG.getCurrentVideoInfo());
      updates.push({
        timestamp: new Date().toISOString(),
        ...video
      });

      await this.page.waitForTimeout(interval);
    }

    return updates;
  }

  /**
   * Get full debug report
   */
  async getDebugReport() {
    return await this.page.evaluate(() => window.__DEBUG.getDebugReport());
  }

  /**
   * Take state snapshot
   */
  async snapshot() {
    return {
      timestamp: new Date().toISOString(),
      playback: await this.page.evaluate(() => window.__DEBUG.getPlaybackState()),
      video: await this.page.evaluate(() => window.__DEBUG.getCurrentVideoInfo()),
      health: await this.page.evaluate(() => window.__DEBUG.healthCheck())
    };
  }

  /**
   * Compare two snapshots
   */
  compareSnapshots(snap1, snap2) {
    const changes = {};

    const compare = (obj1, obj2, path = '') => {
      const allKeys = new Set([
        ...Object.keys(obj1 || {}),
        ...Object.keys(obj2 || {})
      ]);

      allKeys.forEach(key => {
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];
        const fullPath = path ? `${path}.${key}` : key;

        if (val1 !== val2) {
          if (typeof val1 === 'object' && typeof val2 === 'object' && val1 && val2) {
            compare(val1, val2, fullPath);
          } else {
            changes[fullPath] = { from: val1, to: val2 };
          }
        }
      });
    };

    compare(snap1, snap2);
    return changes;
  }

  /**
   * Cycle through multiple videos
   */
  async cycleVideos(count = 5, delayMs = 500) {
    const videos = [];

    for (let i = 0; i < count; i++) {
      const video = await this.page.evaluate(() => window.__DEBUG.getCurrentVideoInfo());
      videos.push(video);

      if (i < count - 1) {
        await this.page.evaluate(() => window.__DEBUG.forceNextVideo());
        await this.page.waitForTimeout(delayMs);
      }
    }

    return videos;
  }

  /**
   * Test volume levels
   */
  async testVolumeLevels(levels = [0, 0.25, 0.5, 0.75, 1]) {
    const results = [];

    for (const level of levels) {
      await this.page.evaluate(({ vol }) => window.__DEBUG.setVolume(vol), { vol: level });
      const current = await this.page.evaluate(() => window.__DEBUG.getVolume());

      results.push({
        set: level,
        actual: current.volume,
        match: Math.abs(current.volume - level) < 0.01
      });

      await this.page.waitForTimeout(100);
    }

    return results;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    const cache = await this.page.evaluate(() => window.__DEBUG.getDurationCache());

    const durations = Object.values(cache.cache || {});
    const stats = {
      size: cache.size,
      min: Math.min(...durations),
      max: Math.max(...durations),
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      total: durations.reduce((a, b) => a + b, 0)
    };

    return stats;
  }

  /**
   * Get video lists
   */
  async getVideoLists(limit = 10) {
    const scheduled = await this.page.evaluate(({ l }) => window.__DEBUG.listScheduledVideos(l), { l: limit });
    const filler = await this.page.evaluate(({ l }) => window.__DEBUG.listFillerVideos(l), { l: limit });

    return { scheduled, filler };
  }

  /**
   * Verify video transition
   */
  async verifyVideoTransition(timeout = 5000) {
    const startVideo = await this.page.evaluate(() => window.__DEBUG.getCurrentVideoInfo());

    await this.page.evaluate(() => window.__DEBUG.forceNextVideo());

    let transitioned = false;
    const startTime = Date.now();

    while (!transitioned && Date.now() - startTime < timeout) {
      const currentVideo = await this.page.evaluate(() => window.__DEBUG.getCurrentVideoInfo());

      if (currentVideo.index !== startVideo.index) {
        transitioned = true;
        return currentVideo;
      }

      await this.page.waitForTimeout(100);
    }

    throw new Error('Video did not transition within timeout');
  }

  /**
   * Get inspection history
   */
  async getInspectionHistory(limit = 20) {
    return await this.page.evaluate(({ l }) => window.__DEBUG.getInspectionHistory(l), { l: limit });
  }

  /**
   * Print formatted state to console
   */
  async printState() {
    const state = await this.snapshot();
    console.log('=== DEBUG STATE SNAPSHOT ===');
    console.log(JSON.stringify(state, null, 2));
    console.log('===========================');
    return state;
  }

  /**
   * Create a test report
   */
  async createTestReport(testName) {
    return {
      testName,
      timestamp: new Date().toISOString(),
      debugReport: await this.getDebugReport(),
      snapshot: await this.snapshot(),
      health: await this.page.evaluate(() => window.__DEBUG.healthCheck()),
      inspectionHistory: await this.getInspectionHistory(10)
    };
  }
}

export default PlaywrightHelpers;
