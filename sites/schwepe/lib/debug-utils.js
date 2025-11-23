/**
 * Debug Utilities
 * Helper functions for state snapshots, performance monitoring, network logging, and error tracking
 * 
 * Usage:
 *   import DebugUtils from '/lib/debug-utils.js'
 *   const snapshot = DebugUtils.snapshot(debugHooks)
 *   const diff = DebugUtils.diff(snapshot1, snapshot2)
 */

export class DebugUtils {
  /**
   * Take a complete state snapshot
   */
  static snapshot(debugHooks) {
    if (!debugHooks) return null;
    
    return {
      timestamp: new Date().toISOString(),
      playback: debugHooks.getPlaybackState(),
      video: debugHooks.getCurrentVideoInfo(),
      analytics: debugHooks.getPlaybackAnalytics(),
      scheduler: debugHooks.getSchedulerInfo(),
      cache: debugHooks.getDurationCache(),
      health: debugHooks.healthCheck()
    };
  }

  /**
   * Compare two snapshots and return differences
   */
  static diff(snap1, snap2) {
    if (!snap1 || !snap2) return null;

    const changes = {};

    const compareObjects = (obj1, obj2, path = '') => {
      const allKeys = new Set([
        ...Object.keys(obj1 || {}),
        ...Object.keys(obj2 || {})
      ]);

      allKeys.forEach(key => {
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (val1 !== val2) {
          if (typeof val1 === 'object' && typeof val2 === 'object' && val1 && val2) {
            compareObjects(val1, val2, currentPath);
          } else {
            changes[currentPath] = {
              from: val1,
              to: val2
            };
          }
        }
      });
    };

    compareObjects(snap1, snap2);

    return {
      timestamp: new Date().toISOString(),
      changeCount: Object.keys(changes).length,
      changes
    };
  }

  /**
   * Performance monitoring helper
   */
  static createPerformanceMonitor() {
    return {
      marks: {},
      measures: {},

      mark(label) {
        this.marks[label] = performance.now();
      },

      measure(label, startLabel, endLabel) {
        if (!this.marks[startLabel] || !this.marks[endLabel]) {
          console.warn(`Missing marks for ${startLabel} or ${endLabel}`);
          return null;
        }

        const duration = this.marks[endLabel] - this.marks[startLabel];
        this.measures[label] = {
          duration,
          timestamp: new Date().toISOString()
        };

        return duration;
      },

      clear() {
        this.marks = {};
        this.measures = {};
      },

      getReport() {
        const sorted = Object.entries(this.measures)
          .sort(([, a], [, b]) => b.duration - a.duration);

        return {
          measurements: Object.fromEntries(sorted),
          totalMeasurements: Object.keys(this.measures).length,
          averageDuration: sorted.length > 0
            ? sorted.reduce((sum, [, m]) => sum + m.duration, 0) / sorted.length
            : 0
        };
      }
    };
  }

  /**
   * Network request logger
   */
  static createNetworkMonitor() {
    const requests = [];
    const originalFetch = window.fetch;

    const monitoredFetch = async (url, options = {}) => {
      const startTime = performance.now();
      const request = {
        url,
        method: options.method || 'GET',
        startTime,
        status: null,
        duration: null,
        headers: options.headers || {},
        timestamp: new Date().toISOString()
      };

      try {
        const response = await originalFetch(url, options);
        request.status = response.status;
        request.duration = performance.now() - startTime;
        requests.push(request);
        return response;
      } catch (error) {
        request.error = error.message;
        request.duration = performance.now() - startTime;
        requests.push(request);
        throw error;
      }
    };

    return {
      enable() {
        if (typeof window !== 'undefined') {
          window.fetch = monitoredFetch;
        }
      },

      disable() {
        if (typeof window !== 'undefined') {
          window.fetch = originalFetch;
        }
      },

      getRequests(filter = {}) {
        let filtered = [...requests];

        if (filter.method) {
          filtered = filtered.filter(r => r.method === filter.method);
        }
        if (filter.statusCode) {
          filtered = filtered.filter(r => r.status === filter.statusCode);
        }
        if (filter.url) {
          filtered = filtered.filter(r => r.url.includes(filter.url));
        }

        return filtered;
      },

      getReport() {
        const total = requests.length;
        const successful = requests.filter(r => r.status && r.status < 400).length;
        const failed = requests.filter(r => !r.status || r.status >= 400).length;
        const totalTime = requests.reduce((sum, r) => sum + (r.duration || 0), 0);

        return {
          total,
          successful,
          failed,
          successRate: total > 0 ? (successful / total * 100).toFixed(1) + '%' : 'N/A',
          totalTime: totalTime.toFixed(2) + 'ms',
          averageTime: total > 0 ? (totalTime / total).toFixed(2) + 'ms' : 'N/A',
          requests: requests.slice(-20) // Last 20 requests
        };
      },

      clear() {
        requests.length = 0;
      }
    };
  }

