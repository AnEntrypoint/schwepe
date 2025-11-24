/**
 * Content Recommendations Module
 * Personalized content recommendation system
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

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
    const preferences = this.userPreferences.get(userId) || {};
    const allContent = Array.from(this.contentLibrary.content.values());

    const scoredContent = allContent.map(content => ({
      content,
      score: this.calculatePersonalScore(content, preferences)
    }));

    return scoredContent
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => item.content);
  }

  /**
   * Calculate personalization score
   */
  calculatePersonalScore(content, preferences) {
    let score = 0;

    if (preferences.categories && preferences.categories[content.category]) {
      score += preferences.categories[content.category] * 0.4;
    }

    if (content.tags && preferences.tags) {
      content.tags.forEach(tag => {
        if (preferences.tags[tag]) {
          score += preferences.tags[tag] * 0.2;
        }
      });
    }

    const trendingScore = this.trendingContent.get(content.id) || 0;
    score += trendingScore * 0.3;

    const daysSinceAdded = (Date.now() - content.addedAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSinceAdded / 30);
    score += recencyScore * 0.1;

    return score;
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(userId, viewedContent, rating = null) {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, {
        categories: {},
        tags: {},
        lastUpdated: new Date()
      });
    }

    const preferences = this.userPreferences.get(userId);

    if (!preferences.categories[viewedContent.category]) {
      preferences.categories[viewedContent.category] = 0;
    }
    preferences.categories[viewedContent.category] += rating || 1;

    if (viewedContent.tags) {
      viewedContent.tags.forEach(tag => {
        if (!preferences.tags[tag]) {
          preferences.tags[tag] = 0;
        }
        preferences.tags[tag] += rating || 1;
      });
    }

    preferences.lastUpdated = new Date();
  }

  /**
   * Update trending content scores
   */
  updateTrendingContent(viewershipData) {
    this.trendingContent.clear();

    viewershipData.forEach((data, contentId) => {
      if (data.length > 0) {
        const recentViewers = data.slice(-10);
        const trendingScore = recentViewers.reduce((sum, d) => sum + d.viewers, 0);
        this.trendingContent.set(contentId, trendingScore);
      }
    });
  }

  /**
   * Get trending content
   */
  getTrendingContent(count = 10) {
    return Array.from(this.trendingContent.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([contentId, score]) => ({ contentId, score }));
  }
}