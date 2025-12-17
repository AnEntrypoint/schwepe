export class PlaybackUtils {
  loadDurationCache() {
    try {
      const cached = localStorage.getItem('schwepe_durations');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  }

  saveDurationCache(cache) {
    try {
      localStorage.setItem('schwepe_durations', JSON.stringify(cache));
    } catch (e) {
      console.log('⚠ Failed to save duration cache');
    }
  }

  cacheDuration(videoId, duration, durationCache) {
    durationCache[videoId] = duration;
    this.saveDurationCache(durationCache);
  }

  normalizeVideoVolumes(videoQueue, normalizedVolume = 0.7) {
    videoQueue.forEach(video => {
      if (video) video.volume = normalizedVolume;
    });
  }

  isVideoBuffered(videoEl, requiredSeconds = 30) {
    if (!videoEl || !videoEl.buffered || videoEl.buffered.length === 0) {
      return false;
    }
    const bufferedSeconds = videoEl.buffered.end(videoEl.buffered.length - 1);
    return bufferedSeconds >= requiredSeconds;
  }

  getVideoUrl(video) {
    if (video.type === 'scheduled' && video.u) {
      return video.u;
    }
    if (video.filename) {
      return '/public/saved_videos/' + video.filename;
    }
    return video.u || video.filename;
  }

  showStatic(staticEl, duration = 300) {
    if (staticEl) {
      staticEl.classList.add('active');
      if (duration > 0) {
        setTimeout(() => {
          staticEl.classList.remove('active');
        }, duration);
      }
    }
  }

  stopContinuousStatic(interval) {
    if (interval) {
      clearInterval(interval);
      return null;
    }
  }

  playContinuousStatic(staticEl, duration = Infinity) {
    this.showStatic(staticEl, 0);
    return setInterval(() => {
      if (staticEl.classList.contains('active')) {
        staticEl.classList.remove('active');
      } else {
        staticEl.classList.add('active');
      }
    }, 100);
  }
}
