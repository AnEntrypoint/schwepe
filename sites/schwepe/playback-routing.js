export class PlaybackRouting {
  playNextScheduled(handler, seekTime = 0) {
    if (!handler.scheduledVideos.length) {
      console.log('❌ No scheduled content');
      return;
    }

    const video = handler.scheduledVideos[handler.scheduleIndex % handler.scheduledVideos.length];
    const displayName = video.show + ' - ' + video.episode;
    console.log('📺 [SCHEDULE]: ' + displayName);
    handler.playingScheduled = true;
    handler.loadAndPlay(video, displayName, '#ffff00', seekTime,
      () => handler.onScheduledComplete(),
      () => handler.onScheduledFailed());
  }

  playCommercialBreak(handler) {
    if (handler.currentBreakIndex >= handler.currentSlotBreaks.length) {
      console.log('✓ All commercial breaks completed, moving to next slot');
      handler.moveToNextSlot();
      return;
    }

    if (!handler.savedVideos.length) {
      console.log('No ads available, moving to next slot');
      handler.moveToNextSlot();
      return;
    }

    handler.inCommercialBreak = true;
    const currentBreak = handler.currentSlotBreaks[handler.currentBreakIndex];
    handler.commercialBreakAds = currentBreak.ads;
    handler.commercialBreakIndex = 0;

    console.log('📺 Commercial break ' + (handler.currentBreakIndex + 1) + '/' + handler.currentSlotBreaks.length + ' (' + handler.commercialBreakAds.length + ' ads)');
    this.playNextCommercial(handler);
  }

  playNextCommercial(handler) {
    if (handler.commercialBreakIndex >= handler.commercialBreakAds.length) {
      handler.onCommercialBreakComplete();
      return;
    }

    const video = handler.commercialBreakAds[handler.commercialBreakIndex];
    const displayName = video.filename || video.title || 'Commercial';
    console.log('📺 [AD ' + (handler.commercialBreakIndex + 1) + '/' + handler.commercialBreakAds.length + ']: ' + displayName);
    handler.playingScheduled = false;
    handler.loadAndPlay(video, displayName, '#00ffff', 0,
      () => handler.onCommercialComplete(),
      () => handler.onCommercialComplete());
  }

  playFiller(handler) {
    if (!handler.savedVideos.length) {
      console.log('No filler content available, retrying schedule');
      setTimeout(() => this.playNextScheduled(handler), 2000);
      return;
    }

    const video = handler.savedVideos[handler.fillerIndex % handler.savedVideos.length];
    const displayName = video.filename || video.title || 'Filler';
    console.log('📺 [FILLER]: ' + displayName);
    handler.playingScheduled = false;
    handler.loadAndPlay(video, displayName, '#00ffff', 0,
      () => handler.onFillerComplete(),
      () => handler.onFillerComplete());
  }
}
