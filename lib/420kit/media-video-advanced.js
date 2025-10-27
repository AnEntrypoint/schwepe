/**
 * Media Generator Video Advanced Module
 * Advanced video processing operations
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { ensureDir, generateUniqueFilename, validateMediaFile, paths } from './media-core.js';

const execAsync = promisify(exec);

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

/**
 * Add watermark to video
 */
export async function addWatermark(videoPath, watermarkPath, outputPath, position = 'bottom-right') {
  const validation = validateMediaFile(videoPath, 'video');
  if (!validation.valid) {
    throw new Error(`Invalid video file: ${validation.error}`);
  }

  await ensureDir(path.dirname(outputPath));
  
  const positions = {
    'top-left': '10:10',
    'top-right': 'W-w-10:10',
    'bottom-left': '10:H-h-10',
    'bottom-right': 'W-w-10:H-h-10'
  };
  
  const positionFilter = positions[position] || positions['bottom-right'];
  
  const ffmpegCommand = [
    'ffmpeg -i', videoPath,
    '-i', watermarkPath,
    '-filter_complex', `[1:v]scale=100:-1[wm];[0:v][wm]overlay=${positionFilter}`,
    '-c:a copy',
    '-y', outputPath
  ].join(' ');

  try {
    await execAsync(ffmpegCommand);
    return outputPath;
  } catch (error) {
    console.error('Watermark addition failed:', error);
    throw error;
  }
}