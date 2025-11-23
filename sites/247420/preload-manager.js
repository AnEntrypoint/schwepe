export class PreloadManager {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.activePreloads = new Map();
    this.preloadQueue = [];
    this.stats = {
      totalPreloads: 0,
      successfulPreloads: 0,
      failedPreloads: 0,
      avgPreloadTime: 0,
      totalPreloadTime: 0
    };
  }

  async smartPreload(video, getVideoUrl) {
    if (this.activePreloads.size >= this.maxConcurrent) {
      console.log(`⏳ Preload queue full (${this.activePreloads.size}/${this.maxConcurrent})`);
      return this.queuePreload(video, getVideoUrl);
    }

    return this.executePreload(video, getVideoUrl);
  }

  queuePreload(video, getVideoUrl) {
    return new Promise((resolve) => {
      this.preloadQueue.push({
        video: video,
        getVideoUrl: getVideoUrl,
        resolve: resolve
      });
    });
  }

  processQueue() {
    while (this.preloadQueue.length > 0 && this.activePreloads.size < this.maxConcurrent) {
      const item = this.preloadQueue.shift();
      this.executePreload(item.video, item.getVideoUrl).then(item.resolve);
    }
  }

  async executePreload(video, getVideoUrl) {
    const videoId = video.filename || video.id;

    if (this.activePreloads.has(videoId)) {
      return this.activePreloads.get(videoId);
    }

    const preloadPromise = this.performPreload(video, getVideoUrl);
    this.activePreloads.set(videoId, preloadPromise);

    preloadPromise
      .then(() => {
        this.activePreloads.delete(videoId);
        this.processQueue();
      })
      .catch(() => {
        this.activePreloads.delete(videoId);
        this.processQueue();
      });

    return preloadPromise;
  }

  async performPreload(video, getVideoUrl) {
    const startTime = performance.now();
    const videoId = video.filename || video.id;

    return new Promise((resolve, reject) => {
      const videoEl = document.createElement('video');
      videoEl.preload = 'auto';
      const url = getVideoUrl(video);

      if (!url) {
        reject(new Error('No URL for video'));
        return;
      }

      videoEl.src = url;

      let checkInterval = null;
      let timeout = null;
      let resolved = false;

      const cleanup = () => {
        if (checkInterval) clearInterval(checkInterval);
        if (timeout) clearTimeout(timeout);
        resolved = true;
      };

      const checkPreloadProgress = () => {
        if (videoEl.buffered && videoEl.buffered.length > 0) {
          const bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1);
          if (bufferedEnd >= 30) {
            cleanup();
            const loadTime = performance.now() - startTime;
            this.recordPreloadSuccess(loadTime);
            console.log(`✓ Preloaded ${videoId} (${Math.round(loadTime)}ms)`);
            resolve({ element: videoEl, video: video });
          }
        }
      };

      videoEl.addEventListener('canplaythrough', () => {
        if (!resolved) {
          cleanup();
          const loadTime = performance.now() - startTime;
          this.recordPreloadSuccess(loadTime);
          resolve({ element: videoEl, video: video });
        }
      });

      videoEl.addEventListener('error', () => {
        cleanup();
        this.recordPreloadFailure();
        reject(new Error('Failed to preload'));
      });

      checkInterval = setInterval(checkPreloadProgress, 200);

      timeout = setTimeout(() => {
        cleanup();
        this.recordPreloadFailure();
        reject(new Error('Preload timeout'));
      }, 20000);

      videoEl.load();
    });
  }

  recordPreloadSuccess(loadTime) {
    this.stats.totalPreloads++;
    this.stats.successfulPreloads++;
    this.stats.totalPreloadTime += loadTime;
    this.stats.avgPreloadTime = this.stats.totalPreloadTime / this.stats.successfulPreloads;
  }

  recordPreloadFailure() {
    this.stats.totalPreloads++;
    this.stats.failedPreloads++;
  }

  getPreloadStats() {
    const successRate = this.stats.totalPreloads > 0
      ? (this.stats.successfulPreloads / this.stats.totalPreloads * 100).toFixed(1)
      : 0;

    return {
      totalPreloads: this.stats.totalPreloads,
      successfulPreloads: this.stats.successfulPreloads,
      failedPreloads: this.stats.failedPreloads,
      successRate: successRate + '%',
      avgPreloadTime: Math.round(this.stats.avgPreloadTime) + 'ms',
      queueSize: this.preloadQueue.length,
      activePreloads: this.activePreloads.size
    };
  }
}
