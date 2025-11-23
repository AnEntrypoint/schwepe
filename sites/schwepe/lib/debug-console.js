/**
 * Debug Console - Styled console output and real-time monitoring
 * Provides tables, timers, and visual debugging helpers
 * 
 * Usage:
 *   import DebugConsole from '/lib/debug-console.js'
 *   const dc = new DebugConsole()
 *   dc.table(debugHooks.getPlaybackState())
 *   dc.startMonitoring(debugHooks)
 */

export class DebugConsole {
  constructor() {
    this.styles = {
      header: 'color: #00f5ff; font-weight: bold; font-size: 1.2em;',
      success: 'color: #00ff00; font-weight: bold;',
      error: 'color: #ff0000; font-weight: bold;',
      warning: 'color: #ffaa00; font-weight: bold;',
      info: 'color: #00aaff;',
      dim: 'color: #666666;',
      mono: 'font-family: monospace; color: #00ff00;'
    };

    this.timers = {};
    this.logHistory = [];
    this.maxHistorySize = 500;
  }

  /**
   * Log with styling
   */
  log(label, data, style = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;

    console.log(`%c${prefix} %c${label}`, this.styles.dim, this.styles[style] || this.styles.info);
    if (data) console.log(data);

    this._recordLog({ timestamp, label, data });
  }

  /**
   * Log success
   */
  success(label, data) {
    this.log(label, data, 'success');
  }

  /**
   * Log error
   */
  error(label, data) {
    this.log(label, data, 'error');
  }

  /**
   * Log warning
   */
  warn(label, data) {
    this.log(label, data, 'warning');
  }

  /**
   * Display a formatted table
   */
  table(data, title = '') {
    if (title) {
      console.log(`%c${title}`, this.styles.header);
    }
    console.table(data);
    this._recordLog({ timestamp: new Date().toLocaleTimeString(), label: `TABLE: ${title}`, data });
  }

  /**
   * Start a timer
   */
  startTimer(label) {
    this.timers[label] = performance.now();
    this.log(`⏱️  Timer started: ${label}`, null, 'info');
  }

  /**
   * End a timer and log result
   */
  endTimer(label) {
    if (!this.timers[label]) {
      this.warn(`⏱️  Timer not found: ${label}`);
      return null;
    }

    const duration = performance.now() - this.timers[label];
    delete this.timers[label];

    this.log(`⏱️  Timer ended: ${label}`, `${duration.toFixed(2)}ms`, 'success');
    return duration;
  }

  /**
   * Log playback state in table format
   */
  logPlaybackState(debugHooks) {
    if (!debugHooks) {
      this.error('PlaybackHandler not available');
      return;
    }

    const state = debugHooks.getPlaybackState();
    this.table({
      Mode: state.playingScheduled ? '📺 SCHEDULE' : '📹 FILLER',
      'Schedule Index': state.scheduleIndex,
      'Filler Index': state.fillerIndex,
      'Queue Position': state.currentQueueIndex,
      'Total Scheduled': state.scheduledVideoCount,
      'Total Filler': state.fillerVideoCount,
      Volume: `${(state.normalizedVolume * 100).toFixed(0)}%`,
      'Cached Durations': state.cacheSize,
      'In Commercial': state.inCommercialBreak ? '✓' : '✗',
      'Showing Static': state.showingStatic ? '✓' : '✗'
    }, '📊 PLAYBACK STATE');
  }

  /**
   * Log current video info in table format
   */
  logCurrentVideo(debugHooks) {
    if (!debugHooks) {
      this.error('PlaybackHandler not available');
      return;
    }

    const video = debugHooks.getCurrentVideoInfo();
    const progress = video.duration > 0
      ? ((video.currentTime / video.duration) * 100).toFixed(1)
      : '0.0';

    this.table({
      Type: video.type,
      Index: video.index,
      Title: video.title?.substring(0, 50) || 'Unknown',
      Current: `${video.currentTime.toFixed(1)}s`,
      Duration: `${video.duration.toFixed(1)}s`,
      Progress: `${progress}%`,
      Status: video.paused ? '⏸️  PAUSED' : '▶️  PLAYING',
      Quality: video.readyState >= 4 ? '✓ Ready' : '⏳ Loading...'
    }, '🎬 CURRENT VIDEO');
  }

