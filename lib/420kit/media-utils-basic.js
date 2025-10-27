/**
 * Media Generator Utils Basic Module
 * Basic utilities and main exports
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { extractMetadata, mediaConfig, paths, isCICDEnvironment } from './media-core.js';
import { processVideo, createVideoThumbnail } from './media-video-core.js';
import { processImage, createImageThumbnails } from './media-image-core.js';

/**
 * Main media generator class
 */
export class MediaGenerator {
  constructor(options = {}) {
    this.options = {
      autoBackup: true,
      maxConcurrentJobs: 3,
      ...options
    };
    this.activeJobs = new Set();
  }

  /**
   * Process any media file (auto-detect type)
   */
  async processMedia(inputPath, options = {}) {
    const metadata = await extractMetadata(inputPath);
    if (!metadata) {
      throw new Error('Unable to extract media metadata');
    }

    const isVideo = metadata.duration > 0;
    
    if (isVideo) {
      return this.processVideoMedia(inputPath, options);
    } else {
      return this.processImageMedia(inputPath, options);
    }
  }

  /**
   * Process video media with thumbnails
   */
  async processVideoMedia(inputPath, options = {}) {
    const jobId = Date.now().toString();
    this.activeJobs.add(jobId);

    try {
      const results = {
        processed: null,
        thumbnail: null,
        metadata: null
      };

      // Process video
      if (options.processVideo !== false) {
        results.processed = await processVideo(inputPath, options.videoOptions);
      }

      // Create thumbnail
      if (options.createThumbnail !== false) {
        results.thumbnail = await createVideoThumbnail(inputPath, options.thumbnailTime);
      }

      return results;
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Process image media with thumbnails
   */
  async processImageMedia(inputPath, options = {}) {
    const jobId = Date.now().toString();
    this.activeJobs.add(jobId);

    try {
      const results = {
        processed: null,
        thumbnails: [],
        metadata: null
      };

      // Process image
      if (options.processImage !== false) {
        results.processed = await processImage(inputPath, options.imageOptions);
      }

      // Create thumbnails
      if (options.createThumbnails !== false) {
        results.thumbnails = await createImageThumbnails(inputPath, options.thumbnailSizes);
      }

      return results;
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Get active jobs count
   */
  getActiveJobsCount() {
    return this.activeJobs.size;
  }

  /**
   * Check if generator is busy
   */
  isBusy() {
    return this.activeJobs.size >= this.options.maxConcurrentJobs;
  }
}

/**
 * Factory function for easy usage
 */
export function createMediaGenerator(options = {}) {
  return new MediaGenerator(options);
}

// Basic exports
export {
  extractMetadata,
  mediaConfig,
  paths,
  isCICDEnvironment,
  processVideo,
  createVideoThumbnail,
  processImage,
  createImageThumbnails
};