# Debug Hooks Integration Guide

Complete integration of comprehensive debugging infrastructure for Schwelevision and Schwepe platforms. This document outlines all available debug tools, their usage, and integration patterns.

## System Overview

The debug system consists of 4 main components:

1. **DebugHooks** (`lib/debug-hooks.js`) - Core API for state inspection and control
2. **DebugUtils** (`lib/debug-utils.js`) - Utility functions for snapshots, performance, and error tracking
3. **DebugConsole** (`lib/debug-console.js`) - Styled console output and real-time monitoring
4. **PlaywrightHelpers** (`evals/playwright-helpers.js`) - Playwright testing utilities

## Architecture

### Debug Hooks System (`lib/debug-hooks.js`)

The primary debugging interface, exposed globally as `window.__DEBUG`.

**Initialization:**
```javascript
import DebugHooks from '/lib/debug-hooks.js'

// Called in videos-thread.html after systems are ready
DebugHooks.init(playbackHandler, tvScheduler, cacheManager)
```

**Core Capabilities:**
- Real-time playback state inspection
- Video navigation and control
- Volume management
- Cache inspection and management
- Scheduler information
- Health checks
- Inspection history tracking

### Debug Utilities (`lib/debug-utils.js`)

Helper functions for advanced debugging operations.

**Snapshot Management:**
```javascript
const snapshot = DebugUtils.snapshot(debugHooks)
// Returns: playback state, video info, analytics, scheduler, cache, health

const diff = DebugUtils.diff(snapshot1, snapshot2)
// Returns: differences between snapshots
```

**Performance Monitoring:**
```javascript
const monitor = DebugUtils.createPerformanceMonitor()
monitor.mark('video-load-start')
// ... operation ...
monitor.mark('video-load-end')
const duration = monitor.measure('video-load', 'video-load-start', 'video-load-end')
const report = monitor.getReport()
```

**Network Monitoring:**
```javascript
const networkMonitor = DebugUtils.createNetworkMonitor()
networkMonitor.enable() // Hooks into fetch

// Later...
const requests = networkMonitor.getRequests({ method: 'GET' })
const report = networkMonitor.getReport()
networkMonitor.disable()
```

**Error Tracking:**
```javascript
const errorTracker = DebugUtils.createErrorTracker()
errorTracker.enable() // Tracks console.error, console.warn, and uncaught errors

const errors = errorTracker.getErrors('ERROR')
const report = errorTracker.getReport()
errorTracker.disable()
```

**State History:**
```javascript
const history = DebugUtils.createStateHistory(maxSize)
history.record('before-play', state1)
history.record('after-play', state2)

const current = history.get()
const diff = history.getDiffFromLast()
```

### Debug Console (`lib/debug-console.js`)

Rich console output with tables, timers, and real-time monitoring.

**Installation:**
```javascript
import DebugConsole from '/lib/debug-console.js'
const dc = new DebugConsole()
```

**State Logging:**
```javascript
dc.logPlaybackState(debugHooks)     // Display current playback state in table
dc.logCurrentVideo(debugHooks)      // Display current video information
dc.logCacheStats(debugHooks)        // Display cache statistics
dc.logHealth(debugHooks)            // Display system health
dc.logVideoQueue(debugHooks)        // Display video queue visualization
```

**Monitoring:**
```javascript
// Start real-time monitoring with auto-refresh
dc.startMonitoring(debugHooks, 2000) // Updates every 2 seconds

// Later...
dc.stopMonitoring()
```

**Timers:**
```javascript
dc.startTimer('operation')
// ... do work ...
const duration = dc.endTimer('operation')
```

**Performance Reports:**
```javascript
const report = monitor.getReport()
dc.logPerformanceSummary(report.measurements)
```

### Playwright Helpers (`evals/playwright-helpers.js`)

Testing utilities and assertions for Playwright.

**Setup:**
```javascript
import { PlaywrightHelpers } from './evals/playwright-helpers.js'
const helper = new PlaywrightHelpers(page)
```

**Page Readiness:**
```javascript
// Wait for debug hooks to initialize
await helper.waitForDebugHooksReady()

// Wait for videos to load
await helper.waitForVideosLoaded()

// Wait for system to be healthy
const health = await helper.waitForHealthy()
```

