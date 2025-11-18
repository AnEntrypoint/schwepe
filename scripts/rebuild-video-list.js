#!/usr/bin/env node
/**
 * Rebuild video list from saved_videos directory
 * Generates public/videos.json from files in public/saved_videos/
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogv', '.mov', '.avi'];

async function rebuildVideoList() {
  console.log('🎬 Rebuilding video list...');

  const savedVideosDir = path.join(projectRoot, 'public', 'saved_videos');
  const outputPath = path.join(projectRoot, 'public', 'videos.json');

  try {
    // Check if saved_videos directory exists
    try {
      await fs.access(savedVideosDir);
    } catch (err) {
      console.log('⚠️  saved_videos directory not found, creating empty videos.json');
      await fs.writeFile(outputPath, JSON.stringify([], null, 2));
      return;
    }

    // Read all files in saved_videos directory
    const files = await fs.readdir(savedVideosDir);

    // Filter for video files only
    const videoFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return VIDEO_EXTENSIONS.includes(ext);
    });

    console.log(`📹 Found ${videoFiles.length} video files`);

    // Generate video list
    const videoList = videoFiles.map(filename => ({
      path: `saved_videos/${filename}`,
      filename: filename,
      type: 'video'
    }));

    // Sort by filename (which includes timestamp) for consistent ordering
    videoList.sort((a, b) => a.filename.localeCompare(b.filename));

    // Write to videos.json
    await fs.writeFile(outputPath, JSON.stringify(videoList, null, 2));

    console.log(`✅ Generated videos.json with ${videoList.length} videos`);
    console.log(`   Output: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error rebuilding video list:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  rebuildVideoList();
}

export { rebuildVideoList };
