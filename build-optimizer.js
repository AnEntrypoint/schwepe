/**
 * Build Optimizer Module (Refactored)
 * Main entry point - WFGY_Core_OneLine_v2.0 compliant
 * 
 * Refactored from 527 lines to under 200 lines.
 * Split into focused modules for better maintainability.
 */

// Import refactored modules
import BuildUtils, {
  createBuildOptimizer,
  createBuildAnalyzer,
  createBuildUtils,
  quickOptimize,
  quickAnalyze,
  BuildOptimizer,
  BuildAnalyzer,
  buildConfig
} from './lib/build-utils.js';

// Export main functionality
export {
  BuildUtils,
  createBuildOptimizer,
  createBuildAnalyzer,
  createBuildUtils,
  quickOptimize,
  quickAnalyze,
  BuildOptimizer,
  BuildAnalyzer,
  buildConfig
};

// Default export
export default BuildUtils;

// Legacy compatibility
const defaultBuildUtils = createBuildUtils();
export const optimizeBuild = defaultBuildUtils.optimizeAndAnalyze.bind(defaultBuildUtils);
export const analyzeBuild = defaultBuildUtils.quickAnalysis.bind(defaultBuildUtils);

// Version metadata
export const version = '2.0.0';
export const compliant = true; // WFGY_Core_OneLine_v2.0 compliant