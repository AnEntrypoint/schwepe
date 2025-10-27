/**
 * Media Generator Image Advanced Module
 * Advanced image processing operations
 * Part of WFGY_Core_OneLine_v2.0 refactoring
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { ensureDir, generateUniqueFilename, validateMediaFile, paths } from './media-core.js';
import sharp from 'sharp';

const execAsync = promisify(exec);

/**
 * Create image collage
 */
export async function createImageCollage(imagePaths, options = {}) {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
    throw new Error('Invalid image paths array');
  }

  // Validate all input images
  for (const imagePath of imagePaths) {
    const validation = validateMediaFile(imagePath, 'image');
    if (!validation.valid) {
      throw new Error(`Invalid image file: ${imagePath} - ${validation.error}`);
    }
  }

  const {
    cols = 2,
    rows = 2,
    width = 800,
    height = 600,
    spacing = 10
  } = options;

  await ensureDir(paths.savedImages);
  
  const outputPath = path.join(paths.savedImages, generateUniqueFilename('collage', 'jpg'));
  
  try {
    // Calculate individual image dimensions
    const imgWidth = Math.floor((width - spacing * (cols + 1)) / cols);
    const imgHeight = Math.floor((height - spacing * (rows + 1)) / rows);
    
    // Create composite image
    const composite = [];
    
    for (let i = 0; i < Math.min(imagePaths.length, cols * rows); i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const left = spacing + col * (imgWidth + spacing);
      const top = spacing + row * (imgHeight + spacing);
      
      const resizedImage = await sharp(imagePaths[i])
        .resize(imgWidth, imgHeight, { fit: sharp.fit.cover })
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      composite.push({
        input: resizedImage.data,
        raw: {
          width: resizedImage.info.width,
          height: resizedImage.info.height,
          channels: resizedImage.info.channels
        },
        left: left,
        top: top
      });
    }
    
    // Create base canvas and composite
    await sharp({
      create: {
        width: width,
        height: height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite(composite)
    .jpeg({ quality: 85 })
    .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Image collage creation failed:', error);
    throw error;
  }
}

/**
 * Apply filters to image
 */
export async function applyImageFilters(inputPath, filters = []) {
  const validation = validateMediaFile(inputPath, 'image');
  if (!validation.valid) {
    throw new Error(`Invalid image file: ${validation.error}`);
  }

  await ensureDir(paths.savedImages);
  
  const outputPath = path.join(paths.savedImages, generateUniqueFilename('filtered', 'jpg'));
  
  try {
    let transformer = sharp(inputPath);
    
    filters.forEach(filter => {
      switch (filter.type) {
        case 'blur':
          transformer = transformer.blur(filter.sigma || 1);
          break;
        case 'sharpen':
          transformer = transformer.sharpen(filter.sigma || 1, filter.flat || 1, filter.jagged || 2);
          break;
        case 'brightness':
          transformer = transformer.modulate({ brightness: factor.brightness || 1 });
          break;
        case 'contrast':
          transformer = transformer.linear(filter.contrast || 1, 0);
          break;
        case 'grayscale':
          transformer = transformer.greyscale();
          break;
        case 'sepia':
          transformer = transformer.tint({ r: 255, g: 238, b: 196 });
          break;
      }
    });
    
    await transformer.jpeg({ quality: 90 }).toFile(outputPath);
    return outputPath;
  } catch (error) {
    console.error('Filter application failed:', error);
    throw error;
  }
}