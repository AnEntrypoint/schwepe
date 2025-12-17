export class PlaybackLifecycle {
  preventTabPausing(videoQueue, activeVideoIndex, showingStatic) {
    document.addEventListener('visibilitychange', () => {
      const activeVideo = videoQueue[activeVideoIndex];
      if (activeVideo && activeVideo.paused && !showingStatic) {
        console.log('📺 Tab became hidden, resuming active video to maintain schedule');
        activeVideo.play().catch(() => {});
      }
    });

    videoQueue.forEach((video, index) => {
      if (video) {
        video.addEventListener('pause', (e) => {
          if (index === activeVideoIndex && !showingStatic && !e.target._intentionalPause) {
            video.play().catch(() => {});
          }
        });
      }
    });
  }

  setupUserInteractionTracking(callback) {
    const onInteraction = () => {
      callback();
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('keypress', onInteraction);
    };
    document.addEventListener('click', onInteraction);
    document.addEventListener('keypress', onInteraction);
  }

  setupAnalyticsTracking(videoStartTime, setVideoStartTime) {
    return setInterval(() => {
      if (typeof window !== 'undefined' && window.__DEBUG) {
        window.__DEBUG.lastPlaybackState = {
          timestamp: Date.now(),
          videoTime: videoStartTime
        };
      }
    }, 5000);
  }
}
