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
    this.scheduleEpoch = new Date('2025-11-13T00:00:00Z').getTime();
    this.durationCache = this.loadDurationCache();
    this.initStaticCanvas();
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
        // Verify saved videos directory exists by testing one video
        if (videoList.length > 0) {
          const testVideo = videoList[0];
          const testUrl = '/public/' + (testVideo.path || 'saved_videos/' + testVideo.filename);
          const testResponse = await fetch(testUrl, { method: 'HEAD' }).catch(() => null);
          if (testResponse && testResponse.ok) {
            this.savedVideos = videoList;
            console.log('✓ Loaded saved videos:', this.savedVideos.length, 'files');
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

  calculateSchedulePosition() {
    const now = Date.now();
    const elapsed = now - this.scheduleEpoch;
    let totalDuration = 0;
    let targetIndex = 0;
    let seekTime = 0;

    for (let i = 0; i < this.scheduledVideos.length; i++) {
      const video = this.scheduledVideos[i];
      const videoId = video.id || video.u;
      const cachedDuration = this.durationCache[videoId];

      if (!cachedDuration) {
        console.log('⏱ No duration cached for video ' + i + ', starting from beginning');
        return { index: 0, seekTime: 0 };
      }

      if (totalDuration + cachedDuration > elapsed) {
        targetIndex = i;
        seekTime = elapsed - totalDuration;
        break;
      }

      totalDuration += cachedDuration;
    }

    if (targetIndex === 0 && seekTime === 0 && totalDuration > 0) {
      const cyclePosition = elapsed % totalDuration;
      totalDuration = 0;
      for (let i = 0; i < this.scheduledVideos.length; i++) {
        const video = this.scheduledVideos[i];
        const videoId = video.id || video.u;
        const cachedDuration = this.durationCache[videoId];

        if (totalDuration + cachedDuration > cyclePosition) {
          targetIndex = i;
          seekTime = cyclePosition - totalDuration;
          break;
        }
        totalDuration += cachedDuration;
      }
    }

    return { index: targetIndex, seekTime: seekTime };
  }

  startPlayback() {
    console.log('📺 Schwelevision TV station initialized');
    if (this.scheduledVideos.length > 0) {
      const syncPos = this.calculateSchedulePosition();
      this.scheduleIndex = syncPos.index;
      console.log('⏱ Syncing to schedule position: video ' + syncPos.index + ', offset ' + Math.floor(syncPos.seekTime / 1000) + 's');
      this.playNextScheduled(syncPos.seekTime / 1000);
    } else if (this.savedVideos.length > 0) {
      console.log('No schedule available, playing filler content only');
      this.playFiller();
    } else {
      console.log('❌ No content available');
      this.showStatic(10000);
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
    this.loadAndPlay(video, displayName, '#ffff00', seekTime, () => this.onScheduledComplete(), () => this.onScheduledFailed());
  }

  playFiller() {
    if (this.savedVideos.length === 0) {
      console.log('No filler content available, retrying schedule');
      setTimeout(() => this.playNextScheduled(), 2000);
      return;
    }

    const video = this.savedVideos[this.fillerIndex % this.savedVideos.length];
    const displayName = video.filename || video.title || 'Filler';

    console.log('📺 [AD BREAK]: ' + displayName);
    this.playingScheduled = false;
    this.loadAndPlay(video, displayName, '#00ffff', 0, () => this.onFillerComplete(), () => this.onFillerComplete());
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

  onScheduledComplete() {
    this.scheduleIndex = (this.scheduleIndex + 1) % this.scheduledVideos.length;
    this.queueIndex++;
    this.showStatic(300);
    setTimeout(() => this.playNextScheduled(), 500);
  }

  onScheduledFailed() {
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
}
