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
      const [saved, scheduled] = await Promise.all([
        fetch('saved_videos.json').then(r => r.json()),
        fetch('scheduled_videos.json').then(r => r.json())
      ]);
      this.savedVideos = saved;
      this.scheduledVideos = scheduled;
      this.allVideos = [...this.savedVideos, ...this.scheduledVideos];
      console.log('Videos loaded:', { saved: saved.length, scheduled: scheduled.length, total: this.allVideos.length });
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
    let bgColor = '#00ff00';

    if (video.type === 'static') {
      bgColor = '#00ff00';
    } else if (video.type === 'filler') {
      bgColor = '#00ffff';
    } else if (video.type === 'scheduled') {
      bgColor = '#ffff00';
    }

    if (this.currentVideoEl) {
      this.currentVideoEl.textContent = 'Now: ' + video.title + ' (' + video.type + ')';
      this.currentVideoEl.style.display = 'block';
      this.currentVideoEl.style.backgroundColor = bgColor;
      this.currentVideoEl.style.color = '#000';
      this.currentVideoEl.style.padding = '20px';
      this.currentVideoEl.style.textAlign = 'center';
      this.currentVideoEl.style.fontSize = '18px';
    }

    console.log('Playing: ' + video.title + ' (' + video.type + ')');

    const duration = video.duration || 5000;
    this.currentIndex++;

    setTimeout(() => {
      this.playNextVideo();
    }, duration);
  }
}
