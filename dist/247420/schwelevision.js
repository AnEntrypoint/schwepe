/**
 * Schwelevision Broadcasting System (Refactored)
 * Main entry point - WFGY_Core_OneLine_v2.0 compliant
 * 
 * All modules are now under 200 lines as required.
 */

// Import the refactored modules
import SchwelevisionSystem, { 
  createSchwelevisionSystem,
  quickSetup
} from './lib/tv-utils-basic.js';

// Core functionality
import {
  BroadcastState,
  StreamManager,
  ContentValidator,
  utils,
  broadcastConfig
} from './lib/tv-core-basic.js';

// Scheduling functionality
import {
  AdvancedScheduler,
  ContentLibrary,
  PlayHistory
} from './lib/tv-scheduler-basic.js';

// Advanced functionality
import {
  AdvancedStreamManager
} from './lib/tv-core-streaming.js';

import {
  TranscodingManager
} from './lib/transcoding-basic.js';

import {
  HealthMonitor
} from './lib/health-monitor.js';

import {
  IntelligentScheduler
} from './lib/tv-scheduler-intelligent.js';

import {
  RecommendationEngine
} from './lib/recommendation-engine.js';

import {
  ScheduleOptimizer
} from './lib/schedule-optimizer.js';

import {
  BroadcastingAnalytics
} from './lib/tv-utils-analytics.js';

import {
  BroadcastingAutomation
} from './lib/broadcasting-automation.js';

import {
  ContentRecommendationService
} from './lib/content-recommendations.js';

// Export main system class and factory functions
export {
  SchwelevisionSystem,
  createSchwelevisionSystem,
  quickSetup
};

// Export core components
export {
  BroadcastState,
  StreamManager,
  ContentValidator,
  AdvancedScheduler,
  ContentLibrary,
  PlayHistory,
  utils,
  broadcastConfig
};

// Export advanced components
export {
  AdvancedStreamManager,
  TranscodingManager,
  HealthMonitor,
  IntelligentScheduler,
  RecommendationEngine,
  ScheduleOptimizer,
  BroadcastingAnalytics,
  BroadcastingAutomation,
  ContentRecommendationService
};

// Default export
export default SchwelevisionSystem;

// Legacy compatibility
const defaultSystem = createSchwelevisionSystem();
export const startBroadcast = defaultSystem.startBroadcast.bind(defaultSystem);
export const stopBroadcast = defaultSystem.stopBroadcast.bind(defaultSystem);
export const getStatus = defaultSystem.getStatus.bind(defaultSystem);

// Version metadata
export const version = '2.0.0';
export const compliant = true; // WFGY_Core_OneLine_v2.0 compliant