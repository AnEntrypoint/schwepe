/**
 * Media Generator Utils Module
 * Utility functions and main exports
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { extractMetadata, mediaConfig, paths, isCICDEnvironment } from './media-core.js';
import { processVideo, createVideoThumbnail, getVideoInfo, extractAudio, concatenateVideos } from './media-video.js';
import { processImage, createImageThumbnails, compressImage, convertImageFormat, getImageMetadata, createImageCollage } from './media-image.js';

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
        metadata: null,
        audio: null
      };

      // Process video
      if (options.processVideo !== false) {
        results.processed = await processVideo(inputPath, options.videoOptions);
      }

      // Create thumbnail
      if (options.createThumbnail !== false) {
        results.thumbnail = await createVideoThumbnail(inputPath, options.thumbnailTime);
      }

      // Extract metadata
      results.metadata = await getVideoInfo(inputPath);

      // Extract audio if requested
      if (options.extractAudio) {
        results.audio = await extractAudio(inputPath);
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
        metadata: null,
        compressed: null
      };

      // Process image
      if (options.processImage !== false) {
        results.processed = await processImage(inputPath, options.imageOptions);
      }

      // Create thumbnails
      if (options.createThumbnails !== false) {
        results.thumbnails = await createImageThumbnails(inputPath, options.thumbnailSizes);
      }

      // Extract metadata
      results.metadata = await getImageMetadata(inputPath);

      // Compress image if requested
      if (options.compress) {
        results.compressed = await compressImage(inputPath, options.compressQuality);
      }

      return results;
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Batch process multiple media files
   */
  async batchProcess(inputPaths, options = {}) {
    if (!Array.isArray(inputPaths)) {
      throw new Error('Input paths must be an array');
    }

    const { maxConcurrent = 3 } = options;
    const results = [];
    
    // Process in batches to avoid overwhelming system
    for (let i = 0; i < inputPaths.length; i += maxConcurrent) {
      const batch = inputPaths.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (inputPath, index) => {
        try {
          const result = await this.processMedia(inputPath, options);
          return { index: i + index, inputPath, result, success: true };
        } catch (error) {
          return { index: i + index, inputPath, error: error.message, success: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
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

/**
 * Quick processing functions for common use cases
 */
export async function quickProcessVideo(inputPath, options = {}) {
  const generator = new MediaGenerator();
  return generator.processVideoMedia(inputPath, {
    processVideo: true,
    createThumbnail: true,
    extractAudio: false,
    ...options
  });
}

export async function quickProcessImage(inputPath, options = {}) {
  const generator = new MediaGenerator();
  return generator.processImageMedia(inputPath, {
    processImage: true,
    createThumbnails: true,
    compress: false,
    ...options
  });
}

// Re-export all modules for advanced usage
export {
  // Core
  extractMetadata,
  mediaConfig,
  paths,
  isCICDEnvironment,
  
  // Video functions
  processVideo,
  createVideoThumbnail,
  getVideoInfo,
  extractAudio,
  concatenateVideos,
  
  // Image functions
  processImage,
  createImageThumbnails,
  compressImage,
  convertImageFormat,
  getImageMetadata,
  createImageCollage
};

// Default export
export default {
  MediaGenerator,
  createMediaGenerator,
  quickProcessVideo,
  quickProcessImage,
  // All functions available via named exports
};