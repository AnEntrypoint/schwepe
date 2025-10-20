/**
 * TV Broadcaster - Complete TV Broadcasting System with Ad Breaks
 * Handles scheduled content with deterministic ad placement throughout playback
 *
 * Features:
 * - Background video buffering for large archive.org videos
 * - TV-style ad breaks spread deterministically throughout content
 * - Pause/resume scheduled content during ad breaks
 * - Time-based synchronization across all viewers
 * - Seamless transitions between content and ads
 */

export class TvBroadcaster {
    constructor(options = {}) {
        this.scheduledVideoElement = null;
        this.adVideoElement = null;
        this.currentAdIndex = 0;
        this.adBreaks = [];
        this.isScheduledVideoPlaying = false;
        this.isAdBreakPlaying = false;
        this.scheduledVideoPausedAt = 0;

        // Configuration
        this.adBreakSeed = options.adBreakSeed || 247420;
        this.bufferThreshold = options.bufferThreshold || 20; // seconds

        // Available ads
        this.availableAds = options.availableAds || [];
    }

    /**
     * Calculate deterministic ad break positions for a time slot
     * Spreads ads throughout the slot to fill gaps and provide TV-like experience
     *
     * @param {number} contentDuration - Duration of scheduled content in seconds
     * @param {number} slotDuration - Total slot duration in seconds (default 1800 = 30min)
     * @param {string} slotKey - Unique key for this time slot (e.g. "monday-25")
     * @returns {Array} Ad break positions with timings
     */
    calculateAdBreaks(contentDuration, slotDuration = 1800, slotKey) {
        // Always show ads throughout ALL slots, regardless of content length
        // Ads play by pausing scheduled content at regular intervals

        // Calculate ad break frequency based on slot type
        let adBreakInterval;
        if (slotDuration <= 600) {
            // Short slots (10 min or less): ads every 3-4 minutes
            adBreakInterval = 240; // 4 minutes
        } else if (slotDuration <= 1800) {
            // 30-minute slots: ads every 5-6 minutes
            adBreakInterval = 300; // 5 minutes
        } else if (slotDuration <= 3600) {
            // 1-hour slots: ads every 8-10 minutes
            adBreakInterval = 600; // 10 minutes
        } else {
            // Longer slots: ads every 12-15 minutes
            adBreakInterval = 900; // 15 minutes
        }

        // Calculate how many ad breaks we can fit
        const maxBreaks = Math.floor(slotDuration / adBreakInterval);
        const numBreaks = Math.max(1, maxBreaks);

        // Calculate how much time ads should take (30% of slot time)
        const totalAdTime = slotDuration * 0.3; // 30% ads, 70% content
        const adBreakDuration = totalAdTime / numBreaks;

        // Calculate how much content time remains after ads
        const totalContentTime = slotDuration - totalAdTime;
        const contentSegmentDuration = totalContentTime / (numBreaks + 1);

        const breaks = [];
        for (let i = 0; i < numBreaks; i++) {
            const contentPosition = contentSegmentDuration * (i + 1);
            breaks.push({
                contentPosition, // When to pause content (seconds into video)
                adDuration: adBreakDuration, // How long the ad break lasts
                adIndex: this.getDeterministicAdIndex(slotKey, i),
                breakNumber: i + 1,
                totalBreaks: numBreaks
            });
        }

        return breaks;
    }

