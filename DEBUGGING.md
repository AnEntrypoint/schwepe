# Debugging Guide - Schwelevision & Schwepe

Complete guide for debugging the Schwelevision TV broadcasting system and Schwepe site using built-in debug hooks, REPL access, and Playwright integration.

## Quick Start

### REPL Debugging
```bash
# Start dev server
npm run start:dev

# In browser console (F12 -> Console):
window.__DEBUG.getPlaybackState()
window.__DEBUG.getCurrentVideoInfo()
window.__DEBUG.jumpToVideo(5)
```

### Playwright Debugging
```javascript
// Get playback state
const state = await page.evaluate(() => window.__DEBUG.getPlaybackState())

// Jump to video
await page.evaluate(() => window.__DEBUG.jumpToVideo(10))

// Get current video info
const info = await page.evaluate(() => window.__DEBUG.getCurrentVideoInfo())
```

## Debug Hooks API Reference

The `window.__DEBUG` object provides comprehensive access to all systems. Initialize with:

```javascript
// In your app initialization
import DebugHooks from '/lib/debug-hooks.js'
DebugHooks.init(playbackHandler, tvScheduler, cacheManager)
```

### Playback State & Control

#### `getPlaybackState()`
Returns complete playback system state.

**Returns:**
```javascript
{
  timestamp: "2025-11-23T10:30:45.123Z",
  playingScheduled: true,           // Currently playing scheduled content?
  inCommercialBreak: false,         // In commercial break?
  scheduleIndex: 5,                 // Current scheduled video index
  fillerIndex: 0,                   // Current filler video index
  currentQueueIndex: 0,             // Which video element (0-2)
  scheduledVideoCount: 373,         // Total scheduled videos
  fillerVideoCount: 192,            // Total filler videos
  totalScheduleDuration: 86400000,  // Total schedule duration (ms)
  cacheSize: 150,                   // Cached video durations
  normalizedVolume: 0.7,            // Volume (0-1)
  currentSlotDuration: 1800000,     // Current slot duration (ms)
  currentBreakIndex: 0,             // Commercial break index
  showingStatic: false              // Currently showing static?
}
```

#### `getCurrentVideoInfo()`
Get detailed information about the current video.

**Returns:**
```javascript
{
  type: "SCHEDULE",                 // "SCHEDULE" or "FILLER"
  index: 5,                         // Current video index
  title: "Video Title",             // Video title
  url: "https://archive.org/...",  // Video URL (last 40 chars)
  currentTime: 123.45,              // Current playback position (s)
  duration: 1800,                   // Total duration (s)
  paused: false,                    // Is paused?
  readyState: 4                     // HTMLMediaElement readyState
}
```

**Example:**
```javascript
const video = window.__DEBUG.getCurrentVideoInfo()
console.log(`Playing: ${video.title} (${video.currentTime}/${video.duration}s)`)
```

#### `jumpToVideo(index, isScheduled = true)`
Jump directly to a specific video.

**Parameters:**
- `index` (number): Video index to jump to
- `isScheduled` (boolean): Jump in scheduled (true) or filler (false) videos

**Returns:** New video info or error

**Examples:**
```javascript
// Jump to scheduled video 10
window.__DEBUG.jumpToVideo(10, true)

// Jump to filler video 5
window.__DEBUG.jumpToVideo(5, false)
```

#### `forceNextVideo()`
Skip to the next video immediately.

**Returns:** New video info

```javascript
window.__DEBUG.forceNextVideo()
```

#### `toggleMode()`
Switch between scheduled and filler content.

**Returns:**
```javascript
{ mode: "FILLER" }  // or "SCHEDULE"
```

```javascript
window.__DEBUG.toggleMode()  // Switch to opposite mode
```

### Volume Control

#### `setVolume(volume)`
Set normalized volume level.

**Parameters:**
- `volume` (number): Volume 0-1 (will be clamped)

**Returns:**
```javascript
{ volume: 0.5 }
```

**Examples:**
```javascript
window.__DEBUG.setVolume(0.5)     // 50%
window.__DEBUG.setVolume(0)       // Mute
window.__DEBUG.setVolume(1)       // Max
```

#### `getVolume()`
Get current volume level.

**Returns:**
```javascript
{ volume: 0.7 }
```

### Content Information

#### `listScheduledVideos(limit = 10)`
List scheduled videos.

**Parameters:**
- `limit` (number): Maximum videos to return

**Returns:**
```javascript
[
  {
    index: 0,
    title: "Video Title",
    url: "https://archive.org/...",  // Last 40 chars
    cached: "yes"                     // Is duration cached?
  },
  ...
]
```

**Example:**
```javascript
const videos = window.__DEBUG.listScheduledVideos(5)
videos.forEach(v => console.log(`${v.index}: ${v.title}`))
```

#### `listFillerVideos(limit = 10)`
List filler/commercial videos.

**Parameters:**
- `limit` (number): Maximum videos to return

**Returns:**
```javascript
[
  {
    index: 0,
    title: "Commercial",
    filename: "2025-09-12T17-11-33Z_63118517_lv_0_20250912130745.mp4"
  },
  ...
]
```

