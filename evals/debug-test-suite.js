/**
 * Debug Hooks Test Suite
 * Comprehensive Playwright tests demonstrating all debug functionality
 * 
 * Run: npx playwright test evals/debug-test-suite.js
 */

import { test, expect } from '@playwright/test'
import http from 'http'
import { spawn } from 'child_process'

let server = null
let port = 3000

// Auto-start server for tests
test.beforeAll(async () => {
  port = await findAvailablePort()
  console.log(`Starting server on port ${port}...`)
  
  server = spawn('node', ['server.cjs'], {
    env: { ...process.env, PORT: port, NODE_ENV: 'development' }
  })

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000))
})

test.afterAll(async () => {
  if (server) {
    server.kill()
  }
})

async function findAvailablePort(start = 3000) {
  return new Promise((resolve) => {
    const server = http.createServer()
    server.listen(start, () => {
      server.close(() => resolve(start))
    })
    server.on('error', () => resolve(findAvailablePort(start + 1)))
  })
}

test.describe('Debug Hooks - Playback State', () => {
  test('getPlaybackState returns complete state', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    const state = await page.evaluate(() => window.__DEBUG.getPlaybackState())
    
    expect(state).toHaveProperty('timestamp')
    expect(state).toHaveProperty('playingScheduled')
    expect(state).toHaveProperty('scheduleIndex')
    expect(state).toHaveProperty('fillerIndex')
    expect(state).toHaveProperty('scheduledVideoCount')
    expect(state).toHaveProperty('fillerVideoCount')
    expect(typeof state.normalizedVolume).toBe('number')
  })

  test('getCurrentVideoInfo shows playing video', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    const video = await page.evaluate(() => window.__DEBUG.getCurrentVideoInfo())
    
    expect(video).toHaveProperty('type')
    expect(['SCHEDULE', 'FILLER']).toContain(video.type)
    expect(video).toHaveProperty('currentTime')
    expect(video).toHaveProperty('duration')
    expect(video).toHaveProperty('paused')
    expect(video).toHaveProperty('title')
  })

  test('getPlaybackAnalytics provides video element details', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    const analytics = await page.evaluate(() => window.__DEBUG.getPlaybackAnalytics())
    
    expect(analytics).toHaveProperty('videoElements')
    expect(Array.isArray(analytics.videoElements)).toBe(true)
    expect(analytics.videoElements.length).toBe(3) // 3 video rotation queue
    
    analytics.videoElements.forEach(el => {
      expect(el).toHaveProperty('index')
      expect(el).toHaveProperty('paused')
      expect(el).toHaveProperty('currentTime')
      expect(el).toHaveProperty('duration')
    })
  })
})

test.describe('Debug Hooks - Navigation', () => {
  test('jumpToVideo navigates to scheduled video', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Jump to video 5
    const result = await page.evaluate(() => window.__DEBUG.jumpToVideo(5, true))
    
    expect(result).toHaveProperty('index')
    expect(result.index).toBe(5)
    expect(result.type).toBe('SCHEDULE')
    
    // Verify state changed
    const state = await page.evaluate(() => window.__DEBUG.getPlaybackState())
    expect(state.scheduleIndex).toBe(5)
  })

  test('jumpToVideo navigates to filler video', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Jump to filler video 3
    const result = await page.evaluate(() => window.__DEBUG.jumpToVideo(3, false))
    
    expect(result).toHaveProperty('index')
    expect(result.index).toBe(3)
    expect(result.type).toBe('FILLER')
    
    // Verify state changed
    const state = await page.evaluate(() => window.__DEBUG.getPlaybackState())
    expect(state.fillerIndex).toBe(3)
  })

  test('jumpToVideo validates index bounds', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Jump to invalid index
    const result = await page.evaluate(() => window.__DEBUG.jumpToVideo(99999, true))
    
    expect(result).toHaveProperty('error')
  })

  test('forceNextVideo skips to next video', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Get current index
    const before = await page.evaluate(() => window.__DEBUG.getPlaybackState())
    const beforeIndex = before.scheduleIndex
    
    // Force next
    await page.evaluate(() => window.__DEBUG.forceNextVideo())
    
    // Check new index
    const after = await page.evaluate(() => window.__DEBUG.getPlaybackState())
    expect(after.scheduleIndex).toBe(beforeIndex + 1)
  })

  test('toggleMode switches between scheduled and filler', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Get initial mode
    const before = await page.evaluate(() => window.__DEBUG.getPlaybackState())
    const beforeMode = before.playingScheduled
    
    // Toggle
    const result = await page.evaluate(() => window.__DEBUG.toggleMode())
    
    // Verify state changed
    const after = await page.evaluate(() => window.__DEBUG.getPlaybackState())
    expect(after.playingScheduled).toBe(!beforeMode)
  })
})

