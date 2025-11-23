/**
 * Schwelevision Debug Utilities
 * Production-safe debug helpers with zero overhead when inactive
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

const DEBUG_ENABLED = typeof window !== 'undefined' &&
  (localStorage.getItem('schwepe_debug') === 'true' || window.location.search.includes('debug=true'));

/**
 * State Snapshot Manager - Track and diff state changes
 */
export class StateSnapshotManager {
  constructor() {
    this.snapshots = [];
    this.maxSnapshots = 100;
    this.enabled = DEBUG_ENABLED;
  }

  /**
   * Take a snapshot of current state
   */
  snapshot(label, state) {
    if (!this.enabled) return null;

    const snap = {
      id: Date.now(),
      label,
      timestamp: new Date().toISOString(),
      state: this.deepClone(state),
      stack: new Error().stack?.split('\n').slice(2, 5).join('\n')
    };

    this.snapshots.push(snap);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snap.id;
  }

  /**
   * Get diff between two snapshots
   */
  diff(snapshotId1, snapshotId2) {
    if (!this.enabled) return null;

    const snap1 = this.snapshots.find(s => s.id === snapshotId1);
    const snap2 = this.snapshots.find(s => s.id === snapshotId2);

    if (!snap1 || !snap2) return null;

    return {
      from: { id: snap1.id, label: snap1.label, timestamp: snap1.timestamp },
      to: { id: snap2.id, label: snap2.label, timestamp: snap2.timestamp },
      changes: this.computeDiff(snap1.state, snap2.state)
    };
  }

  /**
   * Get the latest N snapshots
   */
  getRecent(count = 10) {
    if (!this.enabled) return [];
    return this.snapshots.slice(-count);
  }

