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

    return score;
  }

  /**
   * Get score breakdown reasons
   */
  getScoreReasons(content, timeSlot, popularity) {
    const reasons = [];

    if (content.category === timeSlot.programType) {
      reasons.push('Matches time slot category');
    }

    if (popularity > 50) {
      reasons.push('High popularity');
    }

    const daysSinceAdded = (Date.now() - content.addedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAdded < 7) {
      reasons.push('Recently added');
    }

    return reasons;
  }
}

/**
 * Schedule optimization system
 */
export class ScheduleOptimizer {
  /**
   * Optimize schedule based on various factors
   */
  optimize(params) {
    const { currentSchedule, contentLibrary, viewershipData, popularityScores } = params;

    // Analyze current schedule performance
    const performance = this.analyzePerformance(currentSchedule, viewershipData);
    
    // Generate optimization suggestions
    const suggestions = this.generateSuggestions(
      currentSchedule,
      contentLibrary,
      popularityScores,
      performance
    );

    return {
      currentPerformance: performance,
      suggestions,
      optimizedSchedule: this.applyOptimizations(currentSchedule, suggestions)
    };
  }

  /**
   * Analyze schedule performance
   */
  analyzePerformance(schedule, viewershipData) {
    const performance = {
      totalViewers: 0,
      averageEngagement: 0,
      peakPerformers: [],
      underperformers: []
    };

    let totalEngagement = 0;
    let programCount = 0;

    schedule.forEach(program => {
      const data = viewershipData.get(program.id);
      if (data && data.length > 0) {
        const avgViewers = data.reduce((sum, d) => sum + d.viewers, 0) / data.length;
        const avgEngagement = data.reduce((sum, d) => sum + d.engagementScore, 0) / data.length;
        
        performance.totalViewers += avgViewers;
        totalEngagement += avgEngagement;
        programCount++;

        if (avgEngagement > 70) {
          performance.peakPerformers.push({ program, score: avgEngagement });
        } else if (avgEngagement < 30) {
          performance.underperformers.push({ program, score: avgEngagement });
        }
      }
    });

    performance.averageEngagement = programCount > 0 ? totalEngagement / programCount : 0;

    return performance;
  }

  /**
   * Generate optimization suggestions
   */
  generateSuggestions(schedule, contentLibrary, popularityScores, performance) {
    const suggestions = [];

    // Replace underperforming content
    performance.underperformers.forEach(({ program }) => {
      const alternatives = this.findAlternatives(program, contentLibrary, popularityScores);
      if (alternatives.length > 0) {
        suggestions.push({
          type: 'replace',
          originalProgram: program,
          suggestedAlternative: alternatives[0],
          reason: 'Low engagement score'
        });
      }
    });

    // Reorder schedule for better flow
    if (performance.peakPerformers.length > 1) {
      suggestions.push({
        type: 'reorder',
        description: 'Reorder schedule to place high-performing content in prime time',
        programs: performance.peakPerformers.map(p => p.program)
      });
    }

    return suggestions;
  }

  /**
   * Find alternative content
   */
  findAlternatives(program, contentLibrary, popularityScores) {
    return Array.from(contentLibrary.content.values())
      .filter(content => 
        content.category === program.category && 
        content.id !== program.id
      )
      .sort((a, b) => 
        (popularityScores.get(b.id) || 0) - (popularityScores.get(a.id) || 0)
      )
      .slice(0, 3);
  }

  /**
   * Apply optimizations to schedule
   */
  applyOptimizations(currentSchedule, suggestions) {
    let optimized = [...currentSchedule];

    suggestions.forEach(suggestion => {
      switch (suggestion.type) {
        case 'replace':
          const index = optimized.findIndex(p => p.id === suggestion.originalProgram.id);
          if (index !== -1) {
            optimized[index] = suggestion.suggestedAlternative;
          }
          break;
        // Add more optimization types as needed
      }
    });

    return optimized;
  }
}