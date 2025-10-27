/**
 * Media Generator Core Module
 * Core functionality and shared utilities
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment detection
export const isCICDEnvironment = process.env.CI || process.env.NODE_ENV === 'production';

// Core path utilities
export const paths = {
  mediaRoot: join(__dirname, '..', '..', '..', 'public'),
  media420: join(__dirname, '..', '..', '..', 'public', '9_16'),
  cornermenLeft: join(__dirname, '..', '..', '..', 'public', 'cornermen', 'left'),
  cornermenRight: join(__dirname, '..', '..', '..', 'public', 'cornermen', 'right'),
  outputDir: join(__dirname, '..', '..', '..', 'public', 'output_16_9'),
  savedImages: join(__dirname, '..', '..', '..', 'public', 'saved_images'),
  savedVideos: join(__dirname, '..', '..', '..', 'public', 'saved_videos')
};

/**
 * Check if FFprobe is available
 */
export async function isFFprobeAvailable() {
  try {
    const { exec } = await import('child_process');
    return new Promise((resolve) => {
      exec('ffprobe -version', (error) => {
        resolve(!error);
      });
    });
  } catch {
    return false;
  }
}

/**
 * Extract video duration using available tools
 */
export async function extractVideoDurationFast(filePath) {
  const ffprobeAvailable = await isFFprobeAvailable();
  
  if (ffprobeAvailable) {
    try {
      const { exec } = await import('child_process');
      return new Promise((resolve, reject) => {
        exec(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`, 
          (error, stdout) => {
            if (error) reject(error);
            else resolve(parseFloat(stdout.trim()) * 1000);
          });
      });
    } catch {
      // Fallback to basic duration estimation
    }
  }
  
  // Basic duration estimation fallback
  const stats = await fs.promises.stat(filePath);
  return Math.min(stats.size / 1024 / 100, 30000); // Rough estimate
}

/**
 * Create directory if it doesn't exist
 */
export async function ensureDir(dirPath) {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    console.error('Failed to create directory:', dirPath, error);
    return false;
  }
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(baseName, extension) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${baseName}_${timestamp}_${random}.${extension}`;
}

/**
 * Validate media file
 */
export function validateMediaFile(filePath, type = 'any') {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'File does not exist' };
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
  
  if (type === 'video' && !videoExts.includes(ext)) {
    return { valid: false, error: 'Invalid video format' };
  }
  
  if (type === 'image' && !imageExts.includes(ext)) {
    return { valid: false, error: 'Invalid image format' };
  }
  
  return { valid: true };
}

/**
 * Media file metadata extractor
 */
export async function extractMetadata(filePath) {
  try {
    const stats = await fs.promises.stat(filePath);
    const duration = await extractVideoDurationFast(filePath);
    
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      duration: duration,
      extension: path.extname(filePath),
      filename: path.basename(filePath)
    };
  } catch (error) {
    console.error('Failed to extract metadata:', error);
    return null;
  }
}

// Core configuration
export const mediaConfig = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  supportedVideoFormats: ['mp4', 'webm', 'ogg', 'mov'],
  supportedImageFormats: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'],
  defaultVideoQuality: 'medium',
  defaultImageQuality: 80
};