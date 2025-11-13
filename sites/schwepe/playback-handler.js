export class PlaybackHandler {
  constructor(tv) {
    this.tv = tv;
    this.currentVideoEl = document.getElementById('currentVideo');
    this.nextVideoEl = document.getElementById('nextVideo');
    this.thirdVideoEl = document.getElementById('thirdVideo');
    this.staticEl = document.getElementById('static');
    this.savedVideos = [];
    this.scheduledVideos = [];
    this.allVideos = [];
    this.currentIndex = 0;
    this.videoQueue = [this.currentVideoEl, this.nextVideoEl, this.thirdVideoEl];
    this.queueIndex = 0;
    this.currentTimeout = null;
    this.loadTimeout = null;
    this.showingStatic = false;
    this.staticCanvas = document.getElementById('noiseCanvas');
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

      // Use scheduled content as primary, saved videos only if no schedule
      if (this.scheduledVideos.length > 0) {
        this.allVideos = this.scheduledVideos;
        console.log('📺 Using scheduled content:', this.scheduledVideos.length, 'videos');
      } else if (this.savedVideos.length > 0) {
        this.allVideos = this.savedVideos;
        console.log('📺 Using saved videos only');
      } else {
        console.log('❌ No content available, using fallback');
        this.initializeDefault();
      }

      console.log('Total videos in queue:', this.allVideos.length);
    } catch (e) {
      console.log('Video data loading error:', e.message);
      this.initializeDefault();
    }
  }


  initializeDefault() {
    this.savedVideos = [
      { id: 'static_1', title: 'Static', type: 'static', duration: 10000 },
      { id: 'static_2', title: 'Ambient', type: 'filler', duration: 5000 }
    ];
    this.scheduledVideos = [
      { id: 'sched_1', title: 'Scheduled Content 1', type: 'scheduled' },
      { id: 'sched_2', title: 'Scheduled Content 2', type: 'scheduled' }
    ];
    this.allVideos = [...this.savedVideos, ...this.scheduledVideos];
  }

  startPlayback() {
    console.log('📺 Schwelevision playback initialized');
    console.log('Total videos in rotation:', this.allVideos.length);

    if (this.allVideos.length > 0) {
      this.currentIndex = 0;
      console.log('Starting playback at beginning of schedule');
      this.playNextVideo();
      this.preloadNext();
    }
  }

  preloadNext() {
    const nextIndex = (this.currentIndex + 1) % this.allVideos.length;
    const video = this.allVideos[nextIndex];
    const nextVideoEl = this.videoQueue[(this.queueIndex + 1) % 3];

    if (video && nextVideoEl) {
      const videoUrl = this.getVideoUrl(video);
      if (videoUrl) {
        nextVideoEl.src = videoUrl;
        nextVideoEl.load();
      }
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

  playNextVideo() {
    if (this.allVideos.length === 0) {
      console.log('No videos available, showing static');
      this.showStatic(10000);
      return;
    }

    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    // Show brief static during transition
    this.showStatic(300);

    const video = this.allVideos[this.currentIndex % this.allVideos.length];
    const currentVideoEl = this.videoQueue[this.queueIndex % 3];

    const isScheduled = video.type === 'scheduled';

    let displayName = 'Unknown';
    if (isScheduled) {
      displayName = video.show + ' - ' + video.episode;
    } else {
      displayName = video.filename || video.title || 'Unknown';
    }

    console.log('Playing [' + video.type + ']: ' + displayName);

    const nowPlayingEl = document.getElementById('nowPlaying');
    if (nowPlayingEl) {
      nowPlayingEl.textContent = displayName;
      nowPlayingEl.style.display = 'block';
      nowPlayingEl.style.color = isScheduled ? '#ffff00' : '#00ffff';
    }

    this.videoQueue.forEach((v, i) => {
      v.style.display = i === (this.queueIndex % 3) ? 'block' : 'none';
    });

    const videoUrl = this.getVideoUrl(video);
    if (videoUrl) {
      currentVideoEl.src = videoUrl;
      currentVideoEl.load();

      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
      }

      this.loadTimeout = setTimeout(() => {
        console.log('⚠ Video load timeout after 15s, skipping:', displayName);
        this.skipToNext();
      }, 15000);

      currentVideoEl.onloadeddata = () => {
        if (this.loadTimeout) {
          clearTimeout(this.loadTimeout);
          this.loadTimeout = null;
        }
        currentVideoEl.play().catch(e => {
          console.log('⚠ Autoplay blocked, trying muted:', e.message);
          currentVideoEl.muted = true;
          currentVideoEl.play().catch(err => {
            console.log('❌ Play failed even muted, skipping:', err.message);
            this.skipToNext();
          });
        });
      };

      currentVideoEl.onended = () => {
        if (this.loadTimeout) {
          clearTimeout(this.loadTimeout);
          this.loadTimeout = null;
        }
        console.log('✓ Video completed:', displayName);
        this.moveToNext();
      };

      currentVideoEl.onerror = (e) => {
        if (this.loadTimeout) {
          clearTimeout(this.loadTimeout);
          this.loadTimeout = null;
        }
        const errorType = currentVideoEl.error ? currentVideoEl.error.code : 'unknown';
        console.log('❌ Video error (code ' + errorType + '):', displayName, '- skipping');
        this.skipToNext();
      };
    } else {
      console.log('No URL for video, skipping');
      this.skipToNext();
    }
  }

  moveToNext() {
    this.currentIndex = (this.currentIndex + 1) % this.allVideos.length;
    this.queueIndex++;
    this.showStatic(300);
    this.playNextVideo();
    this.preloadNext();
  }

  skipToNext() {
    // Show static when skipping broken videos
    this.showStatic(500);
    this.currentIndex++;
    this.queueIndex++;
    setTimeout(() => this.playNextVideo(), 1000);
  }
}
