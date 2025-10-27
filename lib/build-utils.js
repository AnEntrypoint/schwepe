/**
 * Build Utils Module
 * Build utilities and main exports
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { BuildOptimizer, buildConfig } from './build-core.js';
import { BuildAnalyzer } from './build-analyzer.js';

/**
 * Build optimization utilities
 */
export class BuildUtils {
  constructor() {
    this.optimizer = new BuildOptimizer();
    this.analyzer = new BuildAnalyzer();
  }

  /**
   * Run complete build optimization
   */
  async optimizeAndAnalyze(buildPath) {
    console.log('Starting complete build optimization and analysis...');
    
    // Run optimization
    const optimizationResults = await this.optimizer.optimizeBuild(buildPath);
    
    // Run analysis
    const analysisResults = await this.analyzer.analyzeBuild(buildPath);
    
    // Generate report
    const report = this.analyzer.generateReport();
    
    return {
      optimization: optimizationResults,
      analysis: analysisResults,
      report: report,
      stats: this.optimizer.getStats()
    };
  }

  /**
   * Quick optimization (analysis only)
   */
  async quickAnalysis(buildPath) {
    return this.analyzer.analyzeBuild(buildPath);
  }

  /**
   * Get build configuration
   */
  getConfig() {
    return buildConfig;
  }

  /**
   * Update build configuration
   */
  updateConfig(newConfig) {
    Object.assign(buildConfig, newConfig);
    this.optimizer.config = { ...buildConfig };
  }
}

/**
 * Factory functions
 */
export function createBuildOptimizer(options = {}) {
  return new BuildOptimizer(options);
}

export function createBuildAnalyzer() {
  return new BuildAnalyzer();
}

export function createBuildUtils() {
  return new BuildUtils();
}

// Convenience functions
export async function quickOptimize(buildPath, options = {}) {
  const optimizer = new BuildOptimizer(options);
  return optimizer.optimizeBuild(buildPath);
}

export async function quickAnalyze(buildPath) {
  const analyzer = new BuildAnalyzer();
  await analyzer.analyzeBuild(buildPath);
  return analyzer.generateReport();
}

// Exports
export {
  BuildOptimizer,
  BuildAnalyzer,
  BuildUtils,
  buildConfig
};

// Default export
export default BuildUtils;