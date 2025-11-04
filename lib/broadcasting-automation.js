/**
 * Schwelevision Utils Automation Module
 * Broadcasting automation and recommendation services
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { BroadcastState, StreamManager } from './tv-core-basic.js';
import { AdvancedScheduler } from './tv-scheduler-basic.js';

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

  /**
   * Remove automation rule
   */
  removeRule(ruleId) {
    this.automationRules = this.automationRules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Process automation rules
   */
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

  /**
   * Evaluate if rule should trigger
   */
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

  /**
   * Execute rule action
   */
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

  /**
   * Execute individual action
   */
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
        // In real implementation, this would send actual notifications
        break;

      case 'adjust_quality':
        // Adjust streaming quality based on conditions
        console.log('Adjusting quality:', action.quality);
        break;

      case 'log_event':
        console.log('Automation event:', action.event);
        break;

      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  /**
   * Get metric value from system status
   */
  getMetricValue(metric, systemStatus) {
    const metricPath = metric.split('.');
    let value = systemStatus;

    for (const part of metricPath) {
      value = value?.[part];
    }

    return value || 0;
  }

  /**
   * Enable/disable automation
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Get automation statistics
   */
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

/**
 * Content recommendation service
 */
export class ContentRecommendationService {
  constructor(contentLibrary) {
    this.contentLibrary = contentLibrary;
    this.userPreferences = new Map();
    this.trendingContent = new Map();
  }

  /**
   * Get personalized recommendations
   */
  getPersonalizedRecommendations(userId, count = 10) {