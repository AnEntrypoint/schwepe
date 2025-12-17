export class PlaybackBreaks {
  constructor() {
    this.seededRandom = this.seededRandom.bind(this);
  }

  seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  pickCommercialBreak(slotIndex, breakIndex, savedVideos, fillerIndex, durationCache) {
    const seed = slotIndex * 1000 + breakIndex;
    const breakLength = Math.floor(this.seededRandom(seed) * 6) + 1;
    const ads = [];
    let currentFillerIndex = fillerIndex;

    for (let i = 0; i < breakLength; i++) {
      if (savedVideos.length > 0) {
        const adSeed = seed * 100 + i;
        const adIndex = Math.floor(this.seededRandom(adSeed) * savedVideos.length);
        ads.push(savedVideos[adIndex]);
        currentFillerIndex++;
      }
    }
    return ads;
  }

  calculateSlotCommercialBreaks(slotIndex, videoDuration, slotDuration, savedVideos, fillerIndex, durationCache) {
    const breaks = [];
    const remainingTime = slotDuration - videoDuration;

    if (remainingTime < 5000) {
      return breaks;
    }

    const seed = slotIndex * 7919;
    const breakCount = Math.floor(this.seededRandom(seed) * 3) + 1;

    let totalBreakTime = 0;
    for (let i = 0; i < breakCount; i++) {
      const ads = this.pickCommercialBreak(slotIndex, i, savedVideos, fillerIndex, durationCache);
      let breakDuration = 0;
      ads.forEach(ad => {
        const adDuration = durationCache[ad.filename || ad.id] || 15000;
        breakDuration += adDuration;
      });

      breaks.push({
        index: i,
        ads: ads,
        duration: breakDuration
      });

      totalBreakTime += breakDuration;

      if (totalBreakTime >= remainingTime) {
        break;
      }
    }

    return breaks;
  }
}