**Assertions:**
```javascript
// Assert playback state
await helper.assertPlaybackState({
  playingScheduled: true,
  scheduleIndex: 5
})

// Assert video playing
await helper.assertVideoPlaying(true) // Should be playing

// Assert video progress
const progress = await helper.assertVideoProgress(10, 90) // Between 10-90%

// Assert volume
await helper.assertVolume(0.5)
```

**Monitoring & Testing:**
```javascript
// Monitor playback for duration
const updates = await helper.monitorPlayback(5000, 500) // 5s duration, 500ms interval

// Cycle through videos
const videos = await helper.cycleVideos(5)

// Test multiple volume levels
const results = await helper.testVolumeLevels([0, 0.25, 0.5, 0.75, 1])

// Verify video transition
const newVideo = await helper.verifyVideoTransition(5000)

// Get cache statistics
const stats = await helper.getCacheStats()
```

**Reports & Snapshots:**
```javascript
const snapshot = await helper.snapshot()
const report = await helper.getDebugReport()
const testReport = await helper.createTestReport('test-name')
await helper.printState() // Pretty-print state to console
```

## Integration Points

### In HTML Templates (sites/*/templates/videos-thread.html)

```javascript
import DebugHooks from '/lib/debug-hooks.js'
import DebugConsole from '/lib/debug-console.js'
import DebugUtils from '/lib/debug-utils.js'

// After all systems are initialized
DebugHooks.init(playbackHandler, tvScheduler, cacheManager)

// Optional: Create console and utils instances
const debugConsole = new DebugConsole()
const utils = DebugUtils

// Make available globally for quick access
window.__DEBUG_CONSOLE = debugConsole
window.__DEBUG_UTILS = utils
```

### In Playwright Tests (evals/*.js)

```javascript
import { test } from '@playwright/test'
import { PlaywrightHelpers } from './evals/playwright-helpers.js'

test('video playback', async ({ page }) => {
  await page.goto('http://localhost:3000/videos-thread.html')
  const helper = new PlaywrightHelpers(page)
  
  // Wait for readiness
  await helper.waitForHealthy()
  
  // Perform tests
  await helper.assertVideoPlaying(true)
  const progress = await helper.assertVideoProgress(0, 50)
  
  // Get debug report
  const report = await helper.getDebugReport()
})
```

## Usage Patterns

### Pattern 1: Quick Console Debugging

```javascript
// In browser console
window.__DEBUG.getPlaybackState()
window.__DEBUG.getCurrentVideoInfo()
window.__DEBUG.jumpToVideo(5, true)
window.__DEBUG.setVolume(0.5)
```

### Pattern 2: Monitoring Session

```javascript
// In browser console
const dc = window.__DEBUG_CONSOLE || new (await import('/lib/debug-console.js')).default()
dc.startMonitoring(window.__DEBUG, 2000)

// Later, stop monitoring
dc.stopMonitoring()

// Export logs if needed
dc.exportLogs()
```

### Pattern 3: Performance Profiling

```javascript
const utils = window.__DEBUG_UTILS
const perf = utils.createPerformanceMonitor()

perf.mark('session-start')
// ... user interaction ...
perf.mark('session-end')

const duration = perf.measure('session', 'session-start', 'session-end')
console.table(perf.getReport())
```

### Pattern 4: State Snapshots

```javascript
const utils = window.__DEBUG_UTILS

const before = utils.snapshot(window.__DEBUG)
// ... perform action ...
const after = utils.snapshot(window.__DEBUG)

const changes = utils.diff(before, after)
console.log('State changes:', changes.changes)
```

### Pattern 5: Automated Testing

```javascript
import { PlaywrightHelpers } from './evals/playwright-helpers.js'

async function runDebugTests(page) {
  const helper = new PlaywrightHelpers(page)
  
  // Check system health
  const health = await helper.waitForHealthy()
  console.log('Health:', health)
  
  // Test video playback
  for (let i = 0; i < 5; i++) {
    const video = await helper.assertVideoPlaying(true)
    console.log(`Video ${i}:`, video.title)
    await helper.forceNextVideo()
    await page.waitForTimeout(500)
  }
  
  // Get comprehensive report
  const report = await helper.getDebugReport()
  return report
}
```

