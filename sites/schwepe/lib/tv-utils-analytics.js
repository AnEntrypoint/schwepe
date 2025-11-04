/**
 * Schwelevision Utils Advanced Module
 * Advanced broadcasting utilities and analytics
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { BroadcastState, StreamManager } from './tv-core-basic.js';
import { AdvancedScheduler } from './tv-scheduler-basic.js';

/**
 * Advanced analytics system
 */
export class BroadcastingAnalytics {
  constructor() {
    this.metrics = {
      dailyViewers: new Map(),
      peakHours: new Map(),
      contentPerformance: new Map(),
      viewerRetention: new Map(),
      revenueMetrics: new Map()
    };
  }

  /**
   * Record viewership data
   */
  recordViewership(timestamp, viewers, contentId) {
    const date = new Date(timestamp).toDateString();
    const hour = new Date(timestamp).getHours();

    // Daily viewers
    if (!this.metrics.dailyViewers.has(date)) {
      this.metrics.dailyViewers.set(date, []);
    }
    this.metrics.dailyViewers.get(date).push({ timestamp, viewers, contentId });

    // Peak hours
    if (!this.metrics.peakHours.has(hour)) {
      this.metrics.peakHours.set(hour, []);
    }
    this.metrics.peakHours.get(hour).push(viewers);

    // Content performance
    if (!this.metrics.contentPerformance.has(contentId)) {
      this.metrics.contentPerformance.set(contentId, {
        totalViews: 0,
        totalViewers: 0,
        averageViewers: 0,
        peakViewers: 0
      });
    }

    const perf = this.metrics.contentPerformance.get(contentId);
    perf.totalViews++;
    perf.totalViewers += viewers;
    perf.averageViewers = perf.totalViewers / perf.totalViews;
    perf.peakViewers = Math.max(perf.peakViewers, viewers);
  }

  /**
   * Generate daily report
   */
  generateDailyReport(date = new Date().toDateString()) {
    const dailyData = this.metrics.dailyViewers.get(date) || [];
    
    if (dailyData.length === 0) {
      return { date, totalViews: 0, averageViewers: 0, peakViewers: 0 };
    }

    const totalViews = dailyData.length;
    const totalViewers = dailyData.reduce((sum, d) => sum + d.viewers, 0);
    const averageViewers = totalViewers / totalViews;
    const peakViewers = Math.max(...dailyData.map(d => d.viewers));

    // Top performing content
    const contentStats = {};
    dailyData.forEach(d => {
      if (!contentStats[d.contentId]) {
        contentStats[d.contentId] = { views: 0, viewers: 0 };
      }
      contentStats[d.contentId].views++;
      contentStats[d.contentId].viewers += d.viewers;
    });

    const topContent = Object.entries(contentStats)
      .sort(([,a], [,b]) => b.viewers - a.viewers)
      .slice(0, 5)
      .map(([contentId, stats]) => ({ contentId, ...stats }));

    return {
      date,
      totalViews,
      averageViewers: Math.round(averageViewers),
      peakViewers,
      topContent
    };
  }

  /**
   * Get peak viewing hours
   */
  getPeakViewingHours() {
    const hourStats = {};
    
    this.metrics.peakHours.forEach((viewers, hour) => {
      hourStats[hour] = {
        totalOccurrences: viewers.length,
        averageViewers: viewers.reduce((sum, v) => sum + v, 0) / viewers.length,
        peakViewers: Math.max(...viewers)
      };
    });

    return Object.entries(hourStats)
      .sort(([,a], [,b]) => b.averageViewers - a.averageViewers)
      .slice(0, 6) // Top 6 hours
      .map(([hour, stats]) => ({ hour: parseInt(hour), ...stats }));
  }

  /**
   * Get content performance rankings
   */
  getContentRankings() {
    return Array.from(this.metrics.contentPerformance.entries())
      .map(([contentId, performance]) => ({ contentId, ...performance }))
      .sort((a, b) => b.averageViewers - a.averageViewers);
  }
}

/**
 * Advanced broadcasting automation
 */
export class BroadcastingAutomation {
  constructor(system) {
    this.system = system;
    this.automationRules = [];
    this.isEnabled = true;
  }

  /**
   * Add automation rule
   */
  addRule(rule) {
    const ruleWithId = {
      ...rule,
      id: Date.now().toString(),
      createdAt: new Date(),
      triggerCount: 0,
      lastTriggered: null
    };

    this.automationRules.push(ruleWithId);
    return ruleWithId.id;
  }

  removeRule(ruleId) {
    this.automationRules = this.automationRules.filter(rule => rule.id !== ruleId);
  }

  async processRules() {
    if (!this.isEnabled) return;

    const systemStatus = this.system.getStatus();

    for (const rule of this.automationRules) {
      if (this.evaluateRule(rule, systemStatus)) {
        await this.executeRule(rule, systemStatus);
        rule.triggerCount++;
        rule.lastTriggered = new Date();
      }
    }
  }

  evaluateRule(rule, systemStatus) {
    const { conditions } = rule;

    return conditions.every(condition => {
      const { metric, operator, value } = condition;
      const currentValue = this.getMetricValue(metric, systemStatus);

      switch (operator) {
        case 'equals': return currentValue === value;
        case 'greater_than': return currentValue > value;
        case 'less_than': return currentValue < value;
        case 'not_equals': return currentValue !== value;
        default: return false;
      }
    });
  }

  async executeRule(rule, systemStatus) {
    const { actions } = rule;

    for (const action of actions) {
      try {
        await this.executeAction(action, systemStatus);
      } catch (error) {
        console.error('Failed to execute automation action:', error);
      }
    }
  }

  async executeAction(action, systemStatus) {
    switch (action.type) {
      case 'start_broadcast':
        if (action.programId) {
          await this.system.startBroadcast({ id: action.programId });
        }
        break;

      case 'stop_broadcast':
        this.system.stopBroadcast();
        break;

      case 'send_notification':
        console.log('Notification:', action.message);
        break;

      case 'adjust_quality':
        console.log('Adjusting quality:', action.quality);
        break;

      case 'log_event':
        console.log('Automation event:', action.event);
        break;

      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  getMetricValue(metric, systemStatus) {
    const metricPath = metric.split('.');
    let value = systemStatus;

    for (const part of metricPath) {
      value = value?.[part];
    }

    return value || 0;
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  getStats() {
    return {
      totalRules: this.automationRules.length,
      enabled: this.isEnabled,
      rules: this.automationRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        triggerCount: rule.triggerCount,
        lastTriggered: rule.lastTriggered
      }))
    };
  }
}