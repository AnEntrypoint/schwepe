/**
 * Schwelevision Debug Console
 * Styled console output with tables, timers, and real-time monitoring
 * Production-safe with zero overhead when disabled
 */

const DEBUG_ENABLED = typeof window !== 'undefined' &&
  (localStorage.getItem('schwepe_debug') === 'true' || window.location.search.includes('debug=true'));

// Styled console colors
const STYLES = {
  header: 'background: #00f5ff; color: #0a0a0a; padding: 4px 8px; font-weight: bold; border-radius: 3px;',
  success: 'color: #00ff88; font-weight: bold;',
  warning: 'color: #ffbe0b; font-weight: bold;',
  error: 'color: #ff006e; font-weight: bold;',
  info: 'color: #00f5ff;',
  muted: 'color: #666;',
  schedule: 'background: #ffff00; color: #000; padding: 2px 6px; border-radius: 2px;',
  filler: 'background: #00ffff; color: #000; padding: 2px 6px; border-radius: 2px;',
  metric: 'color: #ff006e; font-family: monospace;',
  table: 'font-family: monospace; font-size: 11px;'
};

/**
 * Debug Console - Styled logging with visual enhancements
 */
export class DebugConsole {
  constructor() {
    this.enabled = DEBUG_ENABLED;
    this.timers = new Map();
    this.groups = [];
  }

  /**
   * Log with header style
   */
  header(message) {
    if (!this.enabled) return;
    console.log(`%c${message}`, STYLES.header);
  }

  /**
   * Log success message
   */
  success(message, ...args) {
    if (!this.enabled) return;
    console.log(`%c✓ ${message}`, STYLES.success, ...args);
  }

  /**
   * Log warning message
   */
  warn(message, ...args) {
    if (!this.enabled) return;
    console.log(`%c⚠ ${message}`, STYLES.warning, ...args);
  }

  /**
   * Log error message
   */
  error(message, ...args) {
    if (!this.enabled) return;
    console.log(`%c✗ ${message}`, STYLES.error, ...args);
  }

  /**
   * Log info message
   */
  info(message, ...args) {
    if (!this.enabled) return;
    console.log(`%c${message}`, STYLES.info, ...args);
  }

  /**
   * Log scheduled content event
   */
  schedule(message) {
    if (!this.enabled) return;
    console.log(`%c[SCHEDULE]%c ${message}`, STYLES.schedule, '');
  }

  /**
   * Log filler/ad content event
   */
  filler(message) {
    if (!this.enabled) return;
    console.log(`%c[AD/FILLER]%c ${message}`, STYLES.filler, '');
  }

  /**
   * Log a metric value
   */
  metric(name, value, unit = '') {
    if (!this.enabled) return;
    console.log(`%c${name}: %c${value}${unit}`, STYLES.muted, STYLES.metric);
  }

  /**
   * Start a timer
   */
  time(label) {
    if (!this.enabled) return;
    this.timers.set(label, performance.now());
  }

  /**
   * End a timer and log the result
   */
  timeEnd(label) {
    if (!this.enabled) return;
    const start = this.timers.get(label);
    if (start) {
      const duration = (performance.now() - start).toFixed(2);
      this.timers.delete(label);
      console.log(`%c⏱ ${label}: %c${duration}ms`, STYLES.muted, STYLES.metric);
    }
  }

  /**
   * Start a collapsible group
   */
  group(label, collapsed = true) {
    if (!this.enabled) return;
    this.groups.push(label);
    if (collapsed) {
      console.groupCollapsed(`%c${label}`, STYLES.header);
    } else {
      console.group(`%c${label}`, STYLES.header);
    }
  }

  /**
   * End the current group
   */
  groupEnd() {
    if (!this.enabled) return;
    console.groupEnd();
    this.groups.pop();
  }

  /**
   * Log a formatted table
   */
  table(data, columns = null) {
    if (!this.enabled) return;
    if (columns) {
      console.table(data, columns);
    } else {
      console.table(data);
    }
  }

  /**
   * Clear the console
   */
  clear() {
    if (!this.enabled) return;
    console.clear();
  }
}

/**
 * Real-time State Monitor - Live display of system state
 */
export class StateMonitor {
  constructor(options = {}) {
    this.enabled = DEBUG_ENABLED;
    this.interval = null;
    this.updateFrequency = options.updateFrequency || 1000;
    this.onUpdate = options.onUpdate || null;
    this.lastState = null;
  }