### Cache Management

#### `getDurationCache(keys = null)`
Get duration cache information.

**Parameters:**
- `keys` (array, optional): Specific keys to retrieve

**Returns:**
```javascript
{
  size: 150,
  cache: {
    "https://archive.org/...": 1800000,  // URL: duration in ms
    ...
  }
}
```

**Examples:**
```javascript
// Get all cached durations
const cache = window.__DEBUG.getDurationCache()
console.log(`${cache.size} videos cached`)

// Get specific keys
const subset = window.__DEBUG.getDurationCache([
  "https://archive.org/url1",
  "https://archive.org/url2"
])
```

#### `clearDurationCache()`
Clear all cached video durations. Use when debugging duration issues.

**Returns:**
```javascript
{ cleared: 150 }
```

**Warning:** This will rebuild the cache as videos play.

### Scheduler Information

#### `getSchedulerInfo()`
Get TV scheduler state.

**Returns:**
```javascript
{
  currentWeek: 1,
  scheduleLoaded: true,
  scheduleLength: 20,
  scheduleType: "archive.org"
}
```

### Inspection & History

#### `getInspectionHistory(limit = 20)`
Get recent debug actions.

**Returns:**
```javascript
[
  {
    timestamp: "2025-11-23T10:30:45.123Z",
    action: "jumpToVideo",
    params: { index: 5, isScheduled: true }
  },
  ...
]
```

#### `clearInspectionHistory()`
Clear action history.

**Returns:**
```javascript
{ cleared: 20 }
```

### Comprehensive Reports

#### `getDebugReport()`
Get complete system status snapshot.

**Returns:**
```javascript
{
  timestamp: "2025-11-23T10:30:45.123Z",
  hookInitTime: "2025-11-23T10:00:00.000Z",
  playbackState: { ... },
  currentVideo: { ... },
  schedulerInfo: { ... },
  inspectionCount: 42,
  recentActions: [ ... ]
}
```

#### `healthCheck()`
Verify system health and readiness.

**Returns:**
```javascript
{
  timestamp: "2025-11-23T10:30:45.123Z",
  systems: {
    playbackHandler: true,
    tvScheduler: true,
    cacheManager: true
  },
  playback: {
    videoElementsReady: true,
    staticCanvasReady: true,
    videosLoaded: true,
    videosCount: 373
  }
}
```

### Advanced

#### `eval(code)`
Execute custom code in debug context.

**Parameters:**
- `code` (string): Code to execute

**Returns:**
```javascript
{
  result: value,
  success: true
}
```

**Examples:**
```javascript
// Get playback state with different method
window.__DEBUG.eval('playbackHandler.getBroadcastInfo()')

// Check specific value
window.__DEBUG.eval('scheduledVideos.length')

// Complex operations
window.__DEBUG.eval(`
  durationCache['key1'] + durationCache['key2']
`)
```

## Playwright Integration

### Setup
```javascript
import { test, expect } from '@playwright/test'

test('debug playback', async ({ page }) => {
  await page.goto('http://localhost:3000/videos-thread.html')
  await page.waitForLoadState('networkidle')
  
  // Access debug hooks
  const state = await page.evaluate(() => window.__DEBUG.getPlaybackState())
  console.log('Playback state:', state)
})
```

### Common Patterns

**Check health before tests:**
```javascript
const health = await page.evaluate(() => window.__DEBUG.healthCheck())
if (!health.playback.videosLoaded) {
  throw new Error('Videos not loaded')
}
```

**Jump to specific video:**
```javascript
await page.evaluate(({ idx }) => {
  window.__DEBUG.jumpToVideo(idx, true)
}, { idx: 5 })
```

**Monitor video progression:**
```javascript
for (let i = 0; i < 5; i++) {
  const video = await page.evaluate(() => window.__DEBUG.getCurrentVideoInfo())
  console.log(`${i}: ${video.title}`)
  await page.waitForTimeout(2000)
  await page.evaluate(() => window.__DEBUG.forceNextVideo())
}
```

**Get full debug report:**
```javascript
const report = await page.evaluate(() => window.__DEBUG.getDebugReport())
console.log(JSON.stringify(report, null, 2))
```

## Console Logging

All debug hooks log to console with emojis for quick visual scanning:

- `✅` - Successful operation
- `⏩` - Navigation/skipping
- `🔊` - Volume control
- `🗑️` - Cache clearing
- `⏭️` - Next video
- `🔄` - Mode switching
- `📌` - Debug system events
- `⚠️` - Warnings
- `❌` - Errors

## Debugging Workflows

### Workflow 1: Video Playback Issues

```javascript
// 1. Check health
window.__DEBUG.healthCheck()

// 2. Get current video
const video = window.__DEBUG.getCurrentVideoInfo()
console.log(video)

// 3. Check cache
const cache = window.__DEBUG.getDurationCache()
console.log(`Cached: ${cache.size}`)

// 4. Check analytics
const analytics = window.__DEBUG.getPlaybackAnalytics()
console.log(analytics.videoElements)

// 5. Force next to test transition
window.__DEBUG.forceNextVideo()
```

