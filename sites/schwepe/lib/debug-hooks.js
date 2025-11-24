/**
 * Schwelevision Debug Hooks
 * Provides comprehensive debugging interface for REPL and Playwright testing
 * Accessible via window.__DEBUG in browser console
 */

class DebugHooks {
  constructor() {
    this.playback = null;
    this.tvScheduler = null;
    this.cacheManager = null;
    this.initialized = false;
  }

  /**
   * Initialize debug hooks with playback system references
   */
  init(playbackHandler, tvScheduler = null, cacheManager = null) {
    this.playback = playbackHandler;
    this.tvScheduler = tvScheduler;
    this.cacheManager = cacheManager;
    this.initialized = true;

    // Expose debug interface globally
    window.__DEBUG = {
      // State inspection
      getPlaybackState: () => this.getPlaybackState(),
      getCurrentVideoInfo: () => this.getCurrentVideoInfo(),
      getSchedulerInfo: () => this.getSchedulerInfo(),
      getDurationCache: () => this.getDurationCache(),

      // Playback control
      jumpToVideo: (index, isScheduled) => this.jumpToVideo(index, isScheduled),
      forceNextVideo: () => this.forceNextVideo(),
      toggleMode: () => this.toggleMode(),

      // Volume control
      setVolume: (volume) => this.setVolume(volume),
      getVolume: () => this.getVolume(),

      // Content lists
      listScheduledVideos: () => this.listScheduledVideos(),
      listFillerVideos: () => this.listFillerVideos(),

      // Cache management
      clearDurationCache: () => this.clearDurationCache(),

      // System health
      healthCheck: () => this.healthCheck(),
      getDebugReport: () => this.getDebugReport(),

      // Advanced debugging
      eval: (code) => this.evalInContext(code),

      // Direct access to handlers (for advanced debugging)
      _playback: this.playback,
      _tvScheduler: this.tvScheduler,
      _cacheManager: this.cacheManager
    };

    console.log('🛠 Debug hooks initialized. Access via window.__DEBUG');
    console.log('📝 Available methods:', Object.keys(window.__DEBUG).filter(k => !k.startsWith('_')));
  }

  /**
   * Get complete playback system state
   */
  getPlaybackState() {
    if (!this.playback) return { error: 'Playback handler not initialized' };

    return {
      playingScheduled: this.playback.playingScheduled,
      scheduleIndex: this.playback.scheduleIndex,
      fillerIndex: this.playback.fillerIndex,
      queueIndex: this.playback.queueIndex,
      activeVideoIndex: this.playback.activeVideoIndex,
      showingStatic: this.playback.showingStatic,
      inCommercialBreak: this.playback.inCommercialBreak,
      currentBreakIndex: this.playback.currentBreakIndex,
      userHasInteracted: this.playback.userHasInteracted,
      normalizedVolume: this.playback.normalizedVolume,
      totalScheduledVideos: this.playback.scheduledVideos?.length || 0,
      totalFillerVideos: this.playback.savedVideos?.length || 0,
      cachedDurations: Object.keys(this.playback.durationCache || {}).length
    };
  }

  /**
   * Get info about currently playing video
   */
  getCurrentVideoInfo() {
    if (!this.playback) return { error: 'Playback handler not initialized' };

    const activeVideo = this.playback.videoQueue[this.playback.activeVideoIndex];
    const currentVideo = this.playback.playingScheduled
      ? this.playback.scheduledVideos[this.playback.scheduleIndex]
      : this.playback.savedVideos[this.playback.fillerIndex];

    return {
      type: this.playback.playingScheduled ? 'scheduled' : 'filler',
      index: this.playback.playingScheduled ? this.playback.scheduleIndex : this.playback.fillerIndex,
      metadata: currentVideo,
      videoElement: {
        src: activeVideo?.src,
        currentTime: activeVideo?.currentTime,
        duration: activeVideo?.duration,
        paused: activeVideo?.paused,
        muted: activeVideo?.muted,
        volume: activeVideo?.volume,
        readyState: activeVideo?.readyState
      }
    };
  }

  /**
   * Jump to specific video
   */
  jumpToVideo(index, isScheduled = true) {
    if (!this.playback) {
      console.error('❌ Playback handler not initialized');
      return false;
    }

    if (isScheduled) {
      if (index < 0 || index >= this.playback.scheduledVideos.length) {
        console.error(`❌ Invalid scheduled video index: ${index} (max: ${this.playback.scheduledVideos.length - 1})`);
        return false;
      }
      this.playback.scheduleIndex = index;
      this.playback.playingScheduled = true;
    } else {
      if (index < 0 || index >= this.playback.savedVideos.length) {
        console.error(`❌ Invalid filler video index: ${index} (max: ${this.playback.savedVideos.length - 1})`);
        return false;
      }
      this.playback.fillerIndex = index;
      this.playback.playingScheduled = false;
    }

    console.log(`✓ Jumping to ${isScheduled ? 'scheduled' : 'filler'} video #${index}`);
    this.playback.playNextVideo();
    return true;
  }