  /**
   * Start monitoring
   */
  start(getStateFunc) {
    if (!this.enabled) return;
    if (this.interval) this.stop();

    console.log('%c[STATE MONITOR] Started', STYLES.header);

    this.interval = setInterval(() => {
      try {
        const state = getStateFunc();
        this.displayState(state);
        this.lastState = state;
        if (this.onUpdate) this.onUpdate(state);
      } catch (e) {
        console.error('State monitor error:', e);
      }
    }, this.updateFrequency);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('%c[STATE MONITOR] Stopped', STYLES.header);
    }
  }

  /**
   * Display current state
   */
  displayState(state) {
    if (!this.enabled) return;

    console.clear();
    console.log('%c=== SCHWELEVISION STATE MONITOR ===', STYLES.header);
    console.log('%cTimestamp: %c' + new Date().toISOString(), STYLES.muted, STYLES.info);
    console.log('');

    if (state.playback) {
      console.log('%c[PLAYBACK]', STYLES.header);
      console.table({
        'Schedule Index': state.playback.scheduleIndex,
        'Filler Index': state.playback.fillerIndex,
        'Playing Scheduled': state.playback.playingScheduled ? 'Yes' : 'No',
        'Showing Static': state.playback.showingStatic ? 'Yes' : 'No',
        'Queue Index': state.playback.queueIndex
      });
    }

    if (state.video) {
      console.log('%c[VIDEO]', STYLES.header);
      console.table({
        'Playing': state.video.isPlaying ? 'Yes' : 'No',
        'Current Time': state.video.currentTime?.toFixed(1) + 's',
        'Duration': state.video.duration?.toFixed(1) + 's',
        'Buffered': state.video.buffered?.toFixed(1) + 's',
        'Volume': (state.video.volume * 100).toFixed(0) + '%',
        'Ready State': state.video.readyState
      });
    }

    if (state.performance) {
      console.log('%c[PERFORMANCE]', STYLES.header);
      console.table({
        'FPS': state.performance.fps,
        'Memory': state.performance.memory || 'N/A',
        'Network Requests': state.performance.networkRequests
      });
    }
  }
}

/**
 * Video Queue Visualizer - Display video queue state
 */
export class VideoQueueVisualizer {
  constructor() {
    this.enabled = DEBUG_ENABLED;
  }

  /**
   * Display the current video queue
   */
  display(playbackHandler) {
    if (!this.enabled || !playbackHandler) return;

    const dc = new DebugConsole();
    dc.group('VIDEO QUEUE', false);

    // Queue elements status
    const queueStatus = playbackHandler.videoQueue.map((video, i) => ({
      'Slot': i,
      'Active': i === (playbackHandler.queueIndex % 3) ? '>>>' : '',
      'Source': video.src ? video.src.split('/').pop()?.substring(0, 30) || 'none' : 'none',
      'Ready': video.readyState >= 3 ? 'Yes' : 'No',
      'Visible': video.style.display !== 'none' ? 'Yes' : 'No'
    }));

    console.table(queueStatus);

    // Schedule position
    dc.info(`Schedule Index: ${playbackHandler.scheduleIndex} / ${playbackHandler.scheduledVideos.length}`);
    dc.info(`Filler Index: ${playbackHandler.fillerIndex} / ${playbackHandler.savedVideos.length}`);

    // Current mode
    if (playbackHandler.playingScheduled) {
      dc.schedule('Currently playing scheduled content');
    } else if (playbackHandler.showingStatic) {
      dc.warn('Showing static');
    } else {
      dc.filler('Currently playing filler/ads');
    }

    dc.groupEnd();
  }

  /**
   * Display upcoming videos
   */
  displayUpcoming(playbackHandler, count = 5) {
    if (!this.enabled || !playbackHandler) return;

    const dc = new DebugConsole();
    dc.group('UPCOMING VIDEOS', true);

    // Upcoming scheduled
    const upcomingScheduled = [];
    for (let i = 0; i < Math.min(count, playbackHandler.scheduledVideos.length); i++) {
      const idx = (playbackHandler.scheduleIndex + i) % playbackHandler.scheduledVideos.length;
      const video = playbackHandler.scheduledVideos[idx];
      upcomingScheduled.push({
        '#': i === 0 ? 'CURRENT' : `+${i}`,
        'Show': video.show || video.title || 'Unknown',
        'Episode': video.episode || ''
      });
    }
    console.log('%cScheduled:', STYLES.schedule);
    console.table(upcomingScheduled);

    // Upcoming filler
    const upcomingFiller = [];
    for (let i = 0; i < Math.min(count, playbackHandler.savedVideos.length); i++) {
      const idx = (playbackHandler.fillerIndex + i) % playbackHandler.savedVideos.length;
      const video = playbackHandler.savedVideos[idx];
      upcomingFiller.push({
        '#': i === 0 ? 'NEXT' : `+${i}`,
        'File': (video.filename || video.title || 'Unknown').substring(0, 40)
      });
    }
    console.log('%cFiller/Ads:', STYLES.filler);
    console.table(upcomingFiller);

    dc.groupEnd();
  }
}

/**
 * Cache Statistics Display
 */
export class CacheStatsDisplay {
  constructor() {
    this.enabled = DEBUG_ENABLED;
  }

