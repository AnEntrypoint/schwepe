/**
 * Media Generator Image Module
 * Image processing and manipulation functionality
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { ensureDir, generateUniqueFilename, validateMediaFile, paths } from './media-core.js';
import sharp from 'sharp';

const execAsync = promisify(exec);

/**
 * Process image with Sharp
 */
export async function processImage(inputPath, options = {}) {
  const validation = validateMediaFile(inputPath, 'image');
  if (!validation.valid) {
    throw new Error(`Invalid image file: ${validation.error}`);
  }

  const {
    width = 1280,
    height = 720,
    quality = 80,
    format = 'jpeg',
    fit = 'cover'
  } = options;

  await ensureDir(paths.savedImages);
  
  const outputPath = path.join(paths.savedImages, generateUniqueFilename('processed', format));
  
  try {
    let transformer = sharp(inputPath);
    
    if (width || height) {
      transformer = transformer.resize(width, height, { 
        fit: sharp.fit[fit] || sharp.fit.cover 
      });
    }
    
    if (format === 'jpeg') {
      transformer = transformer.jpeg({ quality });
    } else if (format === 'png') {
      transformer = transformer.png({ quality });
    } else if (format === 'webp') {
      transformer = transformer.webp({ quality });
    }
    
    await transformer.toFile(outputPath);
    return outputPath;
  } catch (error) {
    console.error('Image processing failed:', error);
    throw error;
  }
}

/**
 * Create image thumbnails
 */
export async function createImageThumbnails(inputPath, sizes = [150, 300, 600]) {
  const validation = validateMediaFile(inputPath, 'image');
  if (!validation.valid) {
    throw new Error(`Invalid image file: ${validation.error}`);
  }

  await ensureDir(paths.savedImages);
  
  const thumbnails = [];
  
  for (const size of sizes) {
    try {
      const outputPath = path.join(paths.savedImages, generateUniqueFilename(`thumb_${size}`, 'jpg'));
      
      await sharp(inputPath)
        .resize(size, size, { fit: sharp.fit.cover })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
      
      thumbnails.push({ size, path: outputPath });
    } catch (error) {
      console.error(`Failed to create thumbnail size ${size}:`, error);
    }
  }
  
  return thumbnails;
}

/**
 * Compress image
 */
export async function compressImage(inputPath, quality = 70) {
  const validation = validateMediaFile(inputPath, 'image');
  if (!validation.valid) {
    throw new Error(`Invalid image file: ${validation.error}`);
  }

  await ensureDir(paths.savedImages);
  
  const ext = path.extname(inputPath).toLowerCase();
  const outputFormat = ext === '.png' ? 'png' : 'jpeg';
  const outputPath = path.join(paths.savedImages, generateUniqueFilename('compressed', outputFormat));
  
  try {
    let transformer = sharp(inputPath);
    
    if (outputFormat === 'jpeg') {
      transformer = transformer.jpeg({ quality });
    } else {
      transformer = transformer.png({ quality: Math.round(quality * 0.9) });
    }
    
    await transformer.toFile(outputPath);
    return outputPath;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw error;
  }
}

/**
 * Convert image format
 */
export async function convertImageFormat(inputPath, targetFormat) {
  const validation = validateMediaFile(inputPath, 'image');
  if (!validation.valid) {
    throw new Error(`Invalid image file: ${validation.error}`);
  }

  await ensureDir(paths.savedImages);
  
  const outputPath = path.join(paths.savedImages, generateUniqueFilename('converted', targetFormat));
  
  try {
    let transformer = sharp(inputPath);
    
    switch (targetFormat) {
      case 'jpeg':
        transformer = transformer.jpeg({ quality: 85 });
        break;
      case 'png':
        transformer = transformer.png();
        break;
      case 'webp':
        transformer = transformer.webp({ quality: 85 });
        break;
      case 'avif':
        transformer = transformer.avif({ quality: 85 });