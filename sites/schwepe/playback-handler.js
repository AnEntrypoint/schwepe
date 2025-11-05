export class PlaybackHandler {
  constructor(tv) {
    this.tv = tv;
    this.currentVideoEl = document.getElementById('currentVideo');
    this.nextVideoEl = document.getElementById('nextVideo');
    this.thirdVideoEl = document.getElementById('thirdVideo');
    this.savedVideos = [];
    this.scheduledVideos = [];
    this.allVideos = [];
    this.currentIndex = 0;
    this.videoQueue = [this.currentVideoEl, this.nextVideoEl, this.thirdVideoEl];
    this.queueIndex = 0;
  }

  async loadVideos() {
    try {
      const [videoList, { TVScheduler }] = await Promise.all([
        fetch('/public/videos.json').then(r => r.json()),
        import('./tv-scheduler.js').catch(() => ({ TVScheduler: null }))
      ]);

      this.savedVideos = videoList;

      if (TVScheduler) {
        const scheduler = new TVScheduler();
        this.scheduledVideos = await scheduler.getScheduleVideos();
        console.log('Loaded from TV schedule:', { saved: this.savedVideos.length, scheduled: this.scheduledVideos.length });
      } else {
        this.scheduledVideos = [];
        console.log('TV scheduler not available, using saved videos only');
      }

      this.allVideos = this.interleaveVideos(this.savedVideos, this.scheduledVideos);
      console.log('Videos loaded:', { saved: this.savedVideos.length, scheduled: this.scheduledVideos.length, total: this.allVideos.length });
    } catch (e) {
      console.log('Video data loading info:', e.message);
      this.initializeDefault();
    }
  }

  interleaveVideos(saved, scheduled) {
    if (scheduled.length === 0) return saved;
    if (saved.length === 0) return scheduled;

    const result = [];
    const ratio = Math.ceil(saved.length / scheduled.length);

    let savedIdx = 0;
    let schedIdx = 0;

    while (savedIdx < saved.length || schedIdx < scheduled.length) {
      for (let i = 0; i < ratio && savedIdx < saved.length; i++) {
        result.push(saved[savedIdx++]);
      }
      if (schedIdx < scheduled.length) {
        result.push(scheduled[schedIdx++]);
      }
    }

    return result;
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
    console.log('Three-layer playback initialized');
    console.log('Layer 1 (Static): ' + this.savedVideos.filter(v => v.type === 'static').length);
    console.log('Layer 2 (Saved Videos): ' + this.savedVideos.filter(v => v.type === 'filler').length);
    console.log('Layer 3 (Scheduled): ' + this.scheduledVideos.length);

    if (this.allVideos.length > 0) {
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
    if (this.allVideos.length === 0) return;

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

    this.videoQueue.forEach((v, i) => {
      v.style.display = i === (this.queueIndex % 3) ? 'block' : 'none';
    });

    const videoUrl = this.getVideoUrl(video);
    if (videoUrl) {
      currentVideoEl.crossOrigin = 'anonymous';
      currentVideoEl.src = videoUrl;
      currentVideoEl.load();

      currentVideoEl.onloadeddata = () => {
        currentVideoEl.play().catch(e => {
          console.log('Autoplay blocked or error:', e.message);
          currentVideoEl.muted = true;
          currentVideoEl.play().catch(err => {
            console.log('Play failed even muted, skipping:', err.message);
            this.skipToNext();
          });
        });
      };

      currentVideoEl.onended = () => {
        this.currentIndex++;
        this.queueIndex++;
        this.playNextVideo();
        this.preloadNext();
      };

      currentVideoEl.onerror = (e) => {
        console.log('Video load error:', currentVideoEl.error ? currentVideoEl.error.message : 'unknown', 'skipping to next');
        this.skipToNext();
      };
    } else {
      console.log('No URL for video, skipping');
      this.skipToNext();
    }
  }

  skipToNext() {
    this.currentIndex++;
    this.queueIndex++;
    setTimeout(() => this.playNextVideo(), 1000);
  }
}
