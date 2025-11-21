export class PlaybackHandler {
  constructor() {
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
    this.normalizedVolume = 0.7; // Normalized volume level for all videos
    this.initStaticCanvas();
    this.normalizeVideoVolumes();
  }

  normalizeVideoVolumes() {
    // Set normalized volume on all video elements
    this.videoQueue.forEach(video => {
      if (video) {
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

    // Hide all videos
    this.videoQueue.forEach(v => {
      v.style.display = 'none';
      v.pause();
      v.src = '';
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

    const seed = slotIndex * 7919;
    const breakCount = Math.floor(this.seededRandom(seed) * 3) + 1;

    let totalBreakTime = 0;
    for (let i = 0; i < breakCount; i++) {
      const ads = this.pickCommercialBreak(slotIndex, i);
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

      if (totalBreakTime >= remainingTime) {
        break;
      }
    }

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

    // Try to get a pre-loaded ad
    let adToPlay = null;
    const videoId = this.savedVideos[this.fillerIndex % this.savedVideos.length].filename ||
                     this.savedVideos[this.fillerIndex % this.savedVideos.length].id;

    if (this.preloadedAds.has(videoId)) {
      adToPlay = this.preloadedAds.get(videoId);
      console.log('📺 [AD WHILE CACHING]: Using preloaded ad');
    } else {
      // Try to fully load the next ad
      console.log('📺 [AD WHILE CACHING]: Loading ad...');
      try {
        adToPlay = await this.preloadAd(this.savedVideos[this.fillerIndex % this.savedVideos.length]);
      } catch (e) {
        console.log('⚠ Failed to load ad, trying next...');
        this.fillerIndex++;
        // Try next ad
        if (this.fillerIndex < this.savedVideos.length) {
          this.playAdWhileWaiting();
        } else {
          this.playContinuousStatic();
        }
        return;
      }
    }

    if (!adToPlay) {
      this.playContinuousStatic();
      return;
    }

    this.currentlyPlayingAd = adToPlay;
    const video = adToPlay.video;
    const displayName = video.filename || video.title || 'Ad';

    console.log('📺 [AD WHILE CACHING]: ' + displayName);

    this.stopContinuousStatic();

    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl) {
      nowPlayingEl.textContent = displayName;
      nowPlayingEl.style.display = 'block';
      nowPlayingEl.style.color = '#00ffff';
    }

    const currentVideoEl = this.videoQueue[this.queueIndex % 3];

    this.videoQueue.forEach((v, i) => {
      v.style.display = i === (this.queueIndex % 3) ? 'block' : 'none';
    });

    // Use the preloaded element's src
    currentVideoEl.src = adToPlay.element.src;
    currentVideoEl.load();

    currentVideoEl.onloadeddata = () => {
      // Normalize volume before playing
      currentVideoEl.volume = this.normalizedVolume;

      currentVideoEl.play().catch(e => {
        console.log('⚠ Autoplay blocked, trying muted');
        currentVideoEl.muted = true;
        currentVideoEl.play().catch(() => {
          console.log('❌ Play failed, trying next ad');
          this.fillerIndex++;
          this.queueIndex++;
          this.playAdWhileWaiting();
        });
      });
    };

    currentVideoEl.onended = () => {
      console.log('✓ Ad completed');
      this.fillerIndex++;
      this.queueIndex++;

      // Check if scheduled video is ready
      if (this.preloadedScheduledVideo &&
          this.preloadedScheduledVideo.index === this.scheduleIndex) {
        console.log('✓ Scheduled content ready, switching from ads');
        this.showStatic(300);
        setTimeout(() => this.playPreloadedScheduled(this.pendingScheduledSeekTime), 500);
      } else {
        // Play another ad while still waiting
        this.playAdWhileWaiting();
      }
    };

    currentVideoEl.onerror = () => {
      console.log('❌ Ad playback error, trying next');
      this.fillerIndex++;
      this.queueIndex++;
      this.playAdWhileWaiting();
    };
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
        const videoDuration = this.durationCache[videoId] || 0;
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
          if (this.waitingForScheduledPreload) {
            this.waitingForScheduledPreload = false;
            this.stopContinuousStatic();
            this.showStatic(300);
            setTimeout(() => this.playPreloadedScheduled(this.pendingScheduledSeekTime), 500);
          }
        };

        this.preloadScheduledVideo(this.scheduleIndex, onScheduledReady).catch(e => {
          console.log('❌ Failed to pre-cache scheduled content:', e.message);
          this.waitingForScheduledPreload = false;
          this.playFiller();
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
        if (this.waitingForScheduledPreload) {
          this.waitingForScheduledPreload = false;
          this.stopContinuousStatic();
          this.showStatic(300);
          setTimeout(() => this.playPreloadedScheduled(this.pendingScheduledSeekTime), 500);
        }
      };

      this.preloadScheduledVideo(this.scheduleIndex, onScheduledReady).catch(e => {
        console.log('❌ Failed to pre-cache scheduled content:', e.message);
        this.waitingForScheduledPreload = false;
        this.onScheduledFailed();
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

    const currentVideoEl = this.videoQueue[this.queueIndex % 3];

    // Copy the preloaded element's src to our rotation video element
    currentVideoEl.src = preloadedEl.src;
    currentVideoEl.load();

    this.videoQueue.forEach((v, i) => {
      v.style.display = i === (this.queueIndex % 3) ? 'block' : 'none';
    });

    // Since it's preloaded, it should start playing almost immediately
    currentVideoEl.onloadeddata = () => {
      // Normalize volume before playing
      currentVideoEl.volume = this.normalizedVolume;

      if (seekTime > 0 && currentVideoEl.duration && seekTime < currentVideoEl.duration) {
        currentVideoEl.currentTime = seekTime;
        console.log('⏩ Seeking to ' + Math.floor(seekTime) + 's');
      }

      currentVideoEl.play().catch(e => {
        console.log('⚠ Autoplay blocked, trying muted');
        currentVideoEl.muted = true;
        currentVideoEl.play().catch(() => {
          console.log('❌ Play failed, switching content');
          this.onScheduledFailed();
        });
      });
    };

    currentVideoEl.onended = () => {
      console.log('✓ Completed: ' + displayName);
      this.onScheduledComplete();
    };

    currentVideoEl.onerror = () => {
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

    const currentVideoEl = this.videoQueue[this.queueIndex % 3];

    this.videoQueue.forEach((v, i) => {
      v.style.display = i === (this.queueIndex % 3) ? 'block' : 'none';
    });

    // Use the preloaded element's src
    currentVideoEl.src = adData.element.src;
    currentVideoEl.load();

    currentVideoEl.onloadeddata = () => {
      // Normalize volume before playing
      currentVideoEl.volume = this.normalizedVolume;

      currentVideoEl.play().catch(e => {
        console.log('⚠ Autoplay blocked, trying muted');
        currentVideoEl.muted = true;
        currentVideoEl.play().catch(() => {
          console.log('❌ Play failed');
          onComplete();
        });
      });
    };

    currentVideoEl.onended = () => {
      console.log('✓ Ad completed: ' + displayName);
      onComplete();
    };

    currentVideoEl.onerror = () => {
      console.log('❌ Ad playback error: ' + displayName);
      onComplete();
    };
  }

  async playFiller() {
    if (this.savedVideos.length === 0) {
      console.log('No filler content available, retrying schedule');
      setTimeout(() => this.playNextScheduled(), 2000);
      return;
    }

    const video = this.savedVideos[this.fillerIndex % this.savedVideos.length];
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
        this.fillerIndex++;
        this.playFiller();
        return;
      }
    }

    // Play the fully-loaded filler
    this.playFullyLoadedAd(fillerData, () => this.onFillerComplete());
  }

  loadAndPlay(video, displayName, color, seekTime, onComplete, onFailed) {
    const currentVideoEl = this.videoQueue[this.queueIndex % 3];

    this.showStatic(300);

    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl) {
      nowPlayingEl.textContent = displayName;
      nowPlayingEl.style.display = 'block';
      nowPlayingEl.style.color = color;
    }

    this.videoQueue.forEach((v, i) => {
      v.style.display = i === (this.queueIndex % 3) ? 'block' : 'none';
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

    currentVideoEl.onloadeddata = () => {
      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
        this.loadTimeout = null;
      }

      // Normalize volume before playing
      currentVideoEl.volume = this.normalizedVolume;

      if (seekTime > 0 && currentVideoEl.duration && seekTime < currentVideoEl.duration) {
        currentVideoEl.currentTime = seekTime;
        console.log('⏩ Seeking to ' + Math.floor(seekTime) + 's');
      }

      currentVideoEl.play().catch(e => {
        console.log('⚠ Autoplay blocked, trying muted');
        currentVideoEl.muted = true;
        currentVideoEl.play().catch(() => {
          console.log('❌ Play failed, switching content');
          onFailed();
        });
      });
    };

    currentVideoEl.onended = () => {
      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
        this.loadTimeout = null;
      }
      console.log('✓ Completed: ' + displayName);
      onComplete();
    };

    currentVideoEl.onerror = () => {
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

    const video = this.scheduledVideos[this.scheduleIndex];
    const videoId = video.id || video.u;
    const videoDuration = this.durationCache[videoId] || 0;
    this.currentSlotBreaks = this.calculateSlotCommercialBreaks(this.scheduleIndex, videoDuration, this.currentSlotDuration);
    this.currentBreakIndex = 0;

    // Clear any previously preloaded video since we're moving to a new slot
    this.preloadedScheduledVideo = null;

    this.queueIndex++;
    this.showStatic(300);
    setTimeout(() => this.playNextScheduled(), 500);
  }

  onScheduledComplete() {
    console.log('✓ Scheduled content completed');
    this.scheduledVideoEnded = true;

    if (this.currentSlotBreaks.length > 0) {
      this.currentBreakIndex = 0;
      this.queueIndex++;
      this.showStatic(300);
      setTimeout(() => this.playCommercialBreak(), 500);
    } else {
      this.moveToNextSlot();
    }
  }

  onScheduledFailed() {
    console.log('❌ Scheduled content failed');
    this.queueIndex++;
    this.showStatic(500);
    setTimeout(() => this.playFiller(), 500);
  }

  onFillerComplete() {
    this.fillerIndex = (this.fillerIndex + 1) % this.savedVideos.length;
    this.queueIndex++;
    this.showStatic(300);
    setTimeout(() => this.playNextScheduled(), 500);
  }

  onCommercialComplete() {
    console.log('✓ Ad completed');
    this.commercialBreakIndex++;
    this.queueIndex++;
    this.showStatic(300);
    setTimeout(() => this.playNextCommercial(), 500);
  }

  onCommercialBreakComplete() {
    console.log('✓ Commercial break ' + (this.currentBreakIndex + 1) + '/' + this.currentSlotBreaks.length + ' completed');
    this.inCommercialBreak = false;
    this.currentBreakIndex++;

    // If scheduled content hasn't played yet (synced into commercial break),
    // play the scheduled content instead of continuing to next break
    if (!this.scheduledVideoEnded && this.preloadedScheduledVideo) {
      console.log('📺 Scheduled content ready, switching from commercial break');
      this.queueIndex++;
      this.showStatic(300);
      setTimeout(() => this.playPreloadedScheduled(0), 500);
    } else if (this.currentBreakIndex < this.currentSlotBreaks.length) {
      console.log('📺 Next commercial break in slot');
      this.queueIndex++;
      this.showStatic(300);
      setTimeout(() => this.playCommercialBreak(), 500);
    } else {
      this.moveToNextSlot();
    }
  }
}
