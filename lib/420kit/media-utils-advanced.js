/**
 * Media Generator Utils Advanced Module
 * Advanced utilities and convenience functions
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { MediaGenerator } from './media-utils-basic.js';
import { 
  getVideoInfo, 
  extractAudio, 
  concatenateVideos,
  addWatermark 
} from './media-video-advanced.js';
import { 
  compressImage, 
  convertImageFormat, 
  getImageMetadata,
  createImageCollage,
  applyImageFilters
} from './media-image-advanced.js';

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

/**
 * Advanced media processing batch operations
 */
export async function batchProcessMedia(inputPaths, options = {}) {
  const generator = new MediaGenerator({ maxConcurrentJobs: options.maxConcurrent || 3 });
  
  return generator.batchProcess(inputPaths, options);
}

/**
 * Smart media optimization
 */
export async function optimizeMedia(inputPath, options = {}) {
  const generator = new MediaGenerator();
  const metadata = await generator.extractMetadata(inputPath);
  
  if (metadata.duration > 0) {
    // Video optimization
    const optimized = await processVideo(inputPath, {
      outputFormat: 'mp4',
      quality: 'medium',
      resolution: '1280x720',
      fps: 30
    });
    
    const thumbnail = await createVideoThumbnail(inputPath);
    return { optimized, thumbnail, metadata };
  } else {
    // Image optimization
    const optimized = await compressImage(inputPath, 75);
    const thumbnails = await createImageThumbnails(inputPath, [150, 300]);
    return { optimized, thumbnails, metadata };
  }
}

// Re-export advanced functions
export {
  // Video advanced
  getVideoInfo,
  extractAudio,
  concatenateVideos,
  addWatermark,
  
  // Image advanced
  compressImage,
  convertImageFormat,
  getImageMetadata,
  createImageCollage,
  applyImageFilters
};

// Default export
export default {
  MediaGenerator,
  quickProcessVideo,
  quickProcessImage,
  batchProcessMedia,
  optimizeMedia
};