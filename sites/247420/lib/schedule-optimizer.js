/**
 * Schedule Optimizer Module
 * Schedule optimization and analysis
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

/**
 * Schedule optimization system
 */
export class ScheduleOptimizer {
  /**
   * Optimize schedule based on various factors
   */
  optimize(params) {
    const { currentSchedule, contentLibrary, viewershipData, popularityScores } = params;

    const performance = this.analyzePerformance(currentSchedule, viewershipData);
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
      if (suggestion.type === 'replace') {
        const index = optimized.findIndex(p => p.id === suggestion.originalProgram.id);
        if (index !== -1) {
          optimized[index] = suggestion.suggestedAlternative;
        }
      }
    });

    return optimized;
  }
}