### Workflow 2: Duration Cache Issues

```javascript
// 1. Clear cache
window.__DEBUG.clearDurationCache()

// 2. Reload page (forces cache rebuild)
location.reload()

// 3. Monitor cache growth
setInterval(() => {
  const cache = window.__DEBUG.getDurationCache()
  console.log(`Cache size: ${cache.size}`)
}, 5000)
```

### Workflow 3: Volume Control Testing

```javascript
// Test all volume levels
[0, 0.25, 0.5, 0.75, 1].forEach(vol => {
  window.__DEBUG.setVolume(vol)
  console.log(`Volume set to ${vol * 100}%`)
})
```

### Workflow 4: Content Switching Testing

```javascript
// Cycle through first 5 scheduled videos
for (let i = 0; i < 5; i++) {
  window.__DEBUG.jumpToVideo(i, true)
  console.log(`Jumped to: ${window.__DEBUG.getCurrentVideoInfo().title}`)
  await new Promise(r => setTimeout(r, 1000))
}

// Switch to filler and test
window.__DEBUG.toggleMode()
```

### Workflow 5: Complete System Audit

```javascript
const audit = {
  timestamp: new Date().toISOString(),
  health: window.__DEBUG.healthCheck(),
  state: window.__DEBUG.getPlaybackState(),
  current: window.__DEBUG.getCurrentVideoInfo(),
  scheduler: window.__DEBUG.getSchedulerInfo(),
  cache: window.__DEBUG.getDurationCache(),
  report: window.__DEBUG.getDebugReport()
}

console.table(audit)
```

## Environment Variables

### Development Mode
Set `NODE_ENV=development` to enable:
- Console logging to window.__DEBUG calls
- Detailed state inspection
- History tracking (up to 100 items)

### Production Mode
Set `NODE_ENV=production` for:
- Minimal console noise
- Debug hooks still available
- No performance overhead from logging

## Common Issues & Solutions

### Issue: Videos not loading
```javascript
// Check cache
window.__DEBUG.getDurationCache()

// Check scheduler
window.__DEBUG.getSchedulerInfo()

// Check health
window.__DEBUG.healthCheck()

// Force reload
window.__DEBUG.clearDurationCache()
location.reload()
```

### Issue: Wrong video playing
```javascript
// Get current state
const state = window.__DEBUG.getPlaybackState()
console.log(`Index: ${state.scheduleIndex}, Mode: ${state.playingScheduled}`)

// Jump to correct one
window.__DEBUG.jumpToVideo(5, true)
```

### Issue: Volume too loud/quiet
```javascript
// Set specific volume
window.__DEBUG.setVolume(0.3)

// Check current
window.__DEBUG.getVolume()
```

### Issue: Static not clearing
```javascript
// Check state
const state = window.__DEBUG.getPlaybackState()
console.log(`Showing static: ${state.showingStatic}`)

// Force next video
window.__DEBUG.forceNextVideo()
```

## Testing Checklist

Use this checklist when testing with Playwright:

```javascript
const debugChecklist = async (page) => {
  console.log('Running debug checklist...')
  
  // 1. System health
  const health = await page.evaluate(() => window.__DEBUG.healthCheck())
  console.assert(health.systems.playbackHandler, 'PlaybackHandler missing')
  console.assert(health.playback.videosLoaded, 'Videos not loaded')
  
  // 2. Playback state
  const state = await page.evaluate(() => window.__DEBUG.getPlaybackState())
  console.assert(state.scheduledVideoCount > 0, 'No scheduled videos')
  console.assert(state.fillerVideoCount > 0, 'No filler videos')
  
  // 3. Current video
  const video = await page.evaluate(() => window.__DEBUG.getCurrentVideoInfo())
  console.assert(video.title, 'No video title')
  
  // 4. Controls work
  await page.evaluate(() => window.__DEBUG.setVolume(0.5))
  const vol = await page.evaluate(() => window.__DEBUG.getVolume())
  console.assert(Math.abs(vol.volume - 0.5) < 0.01, 'Volume set failed')
  
  // 5. Navigation works
  await page.evaluate(() => window.__DEBUG.jumpToVideo(1, true))
  const newVideo = await page.evaluate(() => window.__DEBUG.getCurrentVideoInfo())
  console.assert(newVideo.index === 1, 'Jump to video failed')
  
  console.log('✅ All checks passed!')
}
```

## Performance Notes

- Debug hooks add ~5KB to bundle (minified)
- No performance overhead when not called
- History limited to 100 items to prevent memory leaks
- Safe to leave enabled in production

## Integration with CI/CD

```bash
# Run tests with debug enabled
npm test -- --grep "debug"

# Collect debug reports
npx playwright test --reporter json > debug-results.json

# Extract debug info from results
node scripts/extract-debug-info.js debug-results.json
```

## Further Reading

- See CLAUDE.md for architecture overview
- See lib/debug-hooks.js for implementation
- See evals/e2e-videos-thread.js for Playwright examples

---

Last Updated: 2025-11-23
Created by: OpenCode Debug System
