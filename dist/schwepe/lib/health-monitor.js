/**
 * System Health Monitor Module
 * Health monitoring and alerting system
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

/**
 * System health monitor
 */
export class HealthMonitor {
  constructor() {
    this.metrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkLatency: 0,
      activeStreams: 0,
      errorCount: 0
    };
    this.alerts = [];
    this.isMonitoring = false;
  }

  /**
   * Start health monitoring
   */
  startMonitoring(intervalMs = 30000) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
    }, intervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * Collect system metrics
   */
  async collectMetrics() {
    try {
      const { performance } = await import('perf_hooks');
      const { freemem, totalmem } = await import('os');
      
      this.metrics.memoryUsage = ((totalmem() - freemem()) / totalmem()) * 100;
      this.metrics.activeStreams = this.getActiveStreamCount();
      
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  /**
   * Check health thresholds
   */
  checkThresholds() {
    const thresholds = {
      memoryUsage: 80,
      cpuUsage: 85,
      errorCount: 10
    };

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      if (this.metrics[metric] > threshold) {
        this.createAlert(metric, this.metrics[metric], threshold);
      }
    });
  }

  /**
   * Create health alert
   */
  createAlert(metric, value, threshold) {
    const alert = {
      id: Date.now().toString(),
      metric,
      value,
      threshold,
      timestamp: new Date(),
      severity: value > threshold * 1.2 ? 'critical' : 'warning'
    };

    this.alerts.push(alert);
    console.warn(`Health Alert: ${metric} is ${value}% (threshold: ${threshold}%)`);
  }

  /**
   * Get active stream count (placeholder)
   */
  getActiveStreamCount() {
    return Math.floor(Math.random() * 10);
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      metrics: { ...this.metrics },
      alerts: this.alerts.slice(-10),
      isMonitoring: this.isMonitoring,
      lastUpdate: new Date()
    };
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(maxAge = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - maxAge;
    this.alerts = this.alerts.filter(alert => 
      alert.timestamp.getTime() > cutoff
    );
  }
}