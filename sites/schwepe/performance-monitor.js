export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: performance.now(),
      videosPlayed: 0,
      totalPlayTime: 0,
      memorySnapshots: [],
      loadTimes: [],
      bufferingEvents: 0
    };
    this.monitoringEnabled = false;
  }

  start() {
    this.monitoringEnabled = true;
    this.metrics.startTime = performance.now();
    console.log('🔍 Performance monitoring started');

    if (performance.memory) {
      this.recordMemorySnapshot();
      this.memoryCheckInterval = setInterval(() => {
        this.recordMemorySnapshot();
      }, 5000);
    }
  }

  stop() {
    this.monitoringEnabled = false;
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    console.log('🔍 Performance monitoring stopped');
  }

  recordMemorySnapshot() {
    if (performance.memory) {
      const snapshot = {
        timestamp: performance.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(1)
      };
      this.metrics.memorySnapshots.push(snapshot);

      if (this.metrics.memorySnapshots.length > 100) {
        this.metrics.memorySnapshots.shift();
      }
    }
  }

  recordVideoPlay(duration) {
    if (!this.monitoringEnabled) return;
    this.metrics.videosPlayed++;
    this.metrics.totalPlayTime += duration;
  }

  recordLoadTime(loadTime) {
    if (!this.monitoringEnabled) return;
    this.metrics.loadTimes.push(loadTime);
    if (this.metrics.loadTimes.length > 100) {
      this.metrics.loadTimes.shift();
    }
  }

  recordBufferingEvent() {
    if (!this.monitoringEnabled) return;
    this.metrics.bufferingEvents++;
  }

  getMemoryUsage() {
    if (!performance.memory) {
      return null;
    }

    const latest = this.metrics.memorySnapshots[this.metrics.memorySnapshots.length - 1];
    if (!latest) return null;

    return {
      usedMB: (latest.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalMB: (latest.totalJSHeapSize / 1024 / 1024).toFixed(2),
      limitMB: (latest.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
      usagePercentage: latest.usagePercentage
    };
  }

  getLoadMetrics() {
    if (this.metrics.loadTimes.length === 0) {
      return null;
    }

    const sorted = [...this.metrics.loadTimes].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / sorted.length;
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      count: sorted.length,
      avgMs: Math.round(avg),
      medianMs: Math.round(median),
      minMs: Math.round(Math.min(...sorted)),
      maxMs: Math.round(Math.max(...sorted))
    };
  }

  getPerformanceReport() {
    const uptime = (performance.now() - this.metrics.startTime) / 1000;
    const avgVideoTime = this.metrics.videosPlayed > 0
      ? (this.metrics.totalPlayTime / this.metrics.videosPlayed / 1000).toFixed(1)
      : 0;

    return {
      uptime: Math.round(uptime) + 's',
      videosPlayed: this.metrics.videosPlayed,
      avgVideoDuration: avgVideoTime + 's',
      bufferingEvents: this.metrics.bufferingEvents,
      loadMetrics: this.getLoadMetrics(),
      memory: this.getMemoryUsage(),
      monitoring: this.monitoringEnabled
    };
  }

  logPerformanceReport() {
    const report = this.getPerformanceReport();
    console.log('═══ PERFORMANCE REPORT ═══');
    console.log(`⏱ Uptime: ${report.uptime}`);
    console.log(`📺 Videos Played: ${report.videosPlayed}`);
    console.log(`⏰ Avg Duration: ${report.avgVideoDuration}`);
    console.log(`📊 Buffering Events: ${report.bufferingEvents}`);

    if (report.memory) {
      console.log(`💾 Memory: ${report.memory.usedMB}MB / ${report.memory.limitMB}MB (${report.memory.usagePercentage}%)`);
    }

    if (report.loadMetrics) {
      const lm = report.loadMetrics;
      console.log(`⚡ Load Times: avg ${lm.avgMs}ms, median ${lm.medianMs}ms`);
    }
    console.log('═════════════════════════════');
  }
}
