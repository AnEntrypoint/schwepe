/**
 * Debug Hooks System
 * Provides comprehensive debugging API for REPL and Playwright
 * Exposes all major subsystems for inspection and manipulation
 * 
 * Usage in Playwright:
 *   const state = await page.evaluate(() => window.__DEBUG.getPlaybackState())
 *   await page.evaluate(() => window.__DEBUG.jumpToVideo(5))
 *   const cache = await page.evaluate(() => window.__DEBUG.getDurationCache())
 */

export class DebugHooks {
  constructor() {
    this.playbackHandler = null;
    this.tvScheduler = null;
    this.cacheManager = null;
    this.hookTime = new Date().toISOString();
    this.inspectionHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Initialize hooks - call from main app after all systems are ready
   */
  static init(playbackHandler, tvScheduler, cacheManager) {
    const hooks = new DebugHooks();
    hooks.playbackHandler = playbackHandler;
    hooks.tvScheduler = tvScheduler;
    hooks.cacheManager = cacheManager;
    
    // Expose globally for REPL and Playwright
    if (typeof window !== 'undefined') {
      window.__DEBUG = hooks;
      console.log('✅ Debug hooks initialized at', hooks.hookTime);
      console.log('📌 Access via: window.__DEBUG or ${ in REPL');
    }
    
    return hooks;
  }

  /**
   * Get complete playback state
   */
  getPlaybackState() {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    
    const pb = this.playbackHandler;
    return {
      timestamp: new Date().toISOString(),
      playingScheduled: pb.playingScheduled,
      inCommercialBreak: pb.inCommercialBreak,
      scheduleIndex: pb.scheduleIndex,
      fillerIndex: pb.fillerIndex,
      currentQueueIndex: pb.queueIndex,
      scheduledVideoCount: pb.scheduledVideos.length,
      fillerVideoCount: pb.savedVideos.length,
      totalScheduleDuration: this._calculateTotalScheduleDuration(),
      cacheSize: Object.keys(pb.durationCache).length,
      normalizedVolume: pb.normalizedVolume,
      currentSlotDuration: pb.currentSlotDuration,
      currentBreakIndex: pb.currentBreakIndex,
      showingStatic: pb.showingStatic
    };
  }

  /**
   * Get detailed playback analytics
   */
  getPlaybackAnalytics() {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    
    const pb = this.playbackHandler;
    const videoElements = pb.videoQueue.map((el, idx) => ({
      index: idx,
      paused: el?.paused,
      currentTime: el?.currentTime || 0,
      duration: el?.duration || 0,
      src: el?.src?.slice(-50) || 'none', // Last 50 chars to avoid huge output
      readyState: el?.readyState,
      networkState: el?.networkState,
      volume: el?.volume
    }));

    return {
      timestamp: new Date().toISOString(),
      videoElements,
      durationCache: pb.durationCache,
      scheduleEpoch: new Date(pb.scheduleEpoch).toISOString(),
      elapsedSinceEpoch: Date.now() - pb.scheduleEpoch,
      analyticsData: pb.analytics || {}
    };
  }

  /**
   * Get current video information
   */
  getCurrentVideoInfo() {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    
    const pb = this.playbackHandler;
    const current = pb.videoQueue[pb.queueIndex];
    const currentType = pb.playingScheduled ? 'SCHEDULE' : 'FILLER';
    const currentIndex = pb.playingScheduled ? pb.scheduleIndex : pb.fillerIndex;
    
    let videoInfo = {
      type: currentType,
      index: currentIndex,
      currentTime: current?.currentTime || 0,
      duration: current?.duration || 0,
      paused: current?.paused || false,
      readyState: current?.readyState
    };

    if (pb.playingScheduled && pb.scheduledVideos[currentIndex]) {
      const vid = pb.scheduledVideos[currentIndex];
      videoInfo.title = vid.title || vid.url || 'Unknown';
      videoInfo.url = vid.url;
    } else if (!pb.playingScheduled && pb.savedVideos[currentIndex]) {
      const vid = pb.savedVideos[currentIndex];
      videoInfo.title = vid.title || 'Filler';
      videoInfo.filename = vid.filename;
    }

    return videoInfo;
  }

  /**
   * Jump to specific video by index
   */
  jumpToVideo(index, isScheduled = true) {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    
    const pb = this.playbackHandler;
    
    if (isScheduled) {
      if (index >= pb.scheduledVideos.length) {
        return { error: `Index ${index} out of range for scheduled videos (max: ${pb.scheduledVideos.length - 1})` };
      }
      pb.scheduleIndex = index;
      pb.playingScheduled = true;
      console.log(`⏩ Jumped to scheduled video index ${index}`);
    } else {
      if (index >= pb.savedVideos.length) {
        return { error: `Index ${index} out of range for filler videos (max: ${pb.savedVideos.length - 1})` };
      }
      pb.fillerIndex = index;
      pb.playingScheduled = false;
      console.log(`⏩ Jumped to filler video index ${index}`);
    }

    // Trigger playback reload if method exists
    if (pb.nextVideo && typeof pb.nextVideo === 'function') {
      pb.nextVideo();
    }

    this._recordInspection('jumpToVideo', { index, isScheduled });
    return this.getCurrentVideoInfo();
  }

  /**
   * Set playback volume (normalized 0-1)
   */
  setVolume(volume) {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    
    const pb = this.playbackHandler;
    const normalized = Math.max(0, Math.min(1, volume));
    pb.normalizedVolume = normalized;
    
    pb.videoQueue.forEach(v => {
      if (v) v.volume = normalized;
    });

    console.log(`🔊 Volume set to ${(normalized * 100).toFixed(0)}%`);
    this._recordInspection('setVolume', { volume: normalized });
    
    return { volume: normalized };
  }

  /**
   * Get volume level
   */
  getVolume() {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    return { volume: this.playbackHandler.normalizedVolume };
  }

  /**
   * List all scheduled videos
   */
  listScheduledVideos(limit = 10) {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    
    const pb = this.playbackHandler;
    const videos = pb.scheduledVideos.slice(0, limit);
    
    return videos.map((v, idx) => ({
      index: idx,
      title: v.title || 'Unknown',
      url: v.url?.slice(-40) || 'N/A',
      cached: pb.durationCache[v.url] ? 'yes' : 'no'
    }));
  }

  /**
   * List all filler videos
   */
  listFillerVideos(limit = 10) {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    
    const pb = this.playbackHandler;
    const videos = pb.savedVideos.slice(0, limit);
    
    return videos.map((v, idx) => ({
      index: idx,
      title: v.title || v.filename || 'Unknown',
      filename: v.filename?.slice(-40) || 'N/A'
    }));
  }

  /**
   * Get duration cache
   */
  getDurationCache(keys = null) {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    
    const pb = this.playbackHandler;
    const cache = { ...pb.durationCache };
    
    if (keys) {
      const filtered = {};
      keys.forEach(k => {
        if (cache[k]) filtered[k] = cache[k];
      });
      return filtered;
    }

    return {
      size: Object.keys(cache).length,
      cache
    };
  }

  /**
   * Clear duration cache
   */
  clearDurationCache() {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    
    const pb = this.playbackHandler;
    const count = Object.keys(pb.durationCache).length;
    
    pb.durationCache = {};
    try {
      localStorage.removeItem('schwelevision-duration-cache');
    } catch (e) {
      console.warn('Could not clear localStorage cache');
    }

    console.log(`🗑️  Cleared ${count} cached durations`);
    this._recordInspection('clearDurationCache', { count });
    
    return { cleared: count };
  }

  /**
   * Force play next video
   */
  forceNextVideo() {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    
    const pb = this.playbackHandler;
    if (pb.playingScheduled) {
      pb.scheduleIndex++;
    } else {
      pb.fillerIndex++;
    }

    if (pb.nextVideo && typeof pb.nextVideo === 'function') {
      pb.nextVideo();
    }

    console.log('⏭️  Skipped to next video');
    this._recordInspection('forceNextVideo', {});
    
    return this.getCurrentVideoInfo();
  }

  /**
   * Toggle between scheduled and filler
   */
  toggleMode() {
    if (!this.playbackHandler) return { error: 'PlaybackHandler not initialized' };
    
    const pb = this.playbackHandler;
    pb.playingScheduled = !pb.playingScheduled;

    if (pb.nextVideo && typeof pb.nextVideo === 'function') {
      pb.nextVideo();
    }

    const mode = pb.playingScheduled ? 'SCHEDULE' : 'FILLER';
    console.log(`🔄 Switched to ${mode} mode`);
    this._recordInspection('toggleMode', { newMode: mode });
    
    return { mode };
  }

  /**
   * Get scheduler information
   */
  getSchedulerInfo() {
    if (!this.tvScheduler) return { error: 'TV Scheduler not initialized' };
    
    const scheduler = this.tvScheduler;
    return {
      currentWeek: scheduler.currentWeek || 'unknown',
      scheduleLoaded: !!scheduler.schedule,
      scheduleLength: scheduler.schedule?.length || 0,
      scheduleType: scheduler.scheduleType || 'unknown'
    };
  }

  /**
   * Get inspection history
   */
  getInspectionHistory(limit = 20) {
    return this.inspectionHistory.slice(-limit);
  }

  /**
   * Clear inspection history
   */
  clearInspectionHistory() {
    const count = this.inspectionHistory.length;
    this.inspectionHistory = [];
    return { cleared: count };
  }

  /**
   * Get comprehensive debug report
   */
  getDebugReport() {
    return {
      timestamp: new Date().toISOString(),
      hookInitTime: this.hookTime,
      playbackState: this.getPlaybackState(),
      currentVideo: this.getCurrentVideoInfo(),
      schedulerInfo: this.getSchedulerInfo(),
      inspectionCount: this.inspectionHistory.length,
      recentActions: this.inspectionHistory.slice(-5)
    };
  }

  /**
   * Verify system health
   */
  healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      systems: {
        playbackHandler: !!this.playbackHandler,
        tvScheduler: !!this.tvScheduler,
        cacheManager: !!this.cacheManager
      }
    };