    /**
     * Get deterministic ad index based on slot and break number
     */
    getDeterministicAdIndex(slotKey, breakNumber) {
        const combinedKey = `${this.adBreakSeed}-${slotKey}-break${breakNumber}`;
        let hash = 0;

        for (let i = 0; i < combinedKey.length; i++) {
            const char = combinedKey.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return Math.abs(hash) % this.availableAds.length;
    }

    /**
     * Start buffering scheduled video in background while playing ads
     */
    async bufferScheduledVideoInBackground(videoUrl, seekPosition = 0) {
        console.log(`📦 Starting background buffer for scheduled content`);
        console.log(`📹 Video URL to buffer: ${videoUrl}`);

        // Create scheduled video element if needed
        if (!this.scheduledVideoElement) {
            console.log(`⚠️ Creating new scheduledVideoElement (should be set by caller!)`);
            this.scheduledVideoElement = document.createElement('video');
            this.scheduledVideoElement.style.position = 'absolute';
            this.scheduledVideoElement.style.top = '0';
            this.scheduledVideoElement.style.left = '0';
            this.scheduledVideoElement.style.width = '100%';
            this.scheduledVideoElement.style.height = '100%';
            this.scheduledVideoElement.style.objectFit = 'cover';
            this.scheduledVideoElement.style.opacity = '0';
            this.scheduledVideoElement.style.pointerEvents = 'none';
        } else {
            console.log(`✅ Using existing scheduledVideoElement`);
        }

        // Set source
        console.log(`🔗 Setting video source...`);
        this.scheduledVideoElement.src = videoUrl;

        // Wait for metadata
        await new Promise((resolve, reject) => {
            const onLoadedMetadata = () => {
                const duration = this.scheduledVideoElement.duration;
                if (!duration || isNaN(duration) || duration < 1) {
                    reject(new Error(`Invalid video duration: ${duration}s`));
                    return;
                }
                console.log(`✅ Metadata loaded: ${duration.toFixed(2)}s duration`);
                resolve();
            };

            const onError = (e) => {
                reject(new Error(`Failed to load video: ${e.message || 'Unknown error'}`));
            };

            this.scheduledVideoElement.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
            this.scheduledVideoElement.addEventListener('error', onError, { once: true });
        });

        // Seek to position
        const duration = this.scheduledVideoElement.duration;
        const seekTime = Math.max(0, Math.min(seekPosition, duration - 1));
        this.scheduledVideoElement.currentTime = seekTime;
        console.log(`🎯 Seeking to position: ${seekTime.toFixed(2)}s / ${duration.toFixed(2)}s`);

        // Wait for seek to complete
        await new Promise(resolve => {
            this.scheduledVideoElement.addEventListener('seeked', resolve, { once: true });
        });

        // Calculate buffer threshold (60s or entire clip if shorter)
        const remainingDuration = duration - seekTime;
        const bufferThreshold = Math.min(this.bufferThreshold, remainingDuration);
        console.log(`⏳ Buffering ${bufferThreshold.toFixed(1)}s ahead of playhead...`);

        // MUTE and play in background to trigger buffering (already hidden with opacity: 0)
        this.scheduledVideoElement.muted = true;
        this.scheduledVideoElement.volume = 0;
        await this.scheduledVideoElement.play();
        console.log(`▶️ Playing muted in background (hidden) to build buffer at ${seekTime.toFixed(2)}s`);

        // Wait for buffer to build up
        await this.waitForSufficientBuffer(bufferThreshold);

        // Pause now that we have sufficient buffer
        this.scheduledVideoElement.pause();
        console.log(`✅ Buffer ready! Paused at ${this.scheduledVideoElement.currentTime.toFixed(2)}s`);
        return true;
    }

    /**
     * Wait for sufficient buffer ahead of playhead
     * Monitors buffer while video is playing
     */
    async waitForSufficientBuffer(bufferAheadSeconds) {
        return new Promise((resolve) => {
            const checkBuffer = () => {
                if (!this.scheduledVideoElement.buffered || this.scheduledVideoElement.buffered.length === 0) {
                    return false;
                }

                const currentTime = this.scheduledVideoElement.currentTime;

                // Find buffer range containing current playhead position
                for (let i = 0; i < this.scheduledVideoElement.buffered.length; i++) {
                    const start = this.scheduledVideoElement.buffered.start(i);
                    const end = this.scheduledVideoElement.buffered.end(i);

                    if (start <= currentTime && end >= currentTime) {
                        const bufferedAhead = end - currentTime;
                        console.log(`📊 Buffered: ${bufferedAhead.toFixed(1)}s ahead of ${currentTime.toFixed(1)}s (need ${bufferAheadSeconds}s)`);

                        if (bufferedAhead >= bufferAheadSeconds) {
                            return true;
                        }
                    }
                }
                return false;
            };

            const bufferCheckInterval = setInterval(() => {
                if (checkBuffer()) {
                    clearInterval(bufferCheckInterval);
                    resolve();
                }
            }, 500); // Check every 500ms

            // Check immediately
            if (checkBuffer()) {
                clearInterval(bufferCheckInterval);
                resolve();
            }
        });
    }

    /**
     * Play scheduled content with TV-style ad breaks
     * Pauses content during ads, resumes after each break
     */
    async playScheduledContentWithAdBreaks(videoUrl, seekPosition, adBreaks) {
        // Buffer the scheduled video
        await this.bufferScheduledVideoInBackground(videoUrl, seekPosition);

        // Start playing scheduled content
        this.scheduledVideoElement.style.opacity = '1';
        this.scheduledVideoElement.style.pointerEvents = 'auto';
        await this.scheduledVideoElement.play();
        this.isScheduledVideoPlaying = true;
        console.log(`🎬 Playing scheduled content`);

        // Set up ad break listeners
        this.setupAdBreakListeners(adBreaks);
    }

    /**
     * Set up listeners to trigger ad breaks at specific times
     */
    setupAdBreakListeners(adBreaks) {
        if (!this.scheduledVideoElement || adBreaks.length === 0) return;

        let currentBreakIndex = 0;

        const checkAdBreak = () => {
            if (currentBreakIndex >= adBreaks.length) {
                // All ad breaks completed
                this.scheduledVideoElement.removeEventListener('timeupdate', checkAdBreak);
                return;
            }

            const currentTime = this.scheduledVideoElement.currentTime;
            const nextBreak = adBreaks[currentBreakIndex];

            // Trigger ad break when we reach the position
            if (currentTime >= nextBreak.contentPosition - 0.5) {
                console.log(`📺 Ad break ${nextBreak.breakNumber}/${nextBreak.totalBreaks} at ${currentTime.toFixed(1)}s`);

                // Pause scheduled content
                this.scheduledVideoElement.pause();
                this.scheduledVideoPausedAt = currentTime;
                this.isScheduledVideoPlaying = false;

                // Play ad break
                this.playAdBreak(nextBreak).then(() => {
                    // Resume scheduled content after ad
                    this.resumeScheduledContent();
                });

                currentBreakIndex++;
            }
        };

        this.scheduledVideoElement.addEventListener('timeupdate', checkAdBreak);
    }

    /**
     * Play an ad break
     */
    async playAdBreak(adBreak) {
        if (this.availableAds.length === 0) {
            console.warn(`⚠️ No ads available, skipping ad break`);
            return;
        }

        const ad = this.availableAds[adBreak.adIndex];
        console.log(`📺 Playing ad: ${ad.name || ad.url}`);

        // Create ad video element and append to DOM
        if (!this.adVideoElement) {
            this.adVideoElement = document.createElement('video');
            this.adVideoElement.style.position = 'absolute';
            this.adVideoElement.style.top = '0';
            this.adVideoElement.style.left = '0';
            this.adVideoElement.style.width = '100%';
            this.adVideoElement.style.height = '100%';
            this.adVideoElement.style.objectFit = 'cover';

            // Append to same parent as scheduled video
            if (this.scheduledVideoElement && this.scheduledVideoElement.parentNode) {
                this.scheduledVideoElement.parentNode.appendChild(this.adVideoElement);
            }
        }

        // Hide scheduled video completely, show ad
        if (this.scheduledVideoElement) {
            this.scheduledVideoElement.pause();
            this.scheduledVideoElement.style.opacity = '0';
            this.scheduledVideoElement.style.pointerEvents = 'none';
            this.scheduledVideoElement.style.visibility = 'hidden';
            this.scheduledVideoElement.style.zIndex = '-1';
        }

        this.adVideoElement.style.opacity = '1';
        this.adVideoElement.style.pointerEvents = 'auto';
        this.adVideoElement.style.visibility = 'visible';
        this.adVideoElement.style.zIndex = '200'; // Above scheduled content
        this.adVideoElement.src = ad.url;

        // Play ad
        await this.adVideoElement.play();
        this.isAdBreakPlaying = true;

        // Wait for ad to finish
        return new Promise(resolve => {
            this.adVideoElement.addEventListener('ended', () => {
                console.log(`✅ Ad break ${adBreak.breakNumber} complete`);
                this.isAdBreakPlaying = false;
                resolve();
            }, { once: true });
        });
    }

    /**
     * Resume scheduled content after ad break
     */
    async resumeScheduledContent() {
        if (!this.scheduledVideoElement) return;

        console.log(`▶️ Resuming scheduled content from ${this.scheduledVideoPausedAt.toFixed(1)}s`);

        // Hide ad completely, show scheduled content
        if (this.adVideoElement) {
            this.adVideoElement.pause();
            this.adVideoElement.style.opacity = '0';
            this.adVideoElement.style.pointerEvents = 'none';
            this.adVideoElement.style.visibility = 'hidden';
            this.adVideoElement.style.zIndex = '-1';
        }

        this.scheduledVideoElement.style.opacity = '1';
        this.scheduledVideoElement.style.pointerEvents = 'auto';
        this.scheduledVideoElement.style.visibility = 'visible';
        this.scheduledVideoElement.style.zIndex = '100';

        // Resume playback
        await this.scheduledVideoElement.play();
        this.isScheduledVideoPlaying = true;
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this.scheduledVideoElement) {
            this.scheduledVideoElement.pause();
            this.scheduledVideoElement.remove();
        }

        if (this.adVideoElement) {
            this.adVideoElement.pause();
            this.adVideoElement.remove();
        }
    }
}

export default TvBroadcaster;