  /**
   * Error tracker
   */
  static createErrorTracker() {
    const errors = [];

    const originalError = console.error;
    const originalWarn = console.warn;

    const trackError = (type, message, context = {}) => {
      errors.push({
        type,
        message,
        context,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
    };

    return {
      enable() {
        console.error = (...args) => {
          trackError('ERROR', args.join(' '));
          originalError.apply(console, args);
        };

        console.warn = (...args) => {
          trackError('WARN', args.join(' '));
          originalWarn.apply(console, args);
        };

        if (typeof window !== 'undefined') {
          window.addEventListener('error', (event) => {
            trackError('UNCAUGHT_ERROR', event.message, {
              filename: event.filename,
              lineno: event.lineno
            });
          });

          window.addEventListener('unhandledrejection', (event) => {
            trackError('UNHANDLED_REJECTION', event.reason?.message || String(event.reason), {
              promise: 'unhandled'
            });
          });
        }
      },

      disable() {
        console.error = originalError;
        console.warn = originalWarn;
      },

      getErrors(type = null) {
        if (!type) return errors;
        return errors.filter(e => e.type === type);
      },

      getReport() {
        const byType = {};
        errors.forEach(err => {
          byType[err.type] = (byType[err.type] || 0) + 1;
        });

        return {
          totalErrors: errors.length,
          byType,
          recentErrors: errors.slice(-10)
        };
      },

      clear() {
        errors.length = 0;
      }
    };
  }

  /**
   * Create a state history tracker
   */
  static createStateHistory(maxSize = 50) {
    const history = [];

    return {
      record(label, state) {
        history.push({
          timestamp: new Date().toISOString(),
          label,
          state: JSON.parse(JSON.stringify(state)) // Deep copy
        });

        if (history.length > maxSize) {
          history.shift();
        }
      },

      get(index = -1) {
        if (index === -1) return history[history.length - 1];
        return history[Math.min(Math.max(0, index), history.length - 1)];
      },

      getRange(from, to) {
        return history.slice(from, to);
      },

      getAll() {
        return [...history];
      },

      getDiffFromLast(index = -1) {
        if (history.length < 2) return null;

        const current = this.get(index);
        const previous = history[Math.max(0, (index === -1 ? history.length - 2 : index - 1))];

        return DebugUtils.diff(previous?.state, current?.state);
      },

      clear() {
        history.length = 0;
      }

    };
  }

  /**
   * Format objects for console display
   */
  static formatForConsole(obj, indent = 0) {
    const spaces = ' '.repeat(indent);
    
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj === 'string') return `"${obj}"`;
    if (typeof obj !== 'object') return String(obj);
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return `[\n${obj.map(item => spaces + '  ' + DebugUtils.formatForConsole(item, indent + 2)).join(',\n')}\n${spaces}]`;
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';

    return `{\n${keys.map(key => {
      const value = DebugUtils.formatForConsole(obj[key], indent + 2);
      return `${spaces}  ${key}: ${value}`;
    }).join(',\n')}\n${spaces}}`;
  }

  /**
   * Create table for console.table display
   */
  static createTable(data, columns = null) {
    if (!Array.isArray(data)) return [];

    if (!columns) {
      columns = data.length > 0 ? Object.keys(data[0]) : [];
    }

    return data.map(row => {
      const obj = {};
      columns.forEach(col => {
        obj[col] = row[col];
      });
      return obj;
    });
  }
}

export default DebugUtils;