    if (this.playbackHandler) {
      const pb = this.playbackHandler;
      health.playback = {
        videoElementsReady: pb.videoQueue.every(v => !!v),
        staticCanvasReady: !!pb.staticCanvas,
        videosLoaded: pb.scheduledVideos.length > 0,
        videosCount: pb.scheduledVideos.length
      };
    }

    return health;
  }

  /**
   * Execute custom code in debug context
   * Usage: window.__DEBUG.eval('getPlaybackState()')
   */
  eval(code) {
    try {
      // Create function with all debug methods in scope
      const fn = new Function('__DEBUG', `with(__DEBUG) { return ${code} }`);
      const result = fn(this);
      this._recordInspection('eval', { code });
      return { result, success: true };
    } catch (e) {
      return { error: e.message, success: false };
    }
  }

  /**
   * Private: Record inspection in history
   */
  _recordInspection(action, params) {
    this.inspectionHistory.push({
      timestamp: new Date().toISOString(),
      action,
      params
    });

    if (this.inspectionHistory.length > this.maxHistorySize) {
      this.inspectionHistory.shift();
    }
  }

  /**
   * Private: Calculate total schedule duration from cache
   */
  _calculateTotalScheduleDuration() {
    if (!this.playbackHandler) return 0;
    
    const pb = this.playbackHandler;
    let total = 0;
    
    pb.scheduledVideos.forEach(v => {
      const duration = pb.durationCache[v.url] || pb.DEFAULT_SLOT_DURATION;
      total += duration;
    });

    return total;
  }
}

export default DebugHooks;
