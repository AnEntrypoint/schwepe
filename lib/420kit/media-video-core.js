/**
 * Media Generator Video Module
 * Video processing and encoding functionality
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { ensureDir, generateUniqueFilename, validateMediaFile, paths } from './media-core.js';

const execAsync = promisify(exec);

/**
 * Process video with FFmpeg
 */
export async function processVideo(inputPath, options = {}) {
  const validation = validateMediaFile(inputPath, 'video');
  if (!validation.valid) {
    throw new Error(`Invalid video file: ${validation.error}`);
  }

  const {
    outputFormat = 'mp4',
    quality = 'medium',
    resolution = '1280x720',
    fps = 30
  } = options;

  await ensureDir(paths.outputDir);
  
  const outputPath = path.join(paths.outputDir, generateUniqueFilename('processed', outputFormat));
  
  const qualitySettings = {
    low: '-crf 28',
    medium: '-crf 23',
    high: '-crf 18'
  };

  const ffmpegCommand = [
    'ffmpeg -i', inputPath,
    '-vf', `scale=${resolution}`,
    '-r', fps.toString(),
    qualitySettings[quality] || qualitySettings.medium,
    '-c:a aac -b:a 128k',
    '-y', outputPath
  ].join(' ');

  try {
    await execAsync(ffmpegCommand);
    return outputPath;
  } catch (error) {
    console.error('Video processing failed:', error);
    throw error;
  }
}

/**
 * Create video thumbnail
 */
export async function createVideoThumbnail(videoPath, time = '00:00:01') {
  const validation = validateMediaFile(videoPath, 'video');
  if (!validation.valid) {
    throw new Error(`Invalid video file: ${validation.error}`);
  }

  await ensureDir(paths.savedImages);
  
  const thumbnailPath = path.join(paths.savedImages, generateUniqueFilename('thumb', 'jpg'));
  
  const ffmpegCommand = [
    'ffmpeg -i', videoPath,
    '-ss', time,
    '-vframes 1',
    '-q:v 2',
    '-y', thumbnailPath
  ].join(' ');

  try {
    await execAsync(ffmpegCommand);
    return thumbnailPath;
  } catch (error) {
    console.error('Thumbnail creation failed:', error);
    throw error;
  }
}

/**
 * Extract audio from video
 */
export async function extractAudio(videoPath) {
  const validation = validateMediaFile(videoPath, 'video');
  if (!validation.valid) {
    throw new Error(`Invalid video file: ${validation.error}`);
  }

  await ensureDir(paths.outputDir);
  
  const audioPath = path.join(paths.outputDir, generateUniqueFilename('audio', 'mp3'));
  
  const ffmpegCommand = [
}