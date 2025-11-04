export class PlaybackHandler {
  constructor(tv) {
    this.tv = tv;
    this.currentVideoEl = document.getElementById('currentVideo');
    this.nextVideoEl = document.getElementById('nextVideo');
    this.thirdVideoEl = document.getElementById('thirdVideo');
    this.savedVideos = [];
    this.scheduledVideos = [];
    this.currentIndex = 0;
    this.bufferTarget = 30000;
  }

  async loadVideos() {
    try {
      const [saved, scheduled] = await Promise.all([
        fetch('saved_videos.json').then(r => r.json()),
        fetch('scheduled_videos.json').then(r => r.json())
      ]);
      this.savedVideos = saved;
      this.scheduledVideos = scheduled;
      console.log('Videos loaded:', { saved: saved.length, scheduled: scheduled.length });
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
  }

  startPlayback() {
    console.log('Three-layer playback initialized');
    console.log('Layer 1 (Static): ' + this.savedVideos.filter(v => v.type === 'static').length);
    console.log('Layer 2 (Saved Videos): ' + this.savedVideos.filter(v => v.type === 'filler').length);
    console.log('Layer 3 (Scheduled): ' + this.scheduledVideos.length);
    
    if (this.currentVideoEl) {
      this.currentVideoEl.textContent = 'Schwelevision Broadcasting System Ready\n\nLoaded: ' + this.savedVideos.length + ' saved videos\n' + this.scheduledVideos.length + ' scheduled videos';
      this.currentVideoEl.style.display = 'block';
      this.currentVideoEl.style.backgroundColor = '#000';
      this.currentVideoEl.style.color = '#0f0';
      this.currentVideoEl.style.padding = '20px';
      this.currentVideoEl.style.textAlign = 'center';
    }
  }
}