  /**
   * Display duration cache statistics
   */
  displayDurationCache(playbackHandler) {
    if (!this.enabled || !playbackHandler) return;

    const dc = new DebugConsole();
    dc.group('DURATION CACHE', true);

    const cache = playbackHandler.durationCache || {};
    const entries = Object.entries(cache);

    if (entries.length === 0) {
      dc.info('Cache is empty');
      dc.groupEnd();
      return;
    }

    const stats = {
      'Total Entries': entries.length,
      'Total Duration': this.formatDuration(entries.reduce((sum, [, d]) => sum + d, 0)),
      'Avg Duration': this.formatDuration(entries.reduce((sum, [, d]) => sum + d, 0) / entries.length),
      'Shortest': this.formatDuration(Math.min(...entries.map(([, d]) => d))),
      'Longest': this.formatDuration(Math.max(...entries.map(([, d]) => d)))
    };

    console.table(stats);

    // Top 10 longest
    const top10 = entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, duration]) => ({
        'Video ID': id.substring(0, 30),
        'Duration': this.formatDuration(duration)
      }));

    console.log('%cTop 10 Longest:', STYLES.info);
    console.table(top10);

    dc.groupEnd();
  }

  /**
   * Display preload cache statistics
   */
  displayPreloadCache(playbackHandler) {
    if (!this.enabled || !playbackHandler) return;

    const dc = new DebugConsole();
    dc.group('PRELOAD CACHE', true);

    const preloadedAds = playbackHandler.preloadedAds || new Map();

    const stats = {
      'Preloaded Ads': preloadedAds.size,
      'Scheduled Video': playbackHandler.preloadedScheduledVideo ? 'Loaded' : 'None',
      'Is Preloading': playbackHandler.isPreloadingScheduled ? 'Yes' : 'No'
    };

    console.table(stats);

    if (preloadedAds.size > 0) {
      const adList = [];
      preloadedAds.forEach((data, id) => {
        adList.push({
          'ID': id.substring(0, 30),
          'Ready State': data.element?.readyState || 0
        });
      });
      console.log('%cPreloaded Ads:', STYLES.filler);
      console.table(adList);
    }

    dc.groupEnd();
  }

  /**
   * Display localStorage statistics
   */
  displayLocalStorage() {
    if (!this.enabled || typeof localStorage === 'undefined') return;

    const dc = new DebugConsole();
    dc.group('LOCALSTORAGE', true);

    let totalSize = 0;
    const items = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('schwepe')) {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;
        items.push({
          'Key': key,
          'Size': this.formatBytes(size)
        });
      }
    }

    console.table(items);
    dc.metric('Total Schwepe Storage', this.formatBytes(totalSize));

    dc.groupEnd();
  }

  formatDuration(ms) {
    if (!ms || isNaN(ms)) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }
}

/**
 * Create complete debug console toolkit
 */
export function createDebugConsole() {
  const console = new DebugConsole();
  const stateMonitor = new StateMonitor();
  const queueVisualizer = new VideoQueueVisualizer();
  const cacheStats = new CacheStatsDisplay();

  return {
    log: console,
    monitor: stateMonitor,
    queue: queueVisualizer,
    cache: cacheStats,

    /**
     * Display full system status
     */
    status(playbackHandler) {
      if (!DEBUG_ENABLED) return;

      console.clear();
      console.header('SCHWELEVISION DEBUG STATUS');
      console.info('Timestamp: ' + new Date().toISOString());
      console.info('');

      queueVisualizer.display(playbackHandler);
      queueVisualizer.displayUpcoming(playbackHandler);
      cacheStats.displayDurationCache(playbackHandler);
      cacheStats.displayPreloadCache(playbackHandler);
      cacheStats.displayLocalStorage();
    },

    /**
     * Start live monitoring
     */
    startLiveMonitor(playbackHandler) {
      stateMonitor.start(() => ({
        playback: {
          scheduleIndex: playbackHandler.scheduleIndex,
          fillerIndex: playbackHandler.fillerIndex,
          playingScheduled: playbackHandler.playingScheduled,
          showingStatic: playbackHandler.showingStatic,
          queueIndex: playbackHandler.queueIndex
        },
        video: (() => {
          const video = playbackHandler.videoQueue[playbackHandler.queueIndex % 3];
          return {
            isPlaying: video && !video.paused,
            currentTime: video?.currentTime || 0,
            duration: video?.duration || 0,
            buffered: video?.buffered?.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0,
            volume: video?.volume || 0,
            readyState: video?.readyState || 0
          };
        })(),
        performance: {
          fps: window.debugUtils?.perf?.getFPS() || 0,
          networkRequests: window.debugUtils?.network?.getStats()?.total || 0
        }
      }));
    },

    /**
     * Stop live monitoring
     */
    stopLiveMonitor() {
      stateMonitor.stop();
    },

    /**
     * Check if debug is enabled
     */
    isEnabled() {
      return DEBUG_ENABLED;
    }
  };
}

// Export singleton instance
export const debugConsole = createDebugConsole();

export default debugConsole;