test.describe('Debug Hooks - Volume Control', () => {
  test('setVolume changes volume level', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Set volume
    const result = await page.evaluate(() => window.__DEBUG.setVolume(0.3))
    
    expect(result.volume).toBe(0.3)
    
    // Verify it stuck
    const state = await page.evaluate(() => window.__DEBUG.getPlaybackState())
    expect(state.normalizedVolume).toBe(0.3)
  })

  test('setVolume clamps values 0-1', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Try to set invalid values
    const high = await page.evaluate(() => window.__DEBUG.setVolume(2.5))
    expect(high.volume).toBe(1)
    
    const low = await page.evaluate(() => window.__DEBUG.setVolume(-5))
    expect(low.volume).toBe(0)
  })

  test('getVolume returns current volume', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Set and get
    await page.evaluate(() => window.__DEBUG.setVolume(0.5))
    const vol = await page.evaluate(() => window.__DEBUG.getVolume())
    
    expect(vol.volume).toBe(0.5)
  })
})

test.describe('Debug Hooks - Content Lists', () => {
  test('listScheduledVideos returns formatted list', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    const videos = await page.evaluate(() => window.__DEBUG.listScheduledVideos(5))
    
    expect(Array.isArray(videos)).toBe(true)
    expect(videos.length).toBeLessThanOrEqual(5)
    
    videos.forEach(v => {
      expect(v).toHaveProperty('index')
      expect(v).toHaveProperty('title')
      expect(v).toHaveProperty('url')
      expect(v).toHaveProperty('cached')
    })
  })

  test('listFillerVideos returns formatted list', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    const videos = await page.evaluate(() => window.__DEBUG.listFillerVideos(5))
    
    expect(Array.isArray(videos)).toBe(true)
    
    videos.forEach(v => {
      expect(v).toHaveProperty('index')
      expect(v).toHaveProperty('title')
      expect(v).toHaveProperty('filename')
    })
  })
})

test.describe('Debug Hooks - Cache Management', () => {
  test('getDurationCache returns cache info', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    const cache = await page.evaluate(() => window.__DEBUG.getDurationCache())
    
    expect(cache).toHaveProperty('size')
    expect(cache).toHaveProperty('cache')
    expect(typeof cache.size).toBe('number')
    expect(typeof cache.cache).toBe('object')
  })

  test('getDurationCache filters by keys', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Get all first
    const all = await page.evaluate(() => window.__DEBUG.getDurationCache())
    
    if (Object.keys(all.cache).length > 0) {
      const keys = Object.keys(all.cache).slice(0, 2)
      const filtered = await page.evaluate(
        ({ keys }) => window.__DEBUG.getDurationCache(keys),
        { keys }
      )
      
      expect(typeof filtered).toBe('object')
    }
  })

  test('clearDurationCache removes all entries', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Get initial count
    const before = await page.evaluate(() => window.__DEBUG.getDurationCache())
    
    // Clear
    const result = await page.evaluate(() => window.__DEBUG.clearDurationCache())
    
    expect(result).toHaveProperty('cleared')
    
    // Verify cleared
    const after = await page.evaluate(() => window.__DEBUG.getDurationCache())
    expect(after.size).toBe(0)
  })
})