  /**
   * Log cache statistics
   */
  logCacheStats(debugHooks) {
    if (!debugHooks) {
      this.error('PlaybackHandler not available');
      return;
    }

    const cache = debugHooks.getDurationCache();
    const durations = Object.values(cache.cache || {});

    if (durations.length === 0) {
      this.warn('Cache is empty', null);
      return;
    }

    const stats = {
      'Total Cached': durations.length,
      'Min Duration': `${(Math.min(...durations) / 1000).toFixed(1)}s`,
      'Max Duration': `${(Math.max(...durations) / 1000).toFixed(1)}s`,
      'Average Duration': `${(durations.reduce((a, b) => a + b, 0) / durations.length / 1000).toFixed(1)}s`,
      'Total Duration': `${(durations.reduce((a, b) => a + b, 0) / 1000 / 60).toFixed(1)}m`
    };

    this.table(stats, '💾 CACHE STATISTICS');
  }

  /**
   * Log health status
   */
  logHealth(debugHooks) {
    if (!debugHooks) {
      this.error('PlaybackHandler not available');
      return;
    }

    const health = debugHooks.healthCheck();
    const status = {
      'PlaybackHandler': health.systems.playbackHandler ? '✅' : '❌',
      'TV Scheduler': health.systems.tvScheduler ? '✅' : '❌',
      'Cache Manager': health.systems.cacheManager ? '✅' : '❌',
      'Video Elements': health.playback?.videoElementsReady ? '✅' : '❌',
      'Static Canvas': health.playback?.staticCanvasReady ? '✅' : '❌',
      'Videos Loaded': health.playback?.videosLoaded ? '✅' : '❌'
    };

    this.table(status, '🏥 SYSTEM HEALTH');
  }

  /**
   * Display video queue visualization
   */
  logVideoQueue(debugHooks) {
    if (!debugHooks) {
      this.error('PlaybackHandler not available');
      return;
    }

    const state = debugHooks.getPlaybackState();
    const videoList = state.playingScheduled
      ? debugHooks.listScheduledVideos(5)
      : debugHooks.listFillerVideos(5);

    const currentIndex = state.playingScheduled ? state.scheduleIndex : state.fillerIndex;

    const queue = videoList.map((v, idx) => {
      const marker = idx === currentIndex ? '▶️ ' : '   ';
      const title = v.title?.substring(0, 40) || 'Unknown';
      return `${marker}[${v.index}] ${title}`;
    });

    console.log(`%c📹 VIDEO QUEUE (${state.playingScheduled ? 'SCHEDULED' : 'FILLER'})`, this.styles.header);
    queue.forEach(line => console.log(`%c${line}`, this.styles.mono));
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(debugHooks, interval = 2000) {
    if (this.monitoringInterval) {
      this.warn('Monitoring already active');
      return;
    }

    this.success('📡 Monitoring started', `Update interval: ${interval}ms`);

    this.monitoringInterval = setInterval(() => {
      console.clear();
      console.log(`%c📺 SCHWELEVISION DEBUG MONITOR`, this.styles.header);
      console.log(`%c${new Date().toLocaleTimeString()}`, this.styles.dim);
      console.log('');

      this.logHealth(debugHooks);
      console.log('');

      this.logPlaybackState(debugHooks);
      console.log('');

      this.logCurrentVideo(debugHooks);
      console.log('');

      this.logVideoQueue(debugHooks);
      console.log('');

      this.logCacheStats(debugHooks);
      console.log('');

      console.log(`%cType: window.__DEBUG.stopMonitoring() to stop monitoring`, this.styles.dim);
    }, interval);

    // Store reference for stopping
    if (typeof window !== 'undefined') {
      window.__debugConsole = this;
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.success('📡 Monitoring stopped');
    }
  }

  /**
   * Export log history
   */
  exportLogs() {
    const data = {
      timestamp: new Date().toISOString(),
      logs: this.logHistory
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.success('📥 Logs exported');
  }

  /**
   * Get log history
   */
  getLogs(limit = 50) {
    return this.logHistory.slice(-limit);
  }

  /**
   * Clear history
   */
  clearLogs() {
    this.logHistory = [];
    this.success('🗑️  Logs cleared');
  }

  /**
   * Private: Record log
   */
  _recordLog(entry) {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Create performance summary
   */
  logPerformanceSummary(measurements) {
    const table = Object.entries(measurements).map(([name, duration]) => ({
      Measurement: name,
      Duration: `${duration.toFixed(2)}ms`
    }));

    this.table(table, '⚡ PERFORMANCE SUMMARY');
  }

  /**
   * Log network request summary
   */
  logNetworkSummary(requests) {
    const grouped = {};

    requests.forEach(req => {
      const status = req.status || 'ERROR';
      grouped[status] = (grouped[status] || 0) + 1;
    });

    const table = Object.entries(grouped).map(([status, count]) => ({
      Status: status,
      Count: count
    }));

    this.table(table, '🌐 NETWORK SUMMARY');
  }
}

export default DebugConsole;
