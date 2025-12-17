import { PlaybackSync } from './playback-sync.js';
import { PlaybackBreaks } from './playback-breaks.js';
import { PlaybackUtils } from './playback-utils.js';
import { PlaybackLifecycle } from './playback-lifecycle.js';
import { PlaybackRouting } from './playback-routing.js';
import { PlaybackPreload } from './playback-preload.js';

export class PlaybackHandler {
  constructor() {
    this.currentVideoEl = document.getElementById('currentVideo');
    this.nextVideoEl = document.getElementById('nextVideo');
    this.thirdVideoEl = document.getElementById('thirdVideo');
    this.staticEl = document.getElementById('static');
    this.videoQueue = [this.currentVideoEl, this.nextVideoEl, this.thirdVideoEl];
    this.staticCanvas = document.getElementById('noiseCanvas');

    this.sync = new PlaybackSync();
    this.breaks = new PlaybackBreaks();
    this.utils = new PlaybackUtils();
    this.lifecycle = new PlaybackLifecycle();
    this.routing = new PlaybackRouting();
    this.preload = new PlaybackPreload();

    this.savedVideos = [];
    this.scheduledVideos = [];
    this.scheduleIndex = 0;
    this.fillerIndex = 0;
    this.queueIndex = 0;
    this.playingScheduled = false;
    this.showingStatic = false;
    this.scheduleEpoch = new Date('2025-11-14T00:00:00Z').getTime();
    this.clockOffset = 0;
    this.durationCache = this.utils.loadDurationCache();
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
    this.scheduledPreloadTimeout = null;
    this.normalizedVolume = 0.7;
    this.recentlyPlayedAds = [];
    this.maxRecentAds = 20;
    this.analytics = null;
    this.videoStartTime = 0;
    this.currentVideoMetadata = null;
    this.activeVideoIndex = 0;
    this.isTransitioning = false;
    this.transitionDebounceTimeout = null;
    this.userHasInteracted = false;
    this.loadTimeout = null;

    this.initStaticCanvas();
    this.utils.normalizeVideoVolumes(this.videoQueue, this.normalizedVolume);
    this.lifecycle.preventTabPausing(this.videoQueue, this.activeVideoIndex, this.showingStatic);
    this.setupAnalyticsTracking();
    this.lifecycle.setupUserInteractionTracking(() => this.onUserInteraction());
  }

  onUserInteraction() {
    this.userHasInteracted = true;
    console.log('🔊 User interaction detected - audio enabled');
    const activeVideo = this.videoQueue[this.activeVideoIndex];
    if (activeVideo && activeVideo.muted) {
      activeVideo.muted = false;
      activeVideo.volume = this.normalizedVolume;
    }
  }

  getSyncedTime() {
    return Date.now() + this.clockOffset;
  }

  async syncTimeWithServer() {
    try {
      const before = Date.now();
      const response = await fetch('/api/time');
      const after = Date.now();
      const data = await response.json();
      const roundTrip = after - before;
      const serverTime = data.serverTime;
      const estimatedServerTime = serverTime + (roundTrip / 2);
      this.clockOffset = estimatedServerTime - after;
      console.log('🕐 Time sync: offset=' + this.clockOffset + 'ms (RTT=' + roundTrip + 'ms)');
      return true;
    } catch (err) {
      console.log('⚠ Time sync failed, using local time:', err.message);
      this.clockOffset = 0;
      return false;
    }
  }

