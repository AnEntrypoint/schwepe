/**
 * Schwelevision Scheduler Advanced Module
 * Advanced scheduling features
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { AdvancedScheduler } from './tv-scheduler-basic.js';
import { utils } from './tv-core-basic.js';

/**
 * Intelligent scheduling system with ML-based recommendations
 */
export class IntelligentScheduler extends AdvancedScheduler {
  constructor() {
    super();
    this.viewershipData = new Map();
    this.popularityScores = new Map();
    this.recommendationEngine = new RecommendationEngine();
  }

  /**
   * Track viewership for analytics
   */
  trackViewership(programId, viewers, duration) {
    if (!this.viewershipData.has(programId)) {
      this.viewershipData.set(programId, []);
    }

    const data = this.viewershipData.get(programId);
    data.push({
      timestamp: Date.now(),
      viewers,
      duration,
      engagementScore: this.calculateEngagementScore(viewers, duration)
    });

    // Update popularity score
    this.updatePopularityScore(programId);
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(viewers, duration) {
    // Simple engagement calculation
    const baseScore = Math.log10(viewers + 1) * 10;
    const durationBonus = Math.min(duration / 600000, 1) * 20; // 10 minutes max bonus
    return baseScore + durationBonus;
  }

  /**
   * Update popularity score for content
   */
  updatePopularityScore(programId) {
    const data = this.viewershipData.get(programId);
    if (!data || data.length === 0) return;

    const recentData = data.slice(-10); // Last 10 entries
    const avgEngagement = recentData.reduce((sum, d) => sum + d.engagementScore, 0) / recentData.length;
    
    this.popularityScores.set(programId, avgEngagement);
  }

  /**
   * Get recommended content for time slot
   */
  getRecommendedContent(timeSlot, contentLibrary) {
    const recommendations = this.recommendationEngine.getRecommendations(
      timeSlot,
      contentLibrary,
      this.popularityScores
    );

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Auto-optimize schedule based on performance
   */
  optimizeSchedule(contentLibrary) {
    const optimization = new ScheduleOptimizer();
    
    return optimization.optimize({
      currentSchedule: this.schedule,
      contentLibrary: contentLibrary,
      viewershipData: this.viewershipData,
      popularityScores: this.popularityScores
    });
  }
}

/**
 * Content recommendation engine
 */
export class RecommendationEngine {
  constructor() {
    this.weights = {
      timeSlotMatch: 0.3,
      popularity: 0.4,
      categoryPreference: 0.2,
      recencyBias: 0.1
    };
  }

  /**
   * Get content recommendations
   */
  getRecommendations(timeSlot, contentLibrary, popularityScores) {
    const recommendations = [];

    for (const [contentId, content] of contentLibrary.content) {
      const score = this.calculateRecommendationScore(
        content,
        timeSlot,
        popularityScores.get(contentId) || 0
      );

      recommendations.push({
        contentId,
        content,
        score,
        reasons: this.getScoreReasons(content, timeSlot, popularityScores.get(contentId) || 0)
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate recommendation score
   */
  calculateRecommendationScore(content, timeSlot, popularity) {
    let score = 0;

    // Time slot matching
    if (content.category === timeSlot.programType) {
      score += this.weights.timeSlotMatch * 100;
    }

    // Popularity
    score += this.weights.popularity * Math.min(popularity, 100);

    // Category preference (simplified)
    score += this.weights.categoryPreference * 50;

    // Recency bias (prefer recently added content)
    const daysSinceAdded = (Date.now() - content.addedAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 100 - daysSinceAdded * 2);
    score += this.weights.recencyBias * recencyScore;