  /**
   * Compute differences between two objects
   */
  computeDiff(obj1, obj2, path = '') {
    const changes = [];
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of allKeys) {
      const fullPath = path ? `${path}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
        changes.push(...this.computeDiff(val1, val2, fullPath));
      } else if (val1 !== val2) {
        changes.push({ path: fullPath, from: val1, to: val2 });
      }
    }

    return changes;
  }

  deepClone(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      return { error: 'Unable to clone', type: typeof obj };
    }
  }

  clear() {
    this.snapshots = [];
  }
}

/**
 * Performance Monitor - Track timing and metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.enabled = DEBUG_ENABLED;
    this.timers = new Map();
    this.metrics = new Map();
    this.hooks = [];
    this.frameStats = { count: 0, lastTime: 0, fps: 0 };
  }

  /**
   * Start a timer
   */
  startTimer(name) {
    if (!this.enabled) return;
    this.timers.set(name, { start: performance.now(), marks: [] });
  }

  /**
   * Add a mark to a running timer
   */
  mark(timerName, markName) {
    if (!this.enabled) return;
    const timer = this.timers.get(timerName);
    if (timer) {
      timer.marks.push({ name: markName, time: performance.now() - timer.start });
    }
  }

  /**
   * End a timer and get results
   */
  endTimer(name) {
    if (!this.enabled) return null;
    const timer = this.timers.get(name);
    if (!timer) return null;

    const duration = performance.now() - timer.start;
    this.timers.delete(name);

    const result = { name, duration, marks: timer.marks };
    this.recordMetric(name, duration);
    this.notifyHooks('timer', result);

    return result;
  }

  /**
   * Record a metric value
   */
  recordMetric(name, value) {
    if (!this.enabled) return;

    let metric = this.metrics.get(name);
    if (!metric) {
      metric = { values: [], min: Infinity, max: -Infinity, sum: 0, count: 0 };
      this.metrics.set(name, metric);
    }

    metric.values.push({ value, timestamp: Date.now() });
    if (metric.values.length > 1000) metric.values.shift();

    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.sum += value;
    metric.count++;
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name) {
    if (!this.enabled) return null;
    const metric = this.metrics.get(name);
    if (!metric) return null;

    return {
      name,
      min: metric.min,
      max: metric.max,
      avg: metric.sum / metric.count,
      count: metric.count,
      recent: metric.values.slice(-10)
    };
  }

  /**
   * Get all metric statistics
   */
  getAllStats() {
    if (!this.enabled) return {};
    const stats = {};
    for (const [name] of this.metrics) {
      stats[name] = this.getMetricStats(name);
    }
    return stats;
  }

  /**
   * Register a hook for performance events
   */
  addHook(callback) {
    if (!this.enabled) return () => {};
    this.hooks.push(callback);
    return () => {
      const idx = this.hooks.indexOf(callback);
      if (idx >= 0) this.hooks.splice(idx, 1);
    };
  }

  notifyHooks(type, data) {
    for (const hook of this.hooks) {
      try { hook(type, data); } catch (e) { /* ignore */ }
    }
  }

  /**
   * Start FPS monitoring
   */
  startFPSMonitor() {
    if (!this.enabled || typeof requestAnimationFrame === 'undefined') return;

    const measureFPS = (now) => {
      this.frameStats.count++;
      if (now - this.frameStats.lastTime >= 1000) {
        this.frameStats.fps = this.frameStats.count;
        this.frameStats.count = 0;
        this.frameStats.lastTime = now;
        this.recordMetric('fps', this.frameStats.fps);
      }
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Get current FPS
   */
  getFPS() {
    return this.enabled ? this.frameStats.fps : 0;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.timers.clear();
    this.metrics.clear();
  }
}

/**
 * Network Request Logger - Track all network activity
 */
export class NetworkLogger {
  constructor() {
    this.enabled = DEBUG_ENABLED;
    this.requests = [];
    this.maxRequests = 200;
    this.hooks = [];
    this.originalFetch = null;
    this.intercepting = false;
  }

  /**
   * Start intercepting fetch requests
   */
  startIntercepting() {
    if (!this.enabled || this.intercepting || typeof window === 'undefined') return;

    this.originalFetch = window.fetch;
    this.intercepting = true;

    window.fetch = async (url, options = {}) => {
      const requestId = Date.now();
      const startTime = performance.now();

      const request = {
        id: requestId,
        url: url.toString(),
        method: options.method || 'GET',
        headers: options.headers || {},
        startTime: new Date().toISOString(),
        status: 'pending',
        duration: 0
      };

      this.addRequest(request);

      try {
        const response = await this.originalFetch(url, options);
        const duration = performance.now() - startTime;

        this.updateRequest(requestId, {
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          statusText: response.statusText,
          duration,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        this.updateRequest(requestId, {
          status: 'failed',
          error: error.message,
          duration
        });

        throw error;
      }
    };
  }

  /**
   * Stop intercepting fetch requests
   */
  stopIntercepting() {
    if (!this.intercepting || !this.originalFetch) return;
    window.fetch = this.originalFetch;
    this.intercepting = false;
  }

  addRequest(request) {
    this.requests.push(request);
    if (this.requests.length > this.maxRequests) {
      this.requests.shift();
    }
    this.notifyHooks('request', request);
  }

  updateRequest(id, updates) {
    const request = this.requests.find(r => r.id === id);
    if (request) {
      Object.assign(request, updates);
      this.notifyHooks('response', request);
    }
  }

  /**
   * Get requests by status
   */
  getByStatus(status) {
    if (!this.enabled) return [];
    return this.requests.filter(r => r.status === status);
  }

  /**
   * Get recent requests
   */
  getRecent(count = 20) {
    if (!this.enabled) return [];
    return this.requests.slice(-count);
  }

  /**
   * Get request statistics
   */
  getStats() {
    if (!this.enabled) return {};

    const pending = this.requests.filter(r => r.status === 'pending').length;
    const success = this.requests.filter(r => r.status === 'success').length;
    const failed = this.requests.filter(r => r.status === 'failed' || r.status === 'error').length;
    const durations = this.requests.filter(r => r.duration > 0).map(r => r.duration);

    return {
      total: this.requests.length,
      pending,
      success,
      failed,
      avgDuration: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      slowest: durations.length ? Math.max(...durations) : 0
    };
  }

  /**
   * Register a hook for network events
   */
  addHook(callback) {
    if (!this.enabled) return () => {};
    this.hooks.push(callback);
    return () => {
      const idx = this.hooks.indexOf(callback);
      if (idx >= 0) this.hooks.splice(idx, 1);
    };
  }

  notifyHooks(type, data) {
    for (const hook of this.hooks) {
      try { hook(type, data); } catch (e) { /* ignore */ }
    }
  }

  clear() {
    this.requests = [];
  }
}

/**
 * Error Tracker - Capture and report errors
 */
export class ErrorTracker {
  constructor() {
    this.enabled = DEBUG_ENABLED;
    this.errors = [];
    this.maxErrors = 100;
    this.hooks = [];
    this.listening = false;
  }

  /**
   * Start listening for global errors
   */
  startListening() {
    if (!this.enabled || this.listening || typeof window === 'undefined') return;

    this.listening = true;

    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'uncaught',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'unhandledrejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack
      });
    });
  }

  /**
   * Manually track an error
   */
  trackError(errorData) {
    if (!this.enabled) return;

    const error = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...errorData
    };

    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    this.notifyHooks('error', error);
  }

  /**
   * Track an error from a try-catch
   */
  catch(error, context = {}) {
    if (!this.enabled) return;

    this.trackError({
      type: 'caught',
      message: error.message,
      name: error.name,
      stack: error.stack,
      context
    });
  }

  /**
   * Get errors by type
   */
  getByType(type) {
    if (!this.enabled) return [];
    return this.errors.filter(e => e.type === type);
  }

  /**
   * Get recent errors
   */
  getRecent(count = 20) {
    if (!this.enabled) return [];
    return this.errors.slice(-count);
  }

  /**
   * Get error summary
   */
  getSummary() {
    if (!this.enabled) return {};

    const byType = {};
    for (const error of this.errors) {
      byType[error.type] = (byType[error.type] || 0) + 1;
    }

    return {
      total: this.errors.length,
      byType,
      mostRecent: this.errors[this.errors.length - 1]
    };
  }

  /**
   * Register a hook for error events
   */
  addHook(callback) {
    if (!this.enabled) return () => {};
    this.hooks.push(callback);
    return () => {
      const idx = this.hooks.indexOf(callback);
      if (idx >= 0) this.hooks.splice(idx, 1);
    };
  }

  notifyHooks(type, data) {
    for (const hook of this.hooks) {
      try { hook(type, data); } catch (e) { /* ignore */ }
    }
  }

  clear() {
    this.errors = [];
  }
}

/**
 * Debug Utils Factory - Create a complete debug toolkit
 */
export function createDebugUtils() {
  const stateManager = new StateSnapshotManager();
  const perfMonitor = new PerformanceMonitor();
  const networkLogger = new NetworkLogger();
  const errorTracker = new ErrorTracker();

  return {
    state: stateManager,
    perf: perfMonitor,
    network: networkLogger,
    errors: errorTracker,

    /**
     * Initialize all debug utilities
     */
    init() {
      if (!DEBUG_ENABLED) {
        console.log('Debug utilities disabled. Enable with localStorage.setItem("schwepe_debug", "true")');
        return this;
      }

      networkLogger.startIntercepting();
      errorTracker.startListening();
      perfMonitor.startFPSMonitor();

      console.log('%c[DEBUG] Schwelevision debug utilities initialized', 'color: #00f5ff; font-weight: bold');
      return this;
    },

    /**
     * Get complete debug report
     */
    getReport() {
      return {
        timestamp: new Date().toISOString(),
        enabled: DEBUG_ENABLED,
        performance: perfMonitor.getAllStats(),
        network: networkLogger.getStats(),
        errors: errorTracker.getSummary(),
        recentSnapshots: stateManager.getRecent(5)
      };
    },

    /**
     * Export debug data as JSON
     */
    exportData() {
      return JSON.stringify({
        report: this.getReport(),
        snapshots: stateManager.getRecent(50),
        requests: networkLogger.getRecent(100),
        errors: errorTracker.getRecent(50)
      }, null, 2);
    },

    /**
     * Clear all debug data
     */
    clearAll() {
      stateManager.clear();
      perfMonitor.clear();
      networkLogger.clear();
      errorTracker.clear();
    },

    /**
     * Check if debug mode is enabled
     */
    isEnabled() {
      return DEBUG_ENABLED;
    }
  };
}

// Export singleton instance
export const debugUtils = createDebugUtils();

// Export enabled flag for external checks
export const isDebugEnabled = () => DEBUG_ENABLED;

export default debugUtils;