  async safePlay(videoEl, onSuccess = null, onFailure = null) {
    if (!videoEl) {
      if (onFailure) onFailure();
      return false;
    }
    videoEl.volume = this.normalizedVolume;
    if (!this.userHasInteracted) videoEl.muted = true;
    try {
      await videoEl.play();
      if (this.userHasInteracted && videoEl.muted) videoEl.muted = false;
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

  debouncedTransition(callback, delay = 500) {
    if (this.transitionDebounceTimeout) clearTimeout(this.transitionDebounceTimeout);
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

  setActiveVideo(index) {
    this.activeVideoIndex = index % 3;
    this.videoQueue.forEach((video, idx) => {
      if (video && idx !== this.activeVideoIndex) {
        video.pause();
        video.muted = true;
        if (video.src) {
          video.src = '';
          video.load();
        }
      }
    });
  }

  setVolume(volume) {
    this.normalizedVolume = Math.max(0, Math.min(1, volume));
    this.videoQueue.forEach(video => {
      if (video) {
        video.muted = false;
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
    this.utils.showStatic(this.staticEl, duration);
    this.showingStatic = true;
  }

  playContinuousStatic() {
    console.log('📺 [STATIC]: Playing continuous static (waiting for content)');
    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl) {
      nowPlayingEl.textContent = 'Please Stand By...';
      nowPlayingEl.style.display = 'block';
      nowPlayingEl.style.color = '#888888';
    }
    this.videoQueue.forEach(v => {
      v.style.display = 'none';
      v.pause();
      v.muted = true;
      v.src = '';
      v.load();
    });
    if (this.staticEl) {
      this.staticEl.classList.add('active');
      this.showingStatic = true;
    }
  }

  stopContinuousStatic() {
    if (this.staticEl && this.showingStatic) {
      this.staticEl.classList.remove('active');
      this.showingStatic = false;
    }
  }

  async loadVideos() {
    try {
      await this.syncTimeWithServer();
      const { TVScheduler } = await import('./tv-scheduler.js').catch(() => ({ TVScheduler: null }));
      if (TVScheduler) {
        const scheduler = new TVScheduler();
        this.scheduledVideos = await scheduler.getScheduleVideos();
        console.log('✓ Loaded scheduled content:', this.scheduledVideos.length, 'shows');
      } else {
        this.scheduledVideos = [];
        console.log('⚠ TV scheduler not available');
      }
      try {
        const videoList = await fetch('/public/videos.json').then(r => r.json());
        const videoExtensions = ['.mp4', '.webm', '.ogv', '.mov', '.avi', '.mkv', '.flv'];
        const filteredVideos = videoList.filter(video => {
          const filename = video.filename || '';
          return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
        });
        if (filteredVideos.length > 0) {
          const testVideo = filteredVideos[0];
          const testUrl = '/public/' + (testVideo.path || 'saved_videos/' + testVideo.filename);
          const testResponse = await fetch(testUrl, { method: 'HEAD' }).catch(() => null);
          if (testResponse && testResponse.ok) {
            this.savedVideos = filteredVideos;
            console.log('✓ Loaded saved videos:', this.savedVideos.length, 'video files');
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
    this.savedVideos = [{ id: 'static_1', title: 'Static Filler', type: 'filler', duration: 10000 }];
    this.scheduledVideos = [{ id: 'sched_1', title: 'Scheduled Content 1', type: 'scheduled' }];
  }

  getVideoUrl(video) {
    return this.utils.getVideoUrl(video);
  }

  trackPlayedAd(video) {
    const videoId = video.filename || video.id;
    if (!this.recentlyPlayedAds.includes(videoId)) {
      this.recentlyPlayedAds.push(videoId);
      if (this.recentlyPlayedAds.length > this.maxRecentAds) {
        this.recentlyPlayedAds.shift();
      }
    }
  }

  wasRecentlyPlayed(video) {
    const videoId = video.filename || video.id;
    return this.recentlyPlayedAds.includes(videoId);
  }

  getSynchronizedAd(excludeIds = [], seed = Date.now()) {
    if (this.savedVideos.length === 0) return null;
    const availableAds = this.savedVideos.filter(video => {
      const videoId = video.filename || video.id;
      return !excludeIds.includes(videoId);
    });
    if (availableAds.length === 0) {
      return this.savedVideos[Math.floor(this.breaks.seededRandom(seed) * this.savedVideos.length)];
    }
    const index = Math.floor(this.breaks.seededRandom(seed) * availableAds.length);
    return availableAds[index];
  }

  getNonRepeatingAd(excludeIds = [], seed = Date.now()) {
    if (this.savedVideos.length === 0) return null;
    const availableAds = this.savedVideos.filter(video => {
      const videoId = video.filename || video.id;
      return !this.recentlyPlayedAds.includes(videoId) && !excludeIds.includes(videoId);
    });
    if (availableAds.length === 0) {
      console.log('⚠ All ads recently played, resetting history');
      this.recentlyPlayedAds = [];
      const fallbackAds = this.savedVideos.filter(video => {
        const videoId = video.filename || video.id;
        return !excludeIds.includes(videoId);
      });
      if (fallbackAds.length === 0) {
        return this.savedVideos[Math.floor(this.breaks.seededRandom(seed) * this.savedVideos.length)];
      }
      return fallbackAds[Math.floor(this.breaks.seededRandom(seed) * fallbackAds.length)];
    }
    const index = Math.floor(this.breaks.seededRandom(seed) * availableAds.length);
    return availableAds[index];
  }

  calculateSlotCommercialBreaks(slotIndex, videoDuration, slotDuration) {
    const breaks = [];
    const remainingTime = slotDuration - videoDuration;
    if (remainingTime < 5000) return breaks;
    const seed = slotIndex * 7919;
    const breakCount = Math.floor(this.breaks.seededRandom(seed) * 3) + 2;
    const targetAdsPerBreak = Math.floor(this.breaks.seededRandom(seed + 1) * 4) + 2;
    const slotSelectedAdIds = [];
    let totalBreakTime = 0;
    for (let i = 0; i < breakCount; i++) {
      const ads = [];
      const thisBreakAdCount = Math.min(targetAdsPerBreak, Math.floor(this.breaks.seededRandom(seed + i + 100) * 4) + 2);
      for (let j = 0; j < thisBreakAdCount; j++) {
        if (this.savedVideos.length > 0) {
          const adSeed = seed * 100 + i * 10 + j;
          const ad = this.getSynchronizedAd(slotSelectedAdIds, adSeed);
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
      breaks.push({ index: i, ads: ads, duration: breakDuration });
      totalBreakTime += breakDuration;
      if (totalBreakTime >= remainingTime) break;
    }
    console.log('📺 Calculated ' + breaks.length + ' commercial breaks for slot ' + slotIndex + ' (' + breaks.reduce((sum, b) => sum + b.ads.length, 0) + ' total ads dispersed, no repeats)');
    return breaks;
  }

  calculateSchedulePosition() {
    const now = this.getSyncedTime();
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

    return { index: targetIndex, inCommercialBreak, breakIndex, seekTime: seekTime / 1000, slotStartTime, slotDuration, slotBreaks };
  }

  async startPlayback() {
    console.log('📺 Schwelevision TV station initialized');
    this.preload.startBackgroundPreloading(this);
    if (this.scheduledVideos.length > 0) {
      const syncPos = this.calculateSchedulePosition();
      this.scheduleIndex = syncPos.index;
      this.currentSlotStartTime = syncPos.slotStartTime;
      this.currentSlotDuration = syncPos.slotDuration;
      this.currentSlotBreaks = syncPos.slotBreaks;
      this.currentBreakIndex = syncPos.breakIndex;
      console.log('⏱ Syncing to slot ' + syncPos.index + ' (' + Math.floor(syncPos.slotDuration / 60000) + 'min slot, ' + Math.floor(((this.getSyncedTime() - this.scheduleEpoch - syncPos.slotStartTime) % syncPos.slotDuration) / 60000) + 'min in)');
      if (this.currentSlotBreaks.length > 0) {
        console.log('📺 Slot has ' + this.currentSlotBreaks.length + ' commercial break(s)');
      }
      console.log('📺 Starting playback immediately (no preload wait)');
      this.playNextScheduled(syncPos.seekTime);
    } else if (this.savedVideos.length > 0) {
      console.log('No schedule available, playing filler content only');
      this.playFiller();
    } else {
      console.log('❌ No content available');
      this.playContinuousStatic();
    }
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
    console.log('📺 Loading scheduled content: ' + displayName);

    return new Promise((resolve, reject) => {
      const preloadEl = document.createElement('video');
      preloadEl.preload = 'auto';
      preloadEl.src = this.getVideoUrl(video);
      let bufferCheckInterval = null;
      let hasCompleted = false;
      let hasStartedPlaying = false;

      const cleanup = () => {
        if (bufferCheckInterval) {
          clearInterval(bufferCheckInterval);
          bufferCheckInterval = null;
        }
        preloadEl.removeEventListener('progress', checkBuffer);
        preloadEl.removeEventListener('canplaythrough', checkBuffer);
        preloadEl.removeEventListener('playing', onPlaying);
      };

      const onPlaying = () => {
        hasStartedPlaying = true;
      };

      const checkBuffer = () => {
        if (hasCompleted) return;
        const bufferedSeconds = preloadEl.buffered.length > 0 ? preloadEl.buffered.end(preloadEl.buffered.length - 1) : 0;
        if (bufferedSeconds > 3 && !hasStartedPlaying) {
          hasCompleted = true;
          cleanup();
          console.log('✓ Buffered ' + Math.floor(bufferedSeconds) + 's - starting playback');
          this.preloadedScheduledVideo = { element: preloadEl, video: video, index: videoIndex };
          this.isPreloadingScheduled = false;
          if (onReady) onReady();
          resolve(this.preloadedScheduledVideo);
        }
      };

      preloadEl.addEventListener('loadedmetadata', () => {
        const videoId = video.id || video.u;
        if (preloadEl.duration && !isNaN(preloadEl.duration)) {
          this.utils.cacheDuration(videoId, preloadEl.duration * 1000, this.durationCache);
        }
      });

      preloadEl.addEventListener('progress', checkBuffer);
      preloadEl.addEventListener('canplaythrough', checkBuffer);
      preloadEl.addEventListener('error', (e) => {
        if (hasCompleted) return;
        hasCompleted = true;
        cleanup();
        console.log('⚠ Failed to pre-cache scheduled content: ' + displayName);
        this.preloadedScheduledVideo = null;
        this.isPreloadingScheduled = false;
        reject(new Error('Failed to preload scheduled video'));
      });

      bufferCheckInterval = setInterval(checkBuffer, 500);
      preloadEl.load();
    });
  }

  playPreloadedScheduled(seekTime = 0) {
    const preloaded = this.preloadedScheduledVideo;
    const video = preloaded.video;
    const displayName = video.show + ' - ' + video.episode;
    const preloadedEl = preloaded.element;

    if (this.staticEl) {
      this.staticEl.classList.add('active');
      this.showingStatic = true;
    }

    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl) {
      nowPlayingEl.textContent = displayName;
      nowPlayingEl.style.display = 'block';
      nowPlayingEl.style.color = '#ffff00';
    }

    this.setActiveVideo(this.queueIndex);
    const currentVideoEl = this.videoQueue[this.activeVideoIndex];

    this.videoQueue.forEach((v, i) => {
      if (i === this.activeVideoIndex) {
        v.style.display = 'none';
        v.muted = false;
      } else {
        v.style.display = 'none';
        v.pause();
        v.muted = true;
        if (v.src) {
          v.src = '';
          v.load();
        }
      }
    });

    currentVideoEl.src = preloadedEl.src;
    currentVideoEl.load();

    let hasHandledCompletion = false;
    const loadTimeout = setTimeout(() => {
      if (!hasHandledCompletion) {
        hasHandledCompletion = true;
        console.log('❌ Scheduled video load timeout: ' + displayName);
        this.showStatic(300);
        setTimeout(() => this.onScheduledFailed(), 350);
      }
    }, 300000);

    currentVideoEl.onloadeddata = () => {
      if (seekTime > 0 && currentVideoEl.duration && seekTime < currentVideoEl.duration) {
        currentVideoEl.currentTime = seekTime;
        console.log('⏩ Seeking to ' + Math.floor(seekTime) + 's');
      }

      this.safePlay(currentVideoEl,
        () => {
          clearTimeout(loadTimeout);
          currentVideoEl.style.display = 'block';
          if (this.staticEl) {
            this.staticEl.classList.remove('active');
            this.showingStatic = false;
          }
        },
        () => {
          clearTimeout(loadTimeout);
          if (!hasHandledCompletion) {
            hasHandledCompletion = true;
            console.log('❌ Play failed, switching content');
            this.showStatic(300);
            setTimeout(() => this.onScheduledFailed(), 350);
          }
        }
      );
    };

    currentVideoEl.onended = () => {
      clearTimeout(loadTimeout);
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      console.log('✓ Completed: ' + displayName);
      this.onScheduledComplete();
    };

    currentVideoEl.onerror = () => {
      clearTimeout(loadTimeout);
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      const errorType = currentVideoEl.error ? currentVideoEl.error.code : 'unknown';
      console.log('❌ Video error (' + errorType + '): ' + displayName);
      this.showStatic(300);
      setTimeout(() => this.onScheduledFailed(), 350);
    };

    let stallCheckInterval = null;
    currentVideoEl.onstalling = () => {
      console.log('⏸ Playback stalled, waiting for buffer...');
      currentVideoEl.pause();
      if (stallCheckInterval) clearInterval(stallCheckInterval);
      stallCheckInterval = setInterval(() => {
        if (currentVideoEl.buffered.length > 0) {
          const bufferEnd = currentVideoEl.buffered.end(currentVideoEl.buffered.length - 1);
          const targetSeekPos = currentVideoEl.currentTime + 5;
          if (bufferEnd > targetSeekPos && bufferEnd > currentVideoEl.currentTime + 2) {
            console.log('✓ Buffer recovered, resuming with sync adjustment');
            clearInterval(stallCheckInterval);
            const now = Date.now();
            const elapsedSeconds = (now - this.scheduleEpoch) / 1000;
            const slotElapsed = elapsedSeconds - (this.currentSlotStartTime / 1000);
            if (slotElapsed > 0 && slotElapsed < currentVideoEl.duration) {
              currentVideoEl.currentTime = slotElapsed;
              console.log('🔄 Synced to ' + Math.floor(slotElapsed) + 's');
            }
            this.safePlay(currentVideoEl);
          }
        }
      }, 500);
    };

    currentVideoEl.onplaying = () => {
      if (stallCheckInterval) {
        clearInterval(stallCheckInterval);
        stallCheckInterval = null;
      }
    };

    this.preloadedScheduledVideo = null;
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

    let adData = null;
    if (this.preloadedAds.has(videoId)) {
      adData = this.preloadedAds.get(videoId);
      console.log('✓ Using fully-loaded ad from cache');
    } else {
      console.log('⏳ Fully loading ad: ' + displayName);
      try {
        adData = await this.preload.preloadAd(this, video);
      } catch (e) {
        console.log('❌ Failed to load ad, skipping: ' + displayName);
        this.trackPlayedAd(video);
        this.showStatic(300);
        setTimeout(() => this.onCommercialComplete(), 350);
        return;
      }
    }
    this.playFullyLoadedAd(adData, () => this.onCommercialComplete());
  }

  playFullyLoadedAd(adData, onComplete) {
    const video = adData.video;
    const displayName = video.filename || video.title || 'Ad';

    if (this.staticEl) {
      this.staticEl.classList.add('active');
      this.showingStatic = true;
    }

    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl) {
      nowPlayingEl.textContent = displayName;
      nowPlayingEl.style.display = 'block';
      nowPlayingEl.style.color = '#00ffff';
    }

    this.setActiveVideo(this.queueIndex);
    const currentVideoEl = this.videoQueue[this.activeVideoIndex];

    this.videoQueue.forEach((v, i) => {
      if (i === this.activeVideoIndex) {
        v.style.display = 'none';
        v.muted = false;
      } else {
        v.style.display = 'none';
        v.pause();
        v.muted = true;
      }
    });

    currentVideoEl.src = adData.element.src;
    currentVideoEl.load();

    let hasHandledCompletion = false;
    const loadTimeout = setTimeout(() => {
      if (!hasHandledCompletion) {
        hasHandledCompletion = true;
        console.log('❌ Ad load timeout: ' + displayName);
        this.trackPlayedAd(video);
        this.showStatic(300);
        setTimeout(() => onComplete(), 350);
      }
    }, 10000);

    currentVideoEl.onloadeddata = () => {
      this.safePlay(currentVideoEl,
        () => {
          clearTimeout(loadTimeout);
          currentVideoEl.style.display = 'block';
          if (this.staticEl) {
            this.staticEl.classList.remove('active');
            this.showingStatic = false;
          }
        },
        () => {
          clearTimeout(loadTimeout);
          if (!hasHandledCompletion) {
            hasHandledCompletion = true;
            console.log('❌ Play failed');
            this.showStatic(300);
            setTimeout(() => onComplete(), 350);
          }
        }
      );
    };

    currentVideoEl.onended = () => {
      clearTimeout(loadTimeout);
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      console.log('✓ Ad completed: ' + displayName);
      this.trackPlayedAd(video);
      onComplete();
    };

    currentVideoEl.onerror = () => {
      clearTimeout(loadTimeout);
      if (hasHandledCompletion) return;
      hasHandledCompletion = true;
      console.log('❌ Ad playback error: ' + displayName);
      this.trackPlayedAd(video);
      this.showStatic(300);
      setTimeout(() => onComplete(), 350);
    };
  }

  async playFiller() {
    if (this.savedVideos.length === 0) {
      console.log('No filler content available, retrying schedule');
      setTimeout(() => this.playNextScheduled(), 2000);
      return;
    }
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

    let fillerData = null;
    if (this.preloadedAds.has(videoId)) {
      fillerData = this.preloadedAds.get(videoId);
      console.log('✓ Using fully-loaded filler from cache');
    } else {
      console.log('⏳ Fully loading filler: ' + displayName);
      try {
        fillerData = await this.preload.preloadAd(this, video);
      } catch (e) {
        console.log('❌ Failed to load filler, trying next');
        this.trackPlayedAd(video);
        this.fillerIndex++;
        this.showStatic(300);
        setTimeout(() => this.playFiller(), 350);
        return;
      }
    }
    this.playFullyLoadedAd(fillerData, () => this.onFillerComplete());
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
    this.loadAndPlay(video, displayName, '#ffff00', seekTime, () => this.onScheduledComplete(), () => this.onScheduledFailed());
  }

  loadAndPlay(video, displayName, color, seekTime, onComplete, onFailed) {
    let timeoutId = null;
    let lastSyncTime = Date.now();
    const SYNC_INTERVAL = 60000;
    const BUFFER_CUSHION = 10;

    const videoEl = document.createElement('video');
    videoEl.crossOrigin = 'anonymous';
    videoEl.style.display = 'none';
    document.body.appendChild(videoEl);

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      videoEl.src = '';
      videoEl.load();
      setTimeout(() => {
        if (videoEl.parentNode) videoEl.parentNode.removeChild(videoEl);
      }, 100);
    };

    timeoutId = setTimeout(() => {
      console.log('⏱ Video load timeout (' + displayName + '), falling back to filler');
      cleanup();
      onFailed();
    }, 15000);

    videoEl.addEventListener('loadedmetadata', () => {
      console.log('✓ Video metadata loaded (' + displayName + '), playing');
      clearTimeout(timeoutId);
      this.currentVideoEl.src = videoEl.src;
      this.currentVideoEl.load();
      const playSeekTime = Math.min(seekTime, this.currentVideoEl.duration - 1);
      this.currentVideoEl.currentTime = playSeekTime;
      this.safePlay(this.currentVideoEl);

      const onTimeUpdate = () => {
        const now = Date.now();
        if (now - lastSyncTime >= SYNC_INTERVAL) {
          lastSyncTime = now;
          const correctSeekPos = ((this.getSyncedTime() - this.scheduleEpoch - this.currentSlotStartTime) % this.currentSlotDuration) / 1000;
          if (correctSeekPos >= 0 && correctSeekPos < this.currentVideoEl.duration) {
            if (this.currentVideoEl.buffered.length > 0) {
              const bufferEnd = this.currentVideoEl.buffered.end(this.currentVideoEl.buffered.length - 1);
              const jumpTarget = correctSeekPos;
              if (bufferEnd > jumpTarget + BUFFER_CUSHION) {
                console.log('🔄 Sync: buffer sufficient, jumping to ' + Math.floor(correctSeekPos) + 's');
                this.currentVideoEl.currentTime = correctSeekPos;
              } else if (bufferEnd > this.currentVideoEl.currentTime + 1) {
                console.log('⏩ Sync: advancing 1s (buffer=' + Math.floor(bufferEnd) + 's, target=' + Math.floor(jumpTarget) + 's)');
                this.currentVideoEl.currentTime += 1;
              }
            }
          }
        }
      };

      this.currentVideoEl.addEventListener('timeupdate', onTimeUpdate);
      this.currentVideoEl.addEventListener('ended', () => {
        this.currentVideoEl.removeEventListener('timeupdate', onTimeUpdate);
        cleanup();
        onComplete();
      }, { once: true });

      this.currentVideoEl.addEventListener('error', () => {
        this.currentVideoEl.removeEventListener('timeupdate', onTimeUpdate);
        console.log('❌ Video playback error (' + displayName + ')');
        cleanup();
        onFailed();
      }, { once: true });
    });

    videoEl.addEventListener('error', () => {
      console.log('❌ Failed to load video source (' + displayName + ')');
      clearTimeout(timeoutId);
      cleanup();
      onFailed();
    }, { once: true });

    videoEl.src = video.u || video.src;
    videoEl.load();
  }

  getRemainingSlotTime() {
    const now = this.getSyncedTime();
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
    this.inCommercialBreak = false;

    const video = this.scheduledVideos[this.scheduleIndex];
    const videoId = video.id || video.u;
    const videoDuration = this.durationCache[videoId] || 1200000;
    this.currentSlotBreaks = this.calculateSlotCommercialBreaks(this.scheduleIndex, videoDuration, this.currentSlotDuration);
    this.currentBreakIndex = 0;

    this.preloadedScheduledVideo = null;
    this.isPreloadingScheduled = false;

    this.queueIndex++;
    this.showStatic(300);
    this.debouncedTransition(() => this.playNextScheduled());
  }

  onScheduledComplete() {
    console.log('✓ Scheduled content completed');
    this.scheduledVideoEnded = true;

    if (this.currentSlotBreaks.length > 0 && this.currentBreakIndex < this.currentSlotBreaks.length - 1) {
      this.currentBreakIndex++;
      this.inCommercialBreak = true;
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
    if (!this.inCommercialBreak) {
      console.log('⚠ Commercial break already completed, ignoring duplicate call');
      return;
    }

    this.inCommercialBreak = false;
    const completedBreak = this.currentBreakIndex + 1;
    const totalBreaks = this.currentSlotBreaks.length;
    console.log('✓ Commercial break ' + completedBreak + '/' + totalBreaks + ' completed');

    this.currentBreakIndex++;

    if (!this.scheduledVideoEnded) {
      if (this.preloadedScheduledVideo) {
        console.log('📺 Scheduled content ready, switching from commercial break');
        this.queueIndex++;
        this.showStatic(300);
        this.debouncedTransition(() => this.playPreloadedScheduled(0));
      } else {
        console.log('📺 Scheduled content not preloaded yet, starting playback (will buffer with ads if needed)');
        this.queueIndex++;
        this.showStatic(300);
        this.debouncedTransition(() => this.playNextScheduled(0));
      }
      return;
    }

    if (this.currentBreakIndex < this.currentSlotBreaks.length) {
      console.log('📺 Next commercial break in slot (' + (this.currentBreakIndex + 1) + '/' + totalBreaks + ')');
      this.queueIndex++;
      this.showStatic(300);
      this.debouncedTransition(() => this.playCommercialBreak());
    } else {
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
            this.analytics.trackVideoStart(this.currentVideoMetadata.id, this.currentVideoMetadata.title, this.currentVideoMetadata.type);
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
          this.analytics.trackVideoComplete(this.currentVideoMetadata.id, this.currentVideoMetadata.title, watchTime);
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
          this.analytics.trackNetworkEvent('metadata_loaded', { videoId: this.currentVideoMetadata.id, duration: video.duration });
        }
      });
    });
  }
}