## File Locations

```
lib/
  ├── debug-hooks.js          # Core debug API (300 lines)
  ├── debug-utils.js          # Utility functions (400 lines)
  └── debug-console.js        # Styled console output (550 lines)

evals/
  ├── debug-test-suite.js     # Playwright test suite (500 lines)
  ├── playwright-helpers.js   # Testing helpers (400 lines)
  └── eval.js                 # Basic integration tests

sites/*/templates/
  └── videos-thread.html      # Integrated with DebugHooks.init()

Documentation/
  ├── DEBUGGING.md            # API reference and examples
  └── DEBUG_INTEGRATION.md    # This file - integration guide
```

## Production Considerations

### Zero Overhead When Inactive

All debug systems are designed to have zero overhead when not actively used:

- `DebugHooks` - No performance impact
- `DebugUtils` monitors - Only active when explicitly enabled
- `DebugConsole` - Only renders when called
- `PlaywrightHelpers` - Only in test environments

### Safe for Production

- No sensitive data exposure
- No DOM modifications
- No event listener pollution
- No console spam
- Minimal bundle size (~20KB unminified)

### Disabling Debug in Production

If needed, set environment variable:
```bash
NODE_ENV=production npm run start
```

## Testing & Validation

### Running Debug Test Suite

```bash
# Run Playwright debug tests
npx playwright test evals/debug-test-suite.js

# Run specific test
npx playwright test evals/debug-test-suite.js -g "getPlaybackState"
```

### Manual Testing Checklist

```javascript
// In console, run each check
window.__DEBUG.healthCheck()
window.__DEBUG.getPlaybackState()
window.__DEBUG.getCurrentVideoInfo()
window.__DEBUG.getDebugReport()

// Volume test
window.__DEBUG.setVolume(0.5)
window.__DEBUG.getVolume()

// Navigation test
window.__DEBUG.jumpToVideo(1, true)
window.__DEBUG.forceNextVideo()
window.__DEBUG.toggleMode()

// Cache test
window.__DEBUG.getDurationCache()
window.__DEBUG.clearDurationCache()

// History test
window.__DEBUG.getInspectionHistory()
```

## Common Issues & Solutions

### Issue: Debug hooks not available

```javascript
// Check initialization
window.__DEBUG === undefined

// Solution: Wait for page load
setTimeout(() => {
  console.log(window.__DEBUG) // Should now be available
}, 2000)
```

### Issue: Videos not playing in tests

```javascript
// Use PlaywrightHelpers
const helper = new PlaywrightHelpers(page)
await helper.waitForVideosLoaded() // Waits for schedule to load
```

### Issue: Cache not being built

```javascript
// Clear and rebuild
window.__DEBUG.clearDurationCache()
location.reload() // Rebuild as videos play
```

## API Quick Reference

### Core Methods
- `getPlaybackState()` - Get current state
- `getCurrentVideoInfo()` - Get video details
- `jumpToVideo(index, isScheduled)` - Navigate
- `forceNextVideo()` - Skip
- `toggleMode()` - Switch scheduled/filler
- `setVolume(volume)` - Control volume
- `getVolume()` - Get volume

### Inspection
- `getDurationCache()` - View cache
- `clearDurationCache()` - Clear cache
- `listScheduledVideos(limit)` - List schedule
- `listFillerVideos(limit)` - List filler
- `getSchedulerInfo()` - Scheduler state
- `getInspectionHistory(limit)` - Action history

### System
- `healthCheck()` - System status
- `getDebugReport()` - Complete snapshot
- `getPlaybackAnalytics()` - Analytics
- `eval(code)` - Custom code execution

## Further Reading

- `DEBUGGING.md` - Comprehensive API reference
- `lib/debug-hooks.js` - Implementation details
- `lib/debug-utils.js` - Utility implementations
- `lib/debug-console.js` - Console UI implementations
- `evals/debug-test-suite.js` - Test examples
- `evals/playwright-helpers.js` - Helper implementations

---

Last Updated: 2025-11-23
Part of Schwelevision Debug Infrastructure