  /**
   * Skip to next video
   */
  forceNextVideo() {
    if (!this.playback) {
      console.error('❌ Playback handler not initialized');
      return false;
    }

    console.log('⏭ Forcing next video...');
    this.playback.playNextVideo();
    return true;
  }

  /**
   * Toggle between scheduled and filler mode
   */
  toggleMode() {
    if (!this.playback) {
      console.error('❌ Playback handler not initialized');
      return false;
    }

    const newMode = !this.playback.playingScheduled;
    this.playback.playingScheduled = newMode;
    console.log(`✓ Switched to ${newMode ? 'scheduled' : 'filler'} mode`);
    this.playback.playNextVideo();
    return newMode;
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume) {
    if (!this.playback) {
      console.error('❌ Playback handler not initialized');
      return false;
    }

    if (volume < 0 || volume > 1) {
      console.error('❌ Volume must be between 0 and 1');
      return false;
    }

    this.playback.normalizedVolume = volume;
    const activeVideo = this.playback.videoQueue[this.playback.activeVideoIndex];
    if (activeVideo) {
      activeVideo.volume = volume;
    }
    console.log(`🔊 Volume set to ${Math.round(volume * 100)}%`);
    return true;
  }

  /**
   * Get current volume
   */
  getVolume() {
    if (!this.playback) return null;
    return this.playback.normalizedVolume;
  }

  /**
   * List all scheduled videos
   */
  listScheduledVideos() {
    if (!this.playback) return [];
    return this.playback.scheduledVideos.map((video, index) => ({
      index,
      title: video.title,
      url: video.url,
      duration: video.duration
    }));
  }

  /**
   * List all filler/ad videos
   */
  listFillerVideos() {
    if (!this.playback) return [];
    return this.playback.savedVideos.map((video, index) => ({
      index,
      title: video.title,
      filename: video.filename,
      duration: video.duration
    }));
  }

  /**
   * Get video duration cache
   */
  getDurationCache() {
    if (!this.playback) return {};
    return { ...this.playback.durationCache };
  }

  /**
   * Clear duration cache (will rebuild as videos play)
   */
  clearDurationCache() {
    if (!this.playback) {
      console.error('❌ Playback handler not initialized');
      return false;
    }

    this.playback.durationCache = {};
    localStorage.removeItem('schwelevision_duration_cache');
    console.log('✓ Duration cache cleared');
    return true;
  }

  /**
   * Get TV scheduler info
   */
  getSchedulerInfo() {
    if (!this.tvScheduler) {
      return { error: 'TV scheduler not initialized' };
    }

    return {
      currentWeek: this.tvScheduler.currentWeek,
      totalWeeks: this.tvScheduler.totalWeeks,
      loadedSchedules: Object.keys(this.tvScheduler.schedules || {})
    };
  }

  /**
   * Health check - verify all systems ready
   */
  healthCheck() {
    const health = {
      playbackHandler: !!this.playback,
      tvScheduler: !!this.tvScheduler,
      cacheManager: !!this.cacheManager,
      videoElements: false,
      scheduledVideos: false,
      fillerVideos: false,
      durationCache: false
    };

    if (this.playback) {
      health.videoElements = this.playback.videoQueue.every(v => v !== null);
      health.scheduledVideos = this.playback.scheduledVideos.length > 0;
      health.fillerVideos = this.playback.savedVideos.length > 0;
      health.durationCache = Object.keys(this.playback.durationCache).length > 0;
    }

    const allHealthy = Object.values(health).every(v => v === true);
    console.log(allHealthy ? '✅ All systems ready' : '⚠ Some systems not ready');
    return health;
  }

  /**
   * Get complete debug report
   */
  getDebugReport() {
    return {
      timestamp: new Date().toISOString(),
      playbackState: this.getPlaybackState(),
      currentVideo: this.getCurrentVideoInfo(),
      schedulerInfo: this.getSchedulerInfo(),
      health: this.healthCheck(),
      durationCacheSize: Object.keys(this.getDurationCache()).length
    };
  }

  /**
   * Execute custom code in debug context
   * Provides access to playback, tvScheduler, and cacheManager
   */
  evalInContext(code) {
    try {
      const playback = this.playback;
      const tvScheduler = this.tvScheduler;
      const cacheManager = this.cacheManager;

      // eslint-disable-next-line no-eval
      const result = eval(code);
      console.log('✓ Eval result:', result);
      return result;
    } catch (error) {
      console.error('❌ Eval error:', error);
      return { error: error.message };
    }
  }
}

// Create singleton instance
const debugHooks = new DebugHooks();

// Export as default and named export
export default debugHooks;
export { debugHooks as DebugHooks };
