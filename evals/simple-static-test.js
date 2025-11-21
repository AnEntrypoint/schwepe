#!/usr/bin/env node

/**
 * Simple static analysis of the videos-thread page
 * Checks for common issues without requiring a browser
 */

import fs from 'fs/promises';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  log('blue', '\n🔍 Static Analysis - videos-thread.html');
  log('blue', '========================================\n');

  const issues = [];
  const warnings = [];

  // Test 1: Check if HTML exists
  log('cyan', '📄 Checking HTML file...');
  try {
    const html = await fs.readFile('dist/schwepe/videos-thread.html', 'utf-8');
    log('green', '✓ HTML file exists');

    // Check for required elements
    if (!html.includes('id="currentVideo"')) {
      issues.push('Missing #currentVideo element');
    } else {
      log('green', '✓ #currentVideo element found');
    }

    if (!html.includes('id="nextVideo"')) {
      issues.push('Missing #nextVideo element');
    } else {
      log('green', '✓ #nextVideo element found');
    }

    if (!html.includes('id="thirdVideo"')) {
      issues.push('Missing #thirdVideo element');
    } else {
      log('green', '✓ #thirdVideo element found');
    }

    // Check for PlaybackHandler import
    if (!html.includes('import { PlaybackHandler }')) {
      issues.push('Missing PlaybackHandler import');
    } else {
      log('green', '✓ PlaybackHandler import found');
    }

    // Check import path
    const importMatch = html.match(/import\s+{\s*PlaybackHandler\s*}\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const importPath = importMatch[1];
      log('blue', `   Import path: ${importPath}`);
      if (importPath === './playback-handler.js') {
        log('green', '✓ Correct relative import path');
      } else {
        warnings.push(`Unexpected import path: ${importPath}`);
      }
    }

    // Check for initialization code
    if (!html.includes('new PlaybackHandler()')) {
      issues.push('Missing PlaybackHandler initialization');
    } else {
      log('green', '✓ PlaybackHandler initialization found');
    }

    if (!html.includes('await playback.loadVideos()')) {
      issues.push('Missing loadVideos() call');
    } else {
      log('green', '✓ loadVideos() call found');
    }

    if (!html.includes('playback.startPlayback()')) {
      issues.push('Missing startPlayback() call');
    } else {
      log('green', '✓ startPlayback() call found');
    }

  } catch (error) {
    issues.push(`Failed to read HTML: ${error.message}`);
  }

  // Test 2: Check JavaScript modules
  log('cyan', '\n📦 Checking JavaScript modules...');

  const modules = ['playback-handler.js', 'tv-scheduler.js', 'navbar.js'];
  for (const module of modules) {
    try {
      const content = await fs.readFile(`dist/schwepe/${module}`, 'utf-8');
      log('green', `✓ ${module} exists (${content.length} bytes)`);

      // Check for exports
      if (module === 'playback-handler.js') {
        if (!content.includes('export class PlaybackHandler')) {
          issues.push('PlaybackHandler class not exported');
        } else {
          log('green', '  ✓ PlaybackHandler class exported');
        }
      }

      if (module === 'tv-scheduler.js') {
        if (!content.includes('export class TVScheduler')) {
          issues.push('TVScheduler class not exported');
        } else {
          log('green', '  ✓ TVScheduler class exported');
        }
      }
    } catch (error) {
      if (module === 'navbar.js') {
        warnings.push(`${module} not found (may be optional)`);
      } else {
        issues.push(`${module} not found`);
      }
    }
  }

  // Test 3: Check data files
  log('cyan', '\n📊 Checking data files...');

  // Calculate current week
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const currentWeek = Math.floor(diff / oneDay / 7) + 1;

  log('blue', `   Current week: ${currentWeek}`);

  try {
    const weekFile = `dist/public/schedule_weeks/week_${currentWeek}.json`;
    const schedule = JSON.parse(await fs.readFile(weekFile, 'utf-8'));
    log('green', `✓ week_${currentWeek}.json exists`);

    if (schedule.v && typeof schedule.v === 'object') {
      const videoCount = Object.keys(schedule.v).length;
      log('green', `  ✓ Schedule has ${videoCount} videos`);

      // Check first video structure
      const firstVideo = Object.values(schedule.v)[0];
      if (firstVideo && firstVideo.show && firstVideo.episode && firstVideo.u) {
        log('green', '  ✓ Video structure correct (show, episode, u fields)');
      } else {
        issues.push('Invalid video structure in schedule');
      }
    } else {
      issues.push('Schedule missing "v" field');
    }
  } catch (error) {
    issues.push(`Failed to load week_${currentWeek}.json: ${error.message}`);
  }

  // Test 4: Check CSS files
  log('cyan', '\n🎨 Checking CSS files...');

  const cssFiles = ['navbar.css'];
  for (const cssFile of cssFiles) {
    try {
      await fs.readFile(`dist/schwepe/${cssFile}`, 'utf-8');
      log('green', `✓ ${cssFile} exists`);
    } catch (error) {
      warnings.push(`${cssFile} not found (styling may be broken)`);
    }
  }

  // Summary
  log('cyan', '\n📋 Test Summary');
  log('cyan', '===============');

  if (issues.length === 0) {
    log('green', '\n✅ All critical tests passed!');
  } else {
    log('red', `\n❌ Found ${issues.length} critical issue(s):`);
    issues.forEach(issue => log('red', `   - ${issue}`));
  }

  if (warnings.length > 0) {
    log('yellow', `\n⚠️  Found ${warnings.length} warning(s):`);
    warnings.forEach(warning => log('yellow', `   - ${warning}`));
  }

  if (issues.length === 0 && warnings.length === 0) {
    log('green', '\n🎉 No issues detected! The page should work correctly.');
  }

  return issues.length === 0;
}

runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
