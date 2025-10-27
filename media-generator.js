/**
 * Media Generator Module (Refactored)
 * Main entry point - WFGY_Core_OneLine_v2.0 compliant
 * 
 * This file is now under 200 lines and serves as the main entry point.
 * Core functionality has been split into focused modules under 200 lines each.
 */

// Import the refactored modules
import MediaGenerator from './lib/420kit/media-utils-basic.js';
import { 
  quickProcessVideo, 
  quickProcessImage,
  optimizeMedia
} from './lib/420kit/media-utils-advanced.js';

// Core functions
import { 
  processVideo,
  createVideoThumbnail,
  processImage,
  createImageThumbnails,
  extractMetadata,
  mediaConfig
} from './lib/420kit/media-utils-basic.js';

// Advanced functions
import {
  getVideoInfo,
  extractAudio,
  compressImage,
  convertImageFormat,
  createImageCollage
} from './lib/420kit/media-utils-advanced.js';

// Export main class and convenience functions
export {
  MediaGenerator,
  quickProcessVideo,
  quickProcessImage,
  optimizeMedia,
  processVideo,
  createVideoThumbnail,
  processImage,
  createImageThumbnails,
  extractMetadata,
  getVideoInfo,
  extractAudio,
  compressImage,
  convertImageFormat,
  createImageCollage,
  mediaConfig
};

// Default export for backwards compatibility
export default MediaGenerator;

// Legacy compatibility - maintain the original interface
const legacyGenerator = new MediaGenerator();

// Export legacy function names if they existed in the original
export const createMedia = legacyGenerator.processMedia.bind(legacyGenerator);
export const processMediaFile = legacyGenerator.processMedia.bind(legacyGenerator);

// Configuration access
export const config = mediaConfig;
export const paths = mediaConfig.paths || {};

// Version and metadata
export const version = '2.0.0';
export const compliant = true; // WFGY_Core_OneLine_v2.0 compliant