test.describe('Debug Hooks - System Info', () => {
  test('getSchedulerInfo returns scheduler state', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    const info = await page.evaluate(() => window.__DEBUG.getSchedulerInfo())
    
    expect(info).toHaveProperty('currentWeek')
    expect(info).toHaveProperty('scheduleLoaded')
    expect(info).toHaveProperty('scheduleLength')
    expect(info).toHaveProperty('scheduleType')
  })

  test('healthCheck verifies system readiness', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    const health = await page.evaluate(() => window.__DEBUG.healthCheck())
    
    expect(health).toHaveProperty('timestamp')
    expect(health).toHaveProperty('systems')
    expect(health.systems.playbackHandler).toBe(true)
    
    if (health.playback) {
      expect(health.playback.videosLoaded).toBe(true)
    }
  })

  test('getDebugReport provides complete snapshot', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    const report = await page.evaluate(() => window.__DEBUG.getDebugReport())
    
    expect(report).toHaveProperty('timestamp')
    expect(report).toHaveProperty('hookInitTime')
    expect(report).toHaveProperty('playbackState')
    expect(report).toHaveProperty('currentVideo')
    expect(report).toHaveProperty('schedulerInfo')
    expect(report).toHaveProperty('inspectionCount')
    expect(report).toHaveProperty('recentActions')
  })
})

test.describe('Debug Hooks - Inspection History', () => {
  test('getInspectionHistory tracks actions', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Perform some actions
    await page.evaluate(() => {
      window.__DEBUG.setVolume(0.5)
      window.__DEBUG.jumpToVideo(2, true)
      window.__DEBUG.forceNextVideo()
    })
    
    // Get history
    const history = await page.evaluate(() => window.__DEBUG.getInspectionHistory())
    
    expect(Array.isArray(history)).toBe(true)
    expect(history.length).toBeGreaterThan(0)
    
    // Should contain our actions
    const actions = history.map(h => h.action)
    expect(actions).toContain('setVolume')
    expect(actions).toContain('jumpToVideo')
    expect(actions).toContain('forceNextVideo')
  })

  test('clearInspectionHistory removes history', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Add to history
    await page.evaluate(() => window.__DEBUG.setVolume(0.5))
    
    // Clear
    const result = await page.evaluate(() => window.__DEBUG.clearInspectionHistory())
    
    expect(result).toHaveProperty('cleared')
    expect(result.cleared).toBeGreaterThan(0)
    
    // Verify cleared
    const history = await page.evaluate(() => window.__DEBUG.getInspectionHistory())
    expect(history.length).toBe(0)
  })
})

test.describe('Debug Hooks - Advanced', () => {
  test('eval executes code in debug context', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    const result = await page.evaluate(() => {
      return window.__DEBUG.eval('getPlaybackState()')
    })
    
    expect(result.success).toBe(true)
    expect(result.result).toHaveProperty('playingScheduled')
  })

  test('eval handles errors gracefully', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    const result = await page.evaluate(() => {
      return window.__DEBUG.eval('invalidFunction()')
    })
    
    expect(result.success).toBe(false)
    expect(result).toHaveProperty('error')
  })
})

test.describe('Integrated Workflows', () => {
  test('complete playback cycling', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Cycle through first 3 videos
    for (let i = 0; i < 3; i++) {
      const result = await page.evaluate(({ idx }) => {
        window.__DEBUG.jumpToVideo(idx, true)
        return window.__DEBUG.getCurrentVideoInfo()
      }, { idx: i })
      
      expect(result.index).toBe(i)
    }
  })

  test('volume adjustment workflow', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Test multiple volumes
    const volumes = [0, 0.25, 0.5, 0.75, 1]
    
    for (const vol of volumes) {
      const result = await page.evaluate(({ volume }) => {
        window.__DEBUG.setVolume(volume)
        return window.__DEBUG.getVolume()
      }, { volume: vol })
      
      expect(Math.abs(result.volume - vol) < 0.01).toBe(true)
    }
  })

  test('mode switching workflow', async ({ page }) => {
    await page.goto(`http://localhost:${port}/videos-thread.html`)
    await page.waitForLoadState('networkidle')
    
    // Get initial mode
    let state = await page.evaluate(() => window.__DEBUG.getPlaybackState())
    const initialMode = state.playingScheduled
    
    // Toggle multiple times
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.__DEBUG.toggleMode())
      state = await page.evaluate(() => window.__DEBUG.getPlaybackState())
    }
    
    // Should be back to original or different based on toggles
    // (3 toggles = opposite from start)
    expect(state.playingScheduled).toBe(!initialMode)
  })
})
