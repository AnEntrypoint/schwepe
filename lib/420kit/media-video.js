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
    'ffmpeg -i', videoPath,
    '-vn -acodec mp3 -ab 128k',
    '-y', audioPath
  ].join(' ');

  try {
    await execAsync(ffmpegCommand);
    return audioPath;
  } catch (error) {
    console.error('Audio extraction failed:', error);
    throw error;
  }
}

/**
 * Concatenate multiple videos
 */
export async function concatenateVideos(videoPaths, outputPath) {
  if (!Array.isArray(videoPaths) || videoPaths.length === 0) {
    throw new Error('Invalid video paths array');
  }

  // Validate all input videos
  for (const videoPath of videoPaths) {
    const validation = validateMediaFile(videoPath, 'video');
    if (!validation.valid) {
      throw new Error(`Invalid video file: ${videoPath} - ${validation.error}`);
    }
  }

  await ensureDir(path.dirname(outputPath));
  
  // Create temporary file list
  const listFile = path.join(paths.outputDir, 'filelist.txt');
  const fileListContent = videoPaths.map(p => `file '${p}'`).join('\n');
  await fs.promises.writeFile(listFile, fileListContent);

  const ffmpegCommand = [
    'ffmpeg -f concat -safe 0',
    '-i', listFile,
    '-c copy',
    '-y', outputPath
  ].join(' ');

  try {
    await execAsync(ffmpegCommand);
    
    // Clean up temporary file
    await fs.promises.unlink(listFile);
    
    return outputPath;
  } catch (error) {
    console.error('Video concatenation failed:', error);
    
    // Clean up temporary file on error
    try {
      await fs.promises.unlink(listFile);
    } catch {}
    
    throw error;
  }
}

/**
 * Get video information
 */
export async function getVideoInfo(videoPath) {
  const validation = validateMediaFile(videoPath, 'video');
  if (!validation.valid) {
    throw new Error(`Invalid video file: ${validation.error}`);
  }

  const ffprobeCommand = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
  
  try {
    const { stdout } = await execAsync(ffprobeCommand);
    const info = JSON.parse(stdout);
    
    const videoStream = info.streams.find(s => s.codec_type === 'video');
    const audioStream = info.streams.find(s => s.codec_type === 'audio');
    
    return {
      duration: parseFloat(info.format.duration) * 1000,
      size: parseInt(info.format.size),
      format: info.format.format_name,
      video: videoStream ? {
        codec: videoStream.codec_name,
        width: videoStream.width,
        height: videoStream.height,
        fps: eval(videoStream.r_frame_rate),
        bitrate: videoStream.bit_rate
      } : null,
      audio: audioStream ? {
        codec: audioStream.codec_name,
        sampleRate: audioStream.sample_rate,
        channels: audioStream.channels,
        bitrate: audioStream.bit_rate
      } : null
    };
  } catch (error) {
    console.error('Failed to get video info:', error);
    throw error;
  }
}