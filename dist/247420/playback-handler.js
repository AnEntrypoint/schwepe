export class PlaybackHandler {
  constructor(cacheManager = null, preloadManager = null, performanceMonitor = null) {
    this.currentVideoEl = document.getElementById('currentVideo');
    this.nextVideoEl = document.getElementById('nextVideo');
    this.thirdVideoEl = document.getElementById('thirdVideo');
    this.staticEl = document.getElementById('static');
    this.savedVideos = [];
    this.scheduledVideos = [];
    this.scheduleIndex = 0;
    this.fillerIndex = 0;
    this.videoQueue = [this.currentVideoEl, this.nextVideoEl, this.thirdVideoEl];
    this.queueIndex = 0;
    this.loadTimeout = null;
    this.playingScheduled = false;
    this.showingStatic = false;
    this.staticCanvas = document.getElementById('noiseCanvas');
    this.scheduleEpoch = new Date('2025-11-14T00:00:00Z').getTime();
    this.durationCache = this.loadDurationCache();
    this.DEFAULT_SLOT_DURATION = 1800000;
    this.currentSlotStartTime = 0;
    this.currentSlotDuration = 0;
    this.currentSlotBreaks = [];
    this.currentBreakIndex = 0;
    this.scheduledVideoEnded = false;
    this.commercialBreakAds = [];
    this.commercialBreakIndex = 0;
    this.inCommercialBreak = false;
    this.preloadedAds = new Map();
    this.preloadedScheduledVideo = null;
    this.isPreloadingScheduled = false;
    this.waitingForScheduledPreload = false;
    this.pendingScheduledSeekTime = 0;
    this.continuousStaticInterval = null;
    this.currentlyPlayingAd = null;
    this.scheduledPreloadFailed = false; // Track if we should give up on scheduled content
    this.scheduledPreloadTimeout = null; // Timeout for giving up on scheduled content
    this.normalizedVolume = 0.7; // Normalized volume level for all videos
    this.recentlyPlayedAds = []; // Track recently played ads to prevent repetition
    this.maxRecentAds = 20; // Don't repeat any of the last 20 ads
    this.analytics = null;
    this.videoStartTime = 0;
    this.currentVideoMetadata = null;
    this.activeVideoIndex = 0; // Track which video element is currently active
    this.isTransitioning = false; // Prevent multiple concurrent playback attempts
    this.transitionDebounceTimeout = null; // Debounce rapid transitions
    this.userHasInteracted = false; // Track if user has interacted (for autoplay)
    this.initStaticCanvas();
    this.normalizeVideoVolumes();
    this.preventTabPausing(); // Prevent videos from pausing when tab changes
    this.setupAnalyticsTracking();
    this.setupUserInteractionTracking(); // Track first user interaction for autoplay
  }

  preventTabPausing() {
    // Prevent videos from pausing when tab is hidden
    // This ensures the immutable schedule continues even when users switch tabs
    document.addEventListener('visibilitychange', () => {
      // Don't let browser pause videos when tab is hidden
      // ONLY resume the active video element, not all videos
      const activeVideo = this.videoQueue[this.activeVideoIndex];
      if (activeVideo && activeVideo.paused && !this.showingStatic) {
        console.log('📺 Tab became hidden, resuming active video to maintain schedule');
        activeVideo.play().catch(e => {
          // If play fails, we'll catch up on next visibility
        });
      }
    });

    // Also prevent videos from pausing due to other reasons
    // ONLY for the active video element
    this.videoQueue.forEach((video, index) => {
      if (video) {
        video.addEventListener('pause', (e) => {
          // Only resume if this is the active video and we didn't intentionally pause
          if (index === this.activeVideoIndex && !this.showingStatic && video.src && video.readyState >= 2) {
            setTimeout(() => {
              // Double-check this is still the active video before resuming
              if (index === this.activeVideoIndex && video.paused) {
                console.log('📺 Active video unexpectedly paused, resuming');
                video.play().catch(() => {});
              }
            }, 100);
          }
        });
      }
    });
  }

  /**
   * Track first user interaction to enable audio autoplay
   */
  setupUserInteractionTracking() {
    const enableAudio = () => {
      if (!this.userHasInteracted) {
        this.userHasInteracted = true;
        console.log('🔊 User interaction detected - audio enabled');
        // Unmute currently playing video
        const activeVideo = this.videoQueue[this.activeVideoIndex];
        if (activeVideo && activeVideo.muted) {
          activeVideo.muted = false;
          activeVideo.volume = this.normalizedVolume;
        }
      }
    };

    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, enableAudio, { once: false, passive: true });
    });
  }

  /**
   * Safely play a video, handling autoplay restrictions
   * Starts muted if user hasn't interacted, then tries to play
   * Returns true if playback started, false if failed completely
   */
  async safePlay(videoEl, onSuccess = null, onFailure = null) {
    if (!videoEl) {
      if (onFailure) onFailure();
      return false;
    }

    // Always set volume first
    videoEl.volume = this.normalizedVolume;

    // Start muted if user hasn't interacted yet
    if (!this.userHasInteracted) {
      videoEl.muted = true;
    }

    try {
      await videoEl.play();
      // If user has interacted and video is muted, unmute it
      if (this.userHasInteracted && videoEl.muted) {
        videoEl.muted = false;
      }
      if (onSuccess) onSuccess();
      return true;
    } catch (e) {
      console.log('⚠ Autoplay blocked, playing muted');
      videoEl.muted = true;
      try {
        await videoEl.play();
        console.log('✓ Playing muted');
        if (onSuccess) onSuccess();
        return true;
      } catch (e2) {
        console.log('❌ Play failed completely');
        if (onFailure) onFailure();
        return false;
      }
    }
  }

  /**
   * Debounced transition to prevent rapid video cycling
   */
  debouncedTransition(callback, delay = 500) {
    if (this.transitionDebounceTimeout) {
      clearTimeout(this.transitionDebounceTimeout);
    }

    if (this.isTransitioning) {
      console.log('⏳ Transition already in progress, queuing...');
      this.transitionDebounceTimeout = setTimeout(() => {
        this.isTransitioning = false;
        callback();
      }, delay);
      return;
    }

    this.isTransitioning = true;
    this.transitionDebounceTimeout = setTimeout(() => {
      this.isTransitioning = false;
      callback();
    }, delay);
  }

  /**
   * Stop all non-active video elements to prevent audio overlap
   * This ensures only the currently playing video has audio
   */
  stopNonActiveVideos() {
    this.videoQueue.forEach((video, index) => {
      if (video && index !== this.activeVideoIndex) {
        video.pause();
        video.muted = true;
        // Clear the src to fully stop any buffering/playback
        if (video.src) {
          video.src = '';
          video.load();
        }
      }
    });
  }

  /**
   * Set the active video element and stop all others
   */
  setActiveVideo(index) {
    this.activeVideoIndex = index % 3;
    this.stopNonActiveVideos();
  }

  normalizeVideoVolumes() {
    // Set normalized volume on all video elements
    this.videoQueue.forEach(video => {
      if (video) {
        video.volume = this.normalizedVolume;
      }
    });
  }

  /**
   * Unmute all video elements (call after user interaction to enable sound)
   */
  unmute() {
    this.videoQueue.forEach(video => {
      if (video) {
        video.muted = false;
        video.volume = this.normalizedVolume;
      }
    });
    console.log('🔊 Videos unmuted');
  }

  /**
   * Set volume level for all videos
   */
  setVolume(volume) {
    this.normalizedVolume = Math.max(0, Math.min(1, volume));
    this.videoQueue.forEach(video => {
      if (video) {
        video.muted = false; // Also unmute when setting volume
        video.volume = this.normalizedVolume;
      }
    });
  }

  initStaticCanvas() {
    if (this.staticCanvas) {
      const ctx = this.staticCanvas.getContext('2d');
      this.staticCanvas.width = 640;
      this.staticCanvas.height = 480;
      this.renderStatic(ctx);
      setInterval(() => this.renderStatic(ctx), 50);
    }
  }

  renderStatic(ctx) {
    const imageData = ctx.createImageData(this.staticCanvas.width, this.staticCanvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const color = Math.random() * 255;
      imageData.data[i] = color;
      imageData.data[i + 1] = color;
      imageData.data[i + 2] = color;
      imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  showStatic(duration = 1000) {
    if (this.staticEl) {
      this.staticEl.classList.add('active');
      this.showingStatic = true;
      setTimeout(() => {
        this.staticEl.classList.remove('active');
        this.showingStatic = false;
      }, duration);
    }
  }

  playContinuousStatic() {
    console.log('📺 [STATIC]: Playing continuous static (waiting for content)');
    this.stopContinuousStatic();

    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl) {
      nowPlayingEl.textContent = 'Please Stand By...';
      nowPlayingEl.style.display = 'block';
      nowPlayingEl.style.color = '#888888';
    }

    // Hide all videos, mute them, and clear sources to prevent audio overlap
    this.videoQueue.forEach(v => {
      v.style.display = 'none';
      v.pause();
      v.muted = true;
      v.src = '';
      v.load();
    });

    // Show static
    if (this.staticEl) {
      this.staticEl.classList.add('active');
      this.showingStatic = true;
    }
  }

  stopContinuousStatic() {
    if (this.continuousStaticInterval) {
      clearInterval(this.continuousStaticInterval);
      this.continuousStaticInterval = null;
    }

    if (this.staticEl && this.showingStatic) {
      this.staticEl.classList.remove('active');
      this.showingStatic = false;
    }
  }


  async loadVideos() {
    try {
      // Load TV scheduler (primary content source for production)
      const { TVScheduler } = await import('./tv-scheduler.js').catch(() => ({ TVScheduler: null }));

      if (TVScheduler) {
        const scheduler = new TVScheduler();
        this.scheduledVideos = await scheduler.getScheduleVideos();
        console.log('✓ Loaded scheduled content:', this.scheduledVideos.length, 'shows');
      } else {
        this.scheduledVideos = [];
        console.log('⚠ TV scheduler not available');
      }

      // Try to load saved videos (may not exist in production)
      try {
        const videoList = await fetch('/public/videos.json').then(r => r.json());
        // Filter to only include actual video files (not images like .webp)
        const videoExtensions = ['.mp4', '.webm', '.ogv', '.mov', '.avi', '.mkv', '.flv'];
        const filteredVideos = videoList.filter(video => {
          const filename = video.filename || '';
          return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
        });

        // Verify saved videos directory exists by testing one video
        if (filteredVideos.length > 0) {
          const testVideo = filteredVideos[0];
          const testUrl = '/public/' + (testVideo.path || 'saved_videos/' + testVideo.filename);
          const testResponse = await fetch(testUrl, { method: 'HEAD' }).catch(() => null);
          if (testResponse && testResponse.ok) {
            this.savedVideos = filteredVideos;
            console.log('✓ Loaded saved videos:', this.savedVideos.length, 'video files');
            if (filteredVideos.length < videoList.length) {
              console.log('ℹ Filtered out', videoList.length - filteredVideos.length, 'non-video files (images, etc.)');
            }
          } else {
            console.log('⚠ Saved videos directory not available (expected in production)');
            this.savedVideos = [];
          }
        }
      } catch (e) {
        console.log('⚠ Saved videos not available:', e.message);
        this.savedVideos = [];
      }

      if (this.scheduledVideos.length === 0 && this.savedVideos.length === 0) {
        console.log('❌ No content available, using fallback');
        this.initializeDefault();
      } else {
        console.log('📺 TV Station Mode:');
        console.log('  - Schedule (programming):', this.scheduledVideos.length, 'videos');
        console.log('  - Filler (ads):', this.savedVideos.length, 'videos');
      }
    } catch (e) {
      console.log('Video data loading error:', e.message);
      this.initializeDefault();
    }
  }


  initializeDefault() {
    this.savedVideos = [
      { id: 'static_1', title: 'Static Filler', type: 'filler', duration: 10000 }
    ];
    this.scheduledVideos = [
      { id: 'sched_1', title: 'Scheduled Content 1', type: 'scheduled' }
    ];
  }

  loadDurationCache() {
    try {
      const cached = localStorage.getItem('schwepe_durations');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  }

  saveDurationCache() {
    try {
      localStorage.setItem('schwepe_durations', JSON.stringify(this.durationCache));
    } catch (e) {
      console.log('⚠ Failed to save duration cache');
    }
  }

  cacheDuration(videoId, duration) {
    this.durationCache[videoId] = duration;
    this.saveDurationCache();
  }

  seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Track an ad as recently played to prevent repetition
   */
  trackPlayedAd(video) {
    const videoId = video.filename || video.id;
    if (!this.recentlyPlayedAds.includes(videoId)) {
      this.recentlyPlayedAds.push(videoId);
      // Keep only the most recent ads in the list
      if (this.recentlyPlayedAds.length > this.maxRecentAds) {
        this.recentlyPlayedAds.shift();
      }
    }
  }

  /**
   * Check if an ad was recently played
   */
  wasRecentlyPlayed(video) {
    const videoId = video.filename || video.id;
    return this.recentlyPlayedAds.includes(videoId);
  }

  /**
   * Get a non-repeating ad, avoiding recently played and already selected ads
   * @param {Array} excludeIds - Array of video IDs to exclude (for current break)
   * @param {number} seed - Seed for deterministic selection
   * @returns {Object|null} - The selected video or null if none available
   */
  getNonRepeatingAd(excludeIds = [], seed = Date.now()) {
    if (this.savedVideos.length === 0) return null;

    // Build list of available ads (not recently played and not in excludeIds)
    const availableAds = this.savedVideos.filter(video => {
      const videoId = video.filename || video.id;
      return !this.recentlyPlayedAds.includes(videoId) && !excludeIds.includes(videoId);
    });

    // If all ads were recently played, reset and use all ads except excludeIds
    if (availableAds.length === 0) {
      console.log('⚠ All ads recently played, resetting history');
      this.recentlyPlayedAds = [];
      const fallbackAds = this.savedVideos.filter(video => {
        const videoId = video.filename || video.id;
        return !excludeIds.includes(videoId);
      });
      if (fallbackAds.length === 0) {
        // Even excludeIds exhausted all options, just pick any
        return this.savedVideos[Math.floor(this.seededRandom(seed) * this.savedVideos.length)];
      }
      return fallbackAds[Math.floor(this.seededRandom(seed) * fallbackAds.length)];
    }

    // Select from available ads using seeded random
    const index = Math.floor(this.seededRandom(seed) * availableAds.length);
    return availableAds[index];
  }

  pickCommercialBreak(slotIndex, breakIndex) {
    const seed = slotIndex * 1000 + breakIndex;
    const breakLength = Math.floor(this.seededRandom(seed) * 6) + 1;
    const ads = [];

    for (let i = 0; i < breakLength; i++) {
      if (this.savedVideos.length > 0) {
        const adSeed = seed * 100 + i;
        const adIndex = Math.floor(this.seededRandom(adSeed) * this.savedVideos.length);
        ads.push(this.savedVideos[adIndex]);
      }
    }
    return ads;
  }

  calculateSlotCommercialBreaks(slotIndex, videoDuration, slotDuration) {
    const breaks = [];
    const remainingTime = slotDuration - videoDuration;

    if (remainingTime < 5000) {
      return breaks;
    }

    // Calculate number of commercial breaks to fill the slot
    // Target: 2-4 breaks dispersed throughout the slot, not all at the end
    const seed = slotIndex * 7919;
    const breakCount = Math.floor(this.seededRandom(seed) * 3) + 2; // 2-4 breaks

    // Each break should have 2-5 ads (not all ads at once)
    const targetAdsPerBreak = Math.floor(this.seededRandom(seed + 1) * 4) + 2;

    // Track all ads selected for this slot to avoid ANY repetition within the slot
    const slotSelectedAdIds = [];

    let totalBreakTime = 0;
    for (let i = 0; i < breakCount; i++) {
      // Pick a small number of ads for this specific break
      const ads = [];
      const thisBreakAdCount = Math.min(targetAdsPerBreak, Math.floor(this.seededRandom(seed + i + 100) * 4) + 2);

      for (let j = 0; j < thisBreakAdCount; j++) {
        if (this.savedVideos.length > 0) {
          const adSeed = seed * 100 + i * 10 + j;
          // Use getNonRepeatingAd to avoid duplicates within slot AND recently played
          const ad = this.getNonRepeatingAd(slotSelectedAdIds, adSeed);
          if (ad) {
            const adId = ad.filename || ad.id;
            slotSelectedAdIds.push(adId);
            ads.push(ad);
          }
        }
      }

      let breakDuration = 0;
      ads.forEach(ad => {
        const adDuration = this.durationCache[ad.filename || ad.id] || 15000;
        breakDuration += adDuration;
      });

      breaks.push({
        index: i,
        ads: ads,
        duration: breakDuration
      });

      totalBreakTime += breakDuration;

      // Don't exceed the remaining time in the slot
      if (totalBreakTime >= remainingTime) {
        break;
      }
    }

    console.log('📺 Calculated ' + breaks.length + ' commercial breaks for slot ' + slotIndex + ' (' +
                breaks.reduce((sum, b) => sum + b.ads.length, 0) + ' total ads dispersed, no repeats)');

    return breaks;
  }

  isVideoBuffered(videoEl, requiredSeconds = 30) {
    if (!videoEl || !videoEl.buffered || videoEl.buffered.length === 0) {
      return false;
    }
    const bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1);
    const currentTime = videoEl.currentTime || 0;
    return (bufferedEnd - currentTime) >= requiredSeconds;
  }

  preloadAd(video) {
    return new Promise((resolve, reject) => {
      const videoId = video.filename || video.id;
      if (this.preloadedAds.has(videoId)) {
        resolve(this.preloadedAds.get(videoId));
        return;
      }

      const preloadEl = document.createElement('video');
      preloadEl.preload = 'auto';
      preloadEl.src = this.getVideoUrl(video);

      let checkInterval = null;
      let timeout = null;

      const checkFullyLoaded = () => {
        // Only resolve when FULLY loaded (readyState 4 = HAVE_ENOUGH_DATA)
        if (preloadEl.readyState === 4) {
          if (checkInterval) clearInterval(checkInterval);
          if (timeout) clearTimeout(timeout);
          this.preloadedAds.set(videoId, { element: preloadEl, video: video });
          console.log('✓ Ad fully loaded: ' + (video.filename || video.title));
          resolve({ element: preloadEl, video: video });
        }
      };

      preloadEl.addEventListener('canplaythrough', checkFullyLoaded);
      preloadEl.addEventListener('loadeddata', checkFullyLoaded);

      // Check readyState periodically
      checkInterval = setInterval(checkFullyLoaded, 200);

      preloadEl.addEventListener('error', () => {
        if (checkInterval) clearInterval(checkInterval);
        if (timeout) clearTimeout(timeout);
        console.log('⚠ Failed to preload ad: ' + (video.filename || video.title));
        reject(new Error('Failed to preload ad'));
      });

      // 30 second timeout for ad loading
      timeout = setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval);
        console.log('⚠ Ad preload timeout: ' + (video.filename || video.title));
        reject(new Error('Ad preload timeout'));
      }, 30000);

      preloadEl.load();
    });
  }

  async startBackgroundPreloading() {
    if (this.savedVideos.length > 0) {
      const adsToPreload = this.savedVideos.slice(0, 5);
      for (const ad of adsToPreload) {
        try {
          await this.preloadAd(ad);
        } catch (e) {
          console.log('⚠ Failed to preload ad:', ad.filename);
        }
      }
    }
  }

  async playAdWhileWaiting() {
    // Play a fully-loaded ad while waiting for scheduled content to pre-cache
    if (this.savedVideos.length === 0) {
      this.playContinuousStatic();
      return;
    }

    // Get a non-repeating ad
    const video = this.getNonRepeatingAd([], Date.now() + this.fillerIndex);
    if (!video) {
      console.log('⚠ No ads available');
      this.playContinuousStatic();
      return;
    }

    const videoId = video.filename || video.id;
    let adToPlay = null;

    if (this.preloadedAds.has(videoId)) {
      adToPlay = this.preloadedAds.get(videoId);
      console.log('📺 [AD WHILE CACHING]: Using preloaded ad');
    } else {
      // Try to fully load the ad
      console.log('📺 [AD WHILE CACHING]: Loading ad...');
      try {
        adToPlay = await this.preloadAd(video);
      } catch (e) {
        console.log('⚠ Failed to load ad, trying next...');
        this.fillerIndex++;
        // Mark this ad as played so we don't try it again immediately
        this.trackPlayedAd(video);
        // Try next ad (limit retries to prevent infinite loop)
        if (this.fillerIndex < this.savedVideos.length * 2) {
          this.playAdWhileWaiting();
        } else {
          console.log('⚠ All ads failed, giving up on scheduled content');
          this.scheduledPreloadFailed = true;
          this.showStatic(300);
          setTimeout(() => this.skipToNextScheduled(), 500);
        }
        return;
      }
    }

    if (!adToPlay) {
      this.playContinuousStatic();
      return;
    }

    this.currentlyPlayingAd = adToPlay;
    const adVideo = adToPlay.video;
    const displayName = adVideo.filename || adVideo.title || 'Ad';

    console.log('📺 [AD WHILE CACHING]: ' + displayName);

    this.stopContinuousStatic();

    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl) {
      nowPlayingEl.textContent = displayName;
      nowPlayingEl.style.display = 'block';
      nowPlayingEl.style.color = '#00ffff';
    }

    // Set the active video and stop all others to prevent audio overlap
    this.setActiveVideo(this.queueIndex);
    const currentVideoEl = this.videoQueue[this.activeVideoIndex];

     this.videoQueue.forEach((v, i) => {
       if (i === this.activeVideoIndex) {
         v.style.display = 'block';
         v.muted = false; // Ensure active video is unmuted
       } else {
         v.style.display = 'none';
         v.pause();
         v.muted = true;
       }
     });

     // Use the preloaded element's src
     currentVideoEl.src = adToPlay.element.src;
    currentVideoEl.load();

    let hasHandledCompletion = false; // Guard against duplicate handlers

    currentVideoEl.onloadeddata = () => {
      this.safePlay(currentVideoEl, null, () => {
        if (!hasHandledCompletion) {
          hasHandledCompletion = true;
          console.log('❌ Play failed, trying next ad');
          this.fillerIndex++;
          this.queueIndex++;
          this.debouncedTransition(() => this.playAdWhileWaiting());
        }
      });
    };

    currentVideoEl.onended = () => {
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      console.log('✓ Ad completed');
      // Track this ad as played to prevent repetition
      this.trackPlayedAd(video);
      this.fillerIndex++;
      this.queueIndex++;

      // Check if we should give up on scheduled content
      if (this.scheduledPreloadFailed) {
        console.log('⚠ Scheduled content failed to load, skipping to next');
        this.scheduledPreloadFailed = false; // Reset for next attempt
        this.showStatic(300);
        this.debouncedTransition(() => this.skipToNextScheduled());
        return;
      }

      // Check if scheduled video is ready
      if (this.preloadedScheduledVideo &&
          this.preloadedScheduledVideo.index === this.scheduleIndex) {
        console.log('✓ Scheduled content ready, switching from ads');
        this.showStatic(300);
        this.debouncedTransition(() => this.playPreloadedScheduled(this.pendingScheduledSeekTime));
      } else {
        // Play another ad while still waiting
        this.debouncedTransition(() => this.playAdWhileWaiting());
      }
    };

    currentVideoEl.onerror = () => {
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      console.log('❌ Ad playback error, trying next');
      // Track this ad as played to prevent retrying immediately
      this.trackPlayedAd(video);
      this.fillerIndex++;
      this.queueIndex++;
      this.debouncedTransition(() => this.playAdWhileWaiting());
    };
  }

  skipToNextScheduled() {
    // Skip the current scheduled video and try the next one
    console.log('⏭ Skipping to next scheduled video');
    this.scheduleIndex = (this.scheduleIndex + 1) % this.scheduledVideos.length;
    this.preloadedScheduledVideo = null;
    this.isPreloadingScheduled = false;
    this.waitingForScheduledPreload = false;
    this.moveToNextSlot();
  }

  async preloadScheduledVideo(videoIndex, onReady = null) {
    if (this.isPreloadingScheduled) {
      console.log('⚠ Already preloading scheduled video');
      return;
    }

    if (this.scheduledVideos.length === 0) {
      console.log('⚠ No scheduled videos to preload');
      return;
    }

    this.isPreloadingScheduled = true;
    const video = this.scheduledVideos[videoIndex % this.scheduledVideos.length];
    const displayName = video.show + ' - ' + video.episode;

    console.log('📺 Pre-caching scheduled content: ' + displayName + ' (need 30s buffered, will wait as long as needed)');

    return new Promise((resolve, reject) => {
      const preloadEl = document.createElement('video');
      preloadEl.preload = 'auto';
      preloadEl.src = this.getVideoUrl(video);

      let bufferCheckInterval = null;

      const cleanup = () => {
        if (bufferCheckInterval) clearInterval(bufferCheckInterval);
      };

      const checkBuffered = () => {
        if (this.isVideoBuffered(preloadEl, 30)) {
          cleanup();
          const bufferedSeconds = preloadEl.buffered.end(preloadEl.buffered.length - 1);
          console.log('✓ Pre-cached ' + Math.floor(bufferedSeconds) + 's of scheduled content - READY');
          this.preloadedScheduledVideo = {
            element: preloadEl,
            video: video,
            index: videoIndex
          };
          this.isPreloadingScheduled = false;

          // Notify that scheduled video is ready
          if (onReady) {
            onReady();
          }

          resolve(this.preloadedScheduledVideo);
        }
      };

      preloadEl.addEventListener('loadedmetadata', () => {
        const videoId = video.id || video.u;
        if (preloadEl.duration && !isNaN(preloadEl.duration)) {
          this.cacheDuration(videoId, preloadEl.duration * 1000);
        }
      });

      preloadEl.addEventListener('progress', checkBuffered);
      preloadEl.addEventListener('canplaythrough', checkBuffered);

      preloadEl.addEventListener('error', (e) => {
        cleanup();
        console.log('⚠ Failed to pre-cache scheduled content: ' + displayName);
        this.preloadedScheduledVideo = null;
        this.isPreloadingScheduled = false;
        reject(new Error('Failed to preload scheduled video'));
      });

      // No timeout - ads will play continuously until content is ready
      // Check buffer every 500ms
      bufferCheckInterval = setInterval(checkBuffered, 500);

      preloadEl.load();
    });
  }

   calculateSchedulePosition() {
     const now = Date.now();
     const elapsed = now - this.scheduleEpoch;
     let totalDuration = 0;
     let targetIndex = 0;
     let inCommercialBreak = false;
     let breakIndex = 0;
     let seekTime = 0;
     let slotStartTime = 0;
     let slotDuration = this.DEFAULT_SLOT_DURATION;
     let slotBreaks = [];

     const findPosition = (cyclePosition) => {
       totalDuration = 0;
       for (let i = 0; i < this.scheduledVideos.length; i++) {
         const video = this.scheduledVideos[i];
         const videoId = video.id || video.u;
         const videoDuration = this.durationCache[videoId] || 1200000;
         const currentSlotDuration = this.DEFAULT_SLOT_DURATION;

         if (totalDuration + currentSlotDuration > cyclePosition) {
           targetIndex = i;
           slotStartTime = totalDuration;
           slotDuration = currentSlotDuration;
           const positionInSlot = cyclePosition - totalDuration;

           slotBreaks = this.calculateSlotCommercialBreaks(i, videoDuration, currentSlotDuration);

           if (positionInSlot < videoDuration) {
             inCommercialBreak = false;
             seekTime = positionInSlot;
             breakIndex = 0;
           } else {
             inCommercialBreak = true;
             let breakPosition = positionInSlot - videoDuration;
             let accumulatedBreakTime = 0;

             for (let b = 0; b < slotBreaks.length; b++) {
               if (accumulatedBreakTime + slotBreaks[b].duration > breakPosition) {
                 breakIndex = b;
                 seekTime = breakPosition - accumulatedBreakTime;
                 break;
               }
               accumulatedBreakTime += slotBreaks[b].duration;
             }
           }
           return true;
         }

         totalDuration += currentSlotDuration;
       }
      return false;
    };

    if (!findPosition(elapsed)) {
      const cyclePosition = elapsed % totalDuration;
      findPosition(cyclePosition);
    }

    return {
      index: targetIndex,
      inCommercialBreak: inCommercialBreak,
      breakIndex: breakIndex,
      seekTime: seekTime / 1000,
      slotStartTime: slotStartTime,
      slotDuration: slotDuration,
      slotBreaks: slotBreaks
    };
  }

  async startPlayback() {
    console.log('📺 Schwelevision TV station initialized');

    // Start pre-loading ads in background
    this.startBackgroundPreloading();

    if (this.scheduledVideos.length > 0) {
      const syncPos = this.calculateSchedulePosition();
      this.scheduleIndex = syncPos.index;
      this.currentSlotStartTime = syncPos.slotStartTime;
      this.currentSlotDuration = syncPos.slotDuration;
      this.currentSlotBreaks = syncPos.slotBreaks;
      this.currentBreakIndex = syncPos.breakIndex;

      console.log('⏱ Syncing to slot ' + syncPos.index + ' (' +
        Math.floor(syncPos.slotDuration / 60000) + 'min slot, ' +
        Math.floor((Date.now() - this.scheduleEpoch - syncPos.slotStartTime) / 60000) + 'min in)');

      if (this.currentSlotBreaks.length > 0) {
        console.log('📺 Slot has ' + this.currentSlotBreaks.length + ' commercial break(s)');
      }

      if (!syncPos.inCommercialBreak) {
        console.log('📺 Should play scheduled content');
        this.pendingScheduledSeekTime = syncPos.seekTime;
        this.waitingForScheduledPreload = true;

        // Start pre-caching scheduled video
        const onScheduledReady = () => {
          console.log('✓ Scheduled content pre-cached, starting playback');
          if (this.scheduledPreloadTimeout) {
            clearTimeout(this.scheduledPreloadTimeout);
            this.scheduledPreloadTimeout = null;
          }
          if (this.waitingForScheduledPreload) {
            this.waitingForScheduledPreload = false;
            this.stopContinuousStatic();
            this.showStatic(300);
            setTimeout(() => this.playPreloadedScheduled(this.pendingScheduledSeekTime), 500);
          }
        };

        // Set a timeout for giving up on scheduled content (30 seconds)
        this.scheduledPreloadTimeout = setTimeout(() => {
          if (this.waitingForScheduledPreload) {
            console.log('⏱ Scheduled content preload timeout (30s), skipping to next');
            this.waitingForScheduledPreload = false;
            this.scheduledPreloadFailed = true;
          }
        }, 30000);

        this.preloadScheduledVideo(this.scheduleIndex, onScheduledReady).catch(e => {
          console.log('❌ Failed to pre-cache scheduled content:', e.message);
          if (this.scheduledPreloadTimeout) {
            clearTimeout(this.scheduledPreloadTimeout);
            this.scheduledPreloadTimeout = null;
          }
          this.waitingForScheduledPreload = false;
          this.scheduledPreloadFailed = true; // Signal to ad loop that we've given up
          // Don't call playFiller() here - let the ad loop handle the transition
        });

        // While pre-caching, play ads or static
        if (this.savedVideos.length > 0) {
          console.log('📺 Playing ads while pre-caching scheduled content...');
          setTimeout(() => this.playAdWhileWaiting(), 1000);
        } else {
          console.log('📺 No ads available, showing static while pre-caching...');
          this.playContinuousStatic();
        }
      } else {
        console.log('📺 Commercial break ' + (syncPos.breakIndex + 1) + '/' + this.currentSlotBreaks.length + ' in progress');
        this.playCommercialBreak();
      }
    } else if (this.savedVideos.length > 0) {
      console.log('No schedule available, playing filler content only');
      this.playFiller();
    } else {
      console.log('❌ No content available');
      this.playContinuousStatic();
    }
  }

  getVideoUrl(video) {
    if (video.type === 'scheduled' && video.u) {
      return video.u;
    } else if (video.path) {
      return '/public/' + video.path;
    } else if (video.filename) {
      return '/public/saved_videos/' + video.filename;
    }
    return null;
  }

  playNextScheduled(seekTime = 0) {
    if (this.scheduledVideos.length === 0) {
      console.log('No scheduled content, playing filler');
      this.playFiller();
      return;
    }

    const video = this.scheduledVideos[this.scheduleIndex % this.scheduledVideos.length];
    const displayName = video.show + ' - ' + video.episode;

    console.log('📺 [SCHEDULE]: ' + displayName);
    this.playingScheduled = true;

    // Check if we have a pre-cached version of this video
    if (this.preloadedScheduledVideo &&
        this.preloadedScheduledVideo.index === this.scheduleIndex &&
        this.isVideoBuffered(this.preloadedScheduledVideo.element, 30)) {
      console.log('✓ Using pre-cached video (instant playback ready)');
      this.playPreloadedScheduled(seekTime);
    } else {
      // Need to pre-cache this scheduled video first
      if (this.preloadedScheduledVideo) {
        console.log('⚠ Pre-cached video not ready or index mismatch');
      }

      console.log('📺 Pre-caching scheduled content before playback');
      this.pendingScheduledSeekTime = seekTime;
      this.waitingForScheduledPreload = true;

      const onScheduledReady = () => {
        console.log('✓ Scheduled content pre-cached, starting playback');
        if (this.scheduledPreloadTimeout) {
          clearTimeout(this.scheduledPreloadTimeout);
          this.scheduledPreloadTimeout = null;
        }
        if (this.waitingForScheduledPreload) {
          this.waitingForScheduledPreload = false;
          this.stopContinuousStatic();
          this.showStatic(300);
          setTimeout(() => this.playPreloadedScheduled(this.pendingScheduledSeekTime), 500);
        }
      };

      // Set a timeout for giving up on scheduled content (30 seconds)
      this.scheduledPreloadTimeout = setTimeout(() => {
        if (this.waitingForScheduledPreload) {
          console.log('⏱ Scheduled content preload timeout (30s), skipping to next');
          this.waitingForScheduledPreload = false;
          this.scheduledPreloadFailed = true;
        }
      }, 30000);

      this.preloadScheduledVideo(this.scheduleIndex, onScheduledReady).catch(e => {
        console.log('❌ Failed to pre-cache scheduled content:', e.message);
        if (this.scheduledPreloadTimeout) {
          clearTimeout(this.scheduledPreloadTimeout);
          this.scheduledPreloadTimeout = null;
        }
        this.waitingForScheduledPreload = false;
        this.scheduledPreloadFailed = true; // Signal to ad loop that we've given up
        // Don't call onScheduledFailed() here - let the ad loop handle the transition
      });

      // While pre-caching, play ads or static
      if (this.savedVideos.length > 0) {
        console.log('📺 Playing ads while pre-caching...');
        setTimeout(() => this.playAdWhileWaiting(), 500);
      } else {
        console.log('📺 No ads available, showing static while pre-caching...');
        this.playContinuousStatic();
      }
    }
  }

  playPreloadedScheduled(seekTime = 0) {
    const preloaded = this.preloadedScheduledVideo;
    const video = preloaded.video;
    const displayName = video.show + ' - ' + video.episode;
    const preloadedEl = preloaded.element;

    this.showStatic(300);

    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl) {
      nowPlayingEl.textContent = displayName;
      nowPlayingEl.style.display = 'block';
      nowPlayingEl.style.color = '#ffff00';
    }

    // Set the active video and stop all others to prevent audio overlap
    this.setActiveVideo(this.queueIndex);
    const currentVideoEl = this.videoQueue[this.activeVideoIndex];

     // Copy the preloaded element's src to our rotation video element
     currentVideoEl.src = preloadedEl.src;
     currentVideoEl.load();

     this.videoQueue.forEach((v, i) => {
       if (i === this.activeVideoIndex) {
         v.style.display = 'block';
         v.muted = false; // Ensure active video is unmuted
       } else {
         v.style.display = 'none';
         v.pause();
         v.muted = true;
         // Clear src of non-active videos to prevent audio bleed
         if (v.src) {
           v.src = '';
           v.load();
         }
       }
     });

    let hasHandledCompletion = false; // Guard against duplicate handlers

    // Since it's preloaded, it should start playing almost immediately
    currentVideoEl.onloadeddata = () => {
      if (seekTime > 0 && currentVideoEl.duration && seekTime < currentVideoEl.duration) {
        currentVideoEl.currentTime = seekTime;
        console.log('⏩ Seeking to ' + Math.floor(seekTime) + 's');
      }

      this.safePlay(currentVideoEl, null, () => {
        if (!hasHandledCompletion) {
          hasHandledCompletion = true;
          console.log('❌ Play failed, switching content');
          this.onScheduledFailed();
        }
      });
    };

    currentVideoEl.onended = () => {
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      console.log('✓ Completed: ' + displayName);
      this.onScheduledComplete();
    };

    currentVideoEl.onerror = () => {
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      const errorType = currentVideoEl.error ? currentVideoEl.error.code : 'unknown';
      console.log('❌ Video error (' + errorType + '): ' + displayName);
      this.onScheduledFailed();
    };

    // Clear the preloaded video after using it
    this.preloadedScheduledVideo = null;

    // Clean up the preload element
    setTimeout(() => {
      preloadedEl.src = '';
      preloadedEl.load();
    }, 1000);
  }

  playCommercialBreak() {
    if (this.currentBreakIndex >= this.currentSlotBreaks.length) {
      console.log('✓ All commercial breaks completed, moving to next slot');
      this.moveToNextSlot();
      return;
    }

    if (this.savedVideos.length === 0) {
      console.log('No ads available, moving to next slot');
      this.moveToNextSlot();
      return;
    }

    this.inCommercialBreak = true;
    const currentBreak = this.currentSlotBreaks[this.currentBreakIndex];
    this.commercialBreakAds = currentBreak.ads;
    this.commercialBreakIndex = 0;

    console.log('📺 Commercial break ' + (this.currentBreakIndex + 1) + '/' + this.currentSlotBreaks.length + ' (' + this.commercialBreakAds.length + ' ads)');

    // Start pre-caching the next scheduled video during commercial break
    const nextScheduledIndex = this.scheduleIndex;
    this.preloadScheduledVideo(nextScheduledIndex).catch(e => {
      console.log('⚠ Pre-caching failed, will load normally:', e.message);
    });

    this.playNextCommercial();
  }

  async playNextCommercial() {
    if (this.commercialBreakIndex >= this.commercialBreakAds.length) {
      this.onCommercialBreakComplete();
      return;
    }

    const video = this.commercialBreakAds[this.commercialBreakIndex];
    const displayName = video.filename || video.title || 'Commercial';
    const videoId = video.filename || video.id;

    console.log('📺 [AD ' + (this.commercialBreakIndex + 1) + '/' + this.commercialBreakAds.length + ']: ' + displayName);
    this.playingScheduled = false;

    // Check if ad is already preloaded and fully ready
    let adData = null;
    if (this.preloadedAds.has(videoId)) {
      adData = this.preloadedAds.get(videoId);
      console.log('✓ Using fully-loaded ad from cache');
    } else {
      // Load ad fully before playing
      console.log('⏳ Fully loading ad: ' + displayName);
      try {
        adData = await this.preloadAd(video);
      } catch (e) {
        console.log('❌ Failed to load ad, skipping: ' + displayName);
        this.onCommercialComplete();
        return;
      }
    }

    // Play the fully-loaded ad
    this.playFullyLoadedAd(adData, () => this.onCommercialComplete());
  }

  playFullyLoadedAd(adData, onComplete) {
    const video = adData.video;
    const displayName = video.filename || video.title || 'Ad';

    this.showStatic(300);

    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl) {
      nowPlayingEl.textContent = displayName;
      nowPlayingEl.style.display = 'block';
      nowPlayingEl.style.color = '#00ffff';
    }

    // Set the active video and stop all others to prevent audio overlap
    this.setActiveVideo(this.queueIndex);
    const currentVideoEl = this.videoQueue[this.activeVideoIndex];

     this.videoQueue.forEach((v, i) => {
       if (i === this.activeVideoIndex) {
         v.style.display = 'block';
         v.muted = false; // Ensure active video is unmuted
       } else {
         v.style.display = 'none';
         v.pause();
         v.muted = true;
       }
     });

     // Use the preloaded element's src
     currentVideoEl.src = adData.element.src;
     currentVideoEl.load();

    let hasHandledCompletion = false; // Guard against duplicate handlers

    currentVideoEl.onloadeddata = () => {
      this.safePlay(currentVideoEl, null, () => {
        if (!hasHandledCompletion) {
          hasHandledCompletion = true;
          console.log('❌ Play failed');
          onComplete();
        }
      });
    };

    currentVideoEl.onended = () => {
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      console.log('✓ Ad completed: ' + displayName);
      // Track this ad as played to prevent repetition
      this.trackPlayedAd(video);
      onComplete();
    };

    currentVideoEl.onerror = () => {
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      console.log('❌ Ad playback error: ' + displayName);
      // Track this ad as played to prevent retrying immediately
      this.trackPlayedAd(video);
      onComplete();
    };
  }

  async playFiller() {
    if (this.savedVideos.length === 0) {
      console.log('No filler content available, retrying schedule');
      setTimeout(() => this.playNextScheduled(), 2000);
      return;
    }

    // Get a non-repeating filler video
    const video = this.getNonRepeatingAd([], Date.now() + this.fillerIndex);
    if (!video) {
      console.log('⚠ No filler available, retrying schedule');
      setTimeout(() => this.playNextScheduled(), 2000);
      return;
    }

    const displayName = video.filename || video.title || 'Filler';
    const videoId = video.filename || video.id;

    console.log('📺 [FILLER]: ' + displayName);
    this.playingScheduled = false;

    // Check if filler is already preloaded and fully ready
    let fillerData = null;
    if (this.preloadedAds.has(videoId)) {
      fillerData = this.preloadedAds.get(videoId);
      console.log('✓ Using fully-loaded filler from cache');
    } else {
      // Load filler fully before playing
      console.log('⏳ Fully loading filler: ' + displayName);
      try {
        fillerData = await this.preloadAd(video);
      } catch (e) {
        console.log('❌ Failed to load filler, trying next');
        // Track this filler as played to prevent retrying immediately
        this.trackPlayedAd(video);
        this.fillerIndex++;
        this.playFiller();
        return;
      }
    }

    // Play the fully-loaded filler
    this.playFullyLoadedAd(fillerData, () => this.onFillerComplete());
  }

  loadAndPlay(video, displayName, color, seekTime, onComplete, onFailed) {
    // Set the active video and stop all others to prevent audio overlap
    this.setActiveVideo(this.queueIndex);
    const currentVideoEl = this.videoQueue[this.activeVideoIndex];

    this.showStatic(300);

    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl) {
      nowPlayingEl.textContent = displayName;
      nowPlayingEl.style.display = 'block';
      nowPlayingEl.style.color = color;
    }

     this.videoQueue.forEach((v, i) => {
       if (i === this.activeVideoIndex) {
         v.style.display = 'block';
         v.muted = false; // Ensure active video is unmuted
       } else {
         v.style.display = 'none';
         v.pause();
         v.muted = true;
       }
     });

     const videoUrl = this.getVideoUrl(video);
     if (!videoUrl) {
       console.log('❌ No URL for video');
       onFailed();
       return;
     }

     currentVideoEl.src = videoUrl;
     currentVideoEl.load();

    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
    }

    this.loadTimeout = setTimeout(() => {
      console.log('⚠ Load timeout (15s), switching to filler');
      onFailed();
    }, 15000);

    currentVideoEl.onloadedmetadata = () => {
      const videoId = video.id || video.u;
      if (currentVideoEl.duration && !isNaN(currentVideoEl.duration)) {
        this.cacheDuration(videoId, currentVideoEl.duration * 1000);
      }
    };

    let hasHandledCompletion = false; // Guard against duplicate handlers

    currentVideoEl.onloadeddata = () => {
      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
        this.loadTimeout = null;
      }

      if (seekTime > 0 && currentVideoEl.duration && seekTime < currentVideoEl.duration) {
        currentVideoEl.currentTime = seekTime;
        console.log('⏩ Seeking to ' + Math.floor(seekTime) + 's');
      }

      this.safePlay(currentVideoEl, null, () => {
        if (!hasHandledCompletion) {
          hasHandledCompletion = true;
          console.log('❌ Play failed, switching content');
          onFailed();
        }
      });
    };

    currentVideoEl.onended = () => {
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
        this.loadTimeout = null;
      }
      console.log('✓ Completed: ' + displayName);
      onComplete();
    };

    currentVideoEl.onerror = () => {
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
        this.loadTimeout = null;
      }
      const errorType = currentVideoEl.error ? currentVideoEl.error.code : 'unknown';
      console.log('❌ Video error (' + errorType + '): ' + displayName);
      onFailed();
    };
  }

  getRemainingSlotTime() {
    const now = Date.now();
    const elapsed = now - this.scheduleEpoch;
    const slotElapsed = elapsed - this.currentSlotStartTime;
    const remaining = this.currentSlotDuration - slotElapsed;
    return Math.max(0, remaining);
  }

  moveToNextSlot() {
    console.log('✓ Moving to next slot');
    this.scheduleIndex = (this.scheduleIndex + 1) % this.scheduledVideos.length;
    this.currentSlotStartTime += this.currentSlotDuration;
    this.currentSlotDuration = this.DEFAULT_SLOT_DURATION;
    this.scheduledVideoEnded = false;
    this.inCommercialBreak = false; // Reset commercial break state

    const video = this.scheduledVideos[this.scheduleIndex];
    const videoId = video.id || video.u;
    const videoDuration = this.durationCache[videoId] || 0;
    this.currentSlotBreaks = this.calculateSlotCommercialBreaks(this.scheduleIndex, videoDuration, this.currentSlotDuration);
    this.currentBreakIndex = 0;

    // Clear any previously preloaded video since we're moving to a new slot
    this.preloadedScheduledVideo = null;
    this.isPreloadingScheduled = false; // Reset preloading state

    this.queueIndex++;
    this.showStatic(300);
    this.debouncedTransition(() => this.playNextScheduled());
  }

  onScheduledComplete() {
    console.log('✓ Scheduled content completed');
    this.scheduledVideoEnded = true;

    if (this.currentSlotBreaks.length > 0) {
      this.currentBreakIndex = 0;
      this.inCommercialBreak = true; // Set flag before playing commercial break
      this.queueIndex++;
      this.showStatic(300);
      this.debouncedTransition(() => this.playCommercialBreak());
    } else {
      this.moveToNextSlot();
    }
  }

  onScheduledFailed() {
    console.log('❌ Scheduled content failed');
    this.queueIndex++;
    this.showStatic(500);
    this.debouncedTransition(() => this.playFiller());
  }

  onFillerComplete() {
    this.fillerIndex = (this.fillerIndex + 1) % this.savedVideos.length;
    this.queueIndex++;
    this.showStatic(300);
    this.debouncedTransition(() => this.playNextScheduled());
  }

  onCommercialComplete() {
    console.log('✓ Ad completed');
    this.commercialBreakIndex++;
    this.queueIndex++;
    this.showStatic(300);
    this.debouncedTransition(() => this.playNextCommercial());
  }

  onCommercialBreakComplete() {
    // Guard against duplicate calls
    if (!this.inCommercialBreak) {
      console.log('⚠ Commercial break already completed, ignoring duplicate call');
      return;
    }

    this.inCommercialBreak = false;
    const completedBreak = this.currentBreakIndex + 1;
    const totalBreaks = this.currentSlotBreaks.length;
    console.log('✓ Commercial break ' + completedBreak + '/' + totalBreaks + ' completed');

    // Increment break index AFTER logging
    this.currentBreakIndex++;

    // If scheduled content hasn't played yet (synced into commercial break),
    // play the scheduled content instead of continuing to next break
    if (!this.scheduledVideoEnded && this.preloadedScheduledVideo) {
      console.log('📺 Scheduled content ready, switching from commercial break');
      this.queueIndex++;
      this.showStatic(300);
      this.debouncedTransition(() => this.playPreloadedScheduled(0));
    } else if (this.currentBreakIndex < this.currentSlotBreaks.length) {
      console.log('📺 Next commercial break in slot (' + (this.currentBreakIndex + 1) + '/' + totalBreaks + ')');
      this.queueIndex++;
      this.showStatic(300);
      this.debouncedTransition(() => this.playCommercialBreak());
    } else {
      // All breaks completed, move to next slot
      console.log('✓ All ' + totalBreaks + ' commercial breaks completed, moving to next slot');
      this.moveToNextSlot();
    }
  }

   setAnalytics(analytics) {
    this.analytics = analytics;
  }

  setupAnalyticsTracking() {
    if (!this.analytics) return;

    this.videoQueue.forEach((video, index) => {
      if (!video) return;

      let lastReportedTime = 0;
      let lastSeekTime = 0;
      let isBuffering = false;

      video.addEventListener('play', () => {
        if (this.currentVideoMetadata && this.analytics && this.videoStartTime > 0) {
          const startTime = Date.now() - this.videoStartTime;
          if (startTime > 1000) {
            this.analytics.trackVideoStart(
              this.currentVideoMetadata.id,
              this.currentVideoMetadata.title,
              this.currentVideoMetadata.type
            );
          }
        }
      });

      video.addEventListener('pause', () => {
        if (this.analytics && this.currentVideoMetadata && this.videoStartTime > 0) {
          const watchTime = (Date.now() - this.videoStartTime) / 1000;
          this.analytics.trackVideoProgress(video);
        }
      });

      video.addEventListener('timeupdate', () => {
        if (!this.analytics || !this.currentVideoMetadata || !this.videoStartTime) return;

        const now = Date.now();
        if (now - lastReportedTime > 5000) {
          this.analytics.trackVideoProgress(video);
          lastReportedTime = now;
        }

        const currentTime = video.currentTime;
        if (Math.abs(currentTime - lastSeekTime) > 5) {
          this.analytics.trackSeek(lastSeekTime, currentTime);
          lastSeekTime = currentTime;
        }
      });

      video.addEventListener('seeking', () => {
        lastSeekTime = video.currentTime;
      });

      video.addEventListener('ended', () => {
        if (this.analytics && this.currentVideoMetadata && this.videoStartTime > 0) {
          const watchTime = (Date.now() - this.videoStartTime) / 1000;
          this.analytics.trackVideoComplete(
            this.currentVideoMetadata.id,
            this.currentVideoMetadata.title,
            watchTime
          );
        }
      });

      video.addEventListener('error', () => {
        if (this.analytics && this.currentVideoMetadata) {
          const errorCode = video.error ? video.error.code : 'unknown';
          const errorMessage = video.error ? video.error.message : 'Unknown error';
          this.analytics.trackError('video_error_' + errorCode, this.currentVideoMetadata.id, errorMessage);
        }
      });

      video.addEventListener('waiting', () => {
        if (!isBuffering && this.analytics) {
          isBuffering = true;
          this.analytics.addEvent('buffer_start', { videoId: this.currentVideoMetadata ? this.currentVideoMetadata.id : 'unknown' });
        }
      });

      video.addEventListener('playing', () => {
        if (isBuffering && this.analytics) {
          isBuffering = false;
          this.analytics.addEvent('buffer_end', { videoId: this.currentVideoMetadata ? this.currentVideoMetadata.id : 'unknown' });
        }
      });

      video.addEventListener('loadstart', () => {
        if (this.analytics) {
          this.videoStartTime = Date.now();
          this.analytics.trackNetworkEvent('load_start', { videoId: this.currentVideoMetadata ? this.currentVideoMetadata.id : 'unknown' });
        }
      });

      video.addEventListener('loadedmetadata', () => {
        if (this.currentVideoMetadata && this.analytics) {
          this.analytics.trackNetworkEvent('metadata_loaded', { 
            videoId: this.currentVideoMetadata.id,
            duration: video.duration
          });
        }
      });
    });
  }
}
