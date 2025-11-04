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
  }

  async loadVideos() {
    try {
      const videos = await fetch('/public/videos.json').then(r => r.json());
      this.savedVideos = videos.filter((v, idx) => idx % 3 !== 0);
      this.scheduledVideos = videos.filter((v, idx) => idx % 3 === 0);
      this.allVideos = videos;
      console.log('Videos loaded:', { saved: this.savedVideos.length, scheduled: this.scheduledVideos.length, total: videos.length });
    } catch (e) {
      console.log('Video data loading info:', e.message);
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
    console.log('Three-layer playback initialized');
    console.log('Layer 1 (Static): ' + this.savedVideos.filter(v => v.type === 'static').length);
    console.log('Layer 2 (Saved Videos): ' + this.savedVideos.filter(v => v.type === 'filler').length);
    console.log('Layer 3 (Scheduled): ' + this.scheduledVideos.length);

    if (this.allVideos.length > 0) {
      this.playNextVideo();
    }
  }

  playNextVideo() {
    if (this.allVideos.length === 0) return;

    const video = this.allVideos[this.currentIndex % this.allVideos.length];
    const savedIdx = this.currentIndex % this.allVideos.length;
    const isScheduled = savedIdx % 3 === 0;
    const bgColor = isScheduled ? '#ffff00' : '#00ffff';
    const displayName = video.filename || video.title || 'Unknown';

    if (this.currentVideoEl) {
      this.currentVideoEl.textContent = 'Now: ' + displayName;
      this.currentVideoEl.style.display = 'block';
      this.currentVideoEl.style.backgroundColor = bgColor;
      this.currentVideoEl.style.color = '#000';
      this.currentVideoEl.style.padding = '20px';
      this.currentVideoEl.style.textAlign = 'center';
      this.currentVideoEl.style.fontSize = '16px';
      this.currentVideoEl.style.wordBreak = 'break-word';
    }

    console.log('Playing: ' + displayName);

    const duration = 5000;
    this.currentIndex++;

    setTimeout(() => {
      this.playNextVideo();
    }, duration);
  }
}
