/**
 * Schwelevision Scheduler Optimization Module
 * Schedule optimization and recommendation engine
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { utils } from './tv-core-basic.js';

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

  analyzePerformance(schedule, viewershipData) {
    const totalPrograms = schedule.length;
    let totalViewers = 0;
    let programsWithData = 0;

    schedule.forEach(program => {
      const data = viewershipData.get(program.id);
      if (data && data.length > 0) {
        programsWithData++;
        totalViewers += data.reduce((sum, d) => sum + d.viewers, 0) / data.length;
      }
    });

    return {
      totalPrograms,
      programsWithData,
      avgViewers: programsWithData > 0 ? totalViewers / programsWithData : 0,
      dataCompleteness: totalPrograms > 0 ? (programsWithData / totalPrograms) * 100 : 0
    };
  }

  generateSuggestions(schedule, contentLibrary, popularityScores, performance) {
    const suggestions = [];

    const sortedContent = Array.from(popularityScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    sortedContent.forEach(([contentId, score]) => {
      const content = contentLibrary.content.get(contentId);
      if (content) {
        suggestions.push({
          action: 'add_popular_content',
          contentId,
          content,
          score,
          reason: `High popularity score: ${score.toFixed(2)}`,
          priority: score
        });
      }
    });

    if (performance.avgViewers < 100) {
      suggestions.push({
        action: 'increase_promotion',
        reason: 'Low average viewership detected',
        priority: 80
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  applyOptimizations(schedule, suggestions) {
    const optimizedSchedule = [...schedule];

    suggestions.forEach(suggestion => {
      if (suggestion.action === 'add_popular_content' && suggestion.content) {
        const existingIndex = optimizedSchedule.findIndex(
          item => item.id === suggestion.contentId
        );

        if (existingIndex === -1) {
          optimizedSchedule.push({
            ...suggestion.content,
            optimized: true,
            optimizationReason: suggestion.reason
          });
        }
      }
    });

    return optimizedSchedule;
  }
}