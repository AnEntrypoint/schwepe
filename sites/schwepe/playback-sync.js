export class PlaybackSync {
  constructor() {
    this.scheduleEpoch = new Date('2025-11-14T00:00:00Z').getTime();
    this.clockOffset = 0;
    this.DEFAULT_SLOT_DURATION = 1800000;
  }

  getSyncedTime() {
    return Date.now() + this.clockOffset;
  }

  async syncTimeWithServer() {
    try {
      const before = Date.now();
      const response = await fetch('/api/time');
      const after = Date.now();
      const data = await response.json();
      const roundTrip = after - before;
      const serverTime = data.serverTime;
      const estimatedServerTime = serverTime + (roundTrip / 2);
      this.clockOffset = estimatedServerTime - after;
      console.log('🕐 Time sync: offset=' + this.clockOffset + 'ms (RTT=' + roundTrip + 'ms)');
      return true;
    } catch (err) {
      console.log('⚠ Time sync failed, using local time:', err.message);
      this.clockOffset = 0;
      return false;
    }
  }

  calculateSchedulePosition(scheduledVideos, durationCache) {
    const now = this.getSyncedTime();
    const elapsed = now - this.scheduleEpoch;
    let totalDuration = 0;
    let targetIndex = 0;
    let inCommercialBreak = false;
    let breakIndex = 0;
    let seekTime = 0;
    let slotStartTime = 0;
    let slotDuration = this.DEFAULT_SLOT_DURATION;
    let slotBreaks = [];

    const findPosition = (cyclePosition) => {
      totalDuration = 0;
      for (let i = 0; i < scheduledVideos.length; i++) {
        const video = scheduledVideos[i];
        const videoId = video.id || video.u;
        const videoDuration = durationCache[videoId] || 1200000;
        const currentSlotDuration = this.DEFAULT_SLOT_DURATION;

        if (totalDuration + currentSlotDuration > cyclePosition) {
          targetIndex = i;
          slotStartTime = totalDuration;
          slotDuration = currentSlotDuration;
          const positionInSlot = cyclePosition - totalDuration;

          if (positionInSlot < videoDuration) {
            inCommercialBreak = false;
            seekTime = positionInSlot;
            breakIndex = 0;
          } else {
            inCommercialBreak = true;
            let breakPosition = positionInSlot - videoDuration;
            let accumulatedBreakTime = 0;
            for (let b = 0; b < slotBreaks.length; b++) {
              if (accumulatedBreakTime + slotBreaks[b].duration > breakPosition) {
                breakIndex = b;
                seekTime = breakPosition - accumulatedBreakTime;
                break;
              }
              accumulatedBreakTime += slotBreaks[b].duration;
            }
          }
          return true;
        }
        totalDuration += currentSlotDuration;
      }
      return false;
    };

    if (!findPosition(elapsed)) {
      const cyclePosition = elapsed % totalDuration;
      findPosition(cyclePosition);
    }

    return {
      index: targetIndex,
      inCommercialBreak: inCommercialBreak,
      breakIndex: breakIndex,
      seekTime: seekTime / 1000,
      slotStartTime: slotStartTime,
      slotDuration: slotDuration,
      slotBreaks: slotBreaks
    };
  }

  getSlotPosition(slotStartTime, slotDuration) {
    return Math.floor(((this.getSyncedTime() - this.scheduleEpoch - slotStartTime) % slotDuration) / 60000);
  }
}
