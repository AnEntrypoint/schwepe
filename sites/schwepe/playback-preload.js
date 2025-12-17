export class PlaybackPreload {
  async startBackgroundPreloading(handler) {
    if (!handler.savedVideos.length) return;

    console.log('📺 Pre-caching 10 ads for seamless playback');
    const preloadPromises = [];

    for (let i = 0; i < Math.min(10, handler.savedVideos.length); i++) {
      const video = handler.savedVideos[i % handler.savedVideos.length];
      preloadPromises.push(this.preloadAd(handler, video));
    }

    await Promise.allSettled(preloadPromises);
  }

  preloadAd(handler, video) {
    return new Promise((resolve) => {
      const preloadEl = document.createElement('video');
      preloadEl.preload = 'auto';
      preloadEl.src = handler.getVideoUrl(video);

      const onLoadedData = () => {
        console.log('✓ Ad fully loaded: ' + (video.filename || video.title));
        handler.preloadedAds.set(video.filename, preloadEl);
        resolve();
      };

      const timeout = setTimeout(() => {
        preloadEl.removeEventListener('canplaythrough', onLoadedData);
        resolve();
      }, 15000);

      preloadEl.addEventListener('canplaythrough', () => {
        clearTimeout(timeout);
        onLoadedData();
      });

      preloadEl.load();
    });
  }
}
