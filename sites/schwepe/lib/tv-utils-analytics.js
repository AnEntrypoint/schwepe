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
