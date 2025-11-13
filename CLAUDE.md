# CLAUDE.md - Technical Architecture

## Deployment Status: ⚠️ COOLIFY REBUILD REQUIRED
- Original deployment: 2025-11-04 (last-modified: Tue, 04 Nov 2025 19:11:27 GMT)
- Both domains live with completely distinct designs
- Domain routing verified working correctly
- **CRITICAL ISSUE**: Deployment has NOT updated despite multiple git pushes

### Problem Summary
Schwelevision video playback broken - playback-handler.js and tv-scheduler.js return HTML (homepage) instead of JavaScript.

### Root Cause Analysis ✅ COMPLETE
1. **Build script is CORRECT** ✅
   - build-multi-site.js properly copies all modules (lines 69-90)
   - Local testing: `npm run build` successfully copies all files to dist/schwepe/
   - Verified with detailed logging: all files copy correctly locally

2. **Local server works PERFECTLY** ✅
   - Test: `NODE_ENV=development node server.cjs`
   - playback-handler.js serves as application/javascript
   - tv-scheduler.js serves as application/javascript
   - All MIME types correct

3. **Coolify is NOT rebuilding** ❌
   - Multiple commits pushed (Dockerfile fix, timestamp updates, logging improvements)
   - Last-modified header still shows Nov 4, 2025
   - etag unchanged: W/"24eb-19a5047ff7f"
   - Deployment stuck on original build

### Required Action
**MANUAL COOLIFY INTERVENTION NEEDED:**
- Check Coolify dashboard for failed builds or webhook issues
- Manually trigger rebuild in Coolify
- OR check webhook configuration for GitHub → Coolify
- Verify Coolify has access to latest commits

### What to Verify After Rebuild
```bash
curl https://schwepe.247420.xyz/playback-handler.js | head -5
# Should return: export class PlaybackHandler {

curl -I https://schwepe.247420.xyz/playback-handler.js | grep content-type
# Should return: content-type: application/javascript
```

## Application Status: ⚠️ PARTIAL FUNCTIONALITY
- Multi-site Node.js application functional
- Builds successfully locally with npm run build
- Server runs with exact domain-based routing
- Health endpoint /api/health working
- **BLOCKED**: Schwelevision video playback broken due to missing JS modules

## Domain Routing & Designs (✅ VERIFIED LIVE)
- `247420.xyz` → **247420 Digital Stoner Den** (VT323 monospace, dark theme, age verification overlay)
- `schwepe.247420.xyz` → **Schwepe's Funky Universe** (Fredoka sans-serif, light animated gradients)
- Exact domain matching (server.cjs:38) prevents cross-domain design confusion

## Site Design Details
**247420 Digital Stoner Den:**
- VT323 monospace font family
- Dark background (#1a1a1a, #0d0d0d)
- Age verification modal on load
- Terminal-style navigation (`./home.sh`, `./lore.html`, etc.)
- Stoner/creative chaos branding

**Schwepe's Funky Universe:**
- Fredoka sans-serif font
- Animated gradient background (blue, green, purple cycling)
- Floating shape animations
- Clean feature cards (Sacred Texts, Creation Gallery, Visual Archives)
- Meme culture branding

## Technical Architecture
- Runtime: Node.js 20 Alpine
- Build System: Custom multi-site builder
- Sites: 247420, schwepe
- Server: Express.js with static file serving and domain-based routing
- Container: Docker with nixpacks build

## Schwelevision Restoration
Complete Schwelevision broadcasting system restored with:
- **videos-thread.html**: Full retro TV interface with real-time scheduler (612 lines)
- **schwelevision.js**: Main entry point for broadcasting system
- **lib/**: Complete module suite (13 modules)
  - tv-core-*.js: Core broadcasting functionality
  - tv-scheduler-*.js: Advanced scheduling system
  - tv-utils-*.js: Utilities and analytics
  - health-monitor.js: System health tracking
  - recommendation-engine.js: Content recommendations
  - transcoding-basic.js: Media transcoding

Also restored complete templates for:
- **images-thread.html**: Full image gallery with animations (708 lines)
- **gallery.html**: Content showcase (631 lines)
- **lore.html**: Documentation and sacred texts (1188 lines)

## Performance Metrics
- **Build Size**: 305MB (reduced from 496MB - 38% optimization)
- **Video Library**: 478 saved videos (144MB)
- **Scheduled Content**: 391 shows across 78 weeks (25MB schedules)
- **Image Library**: 64MB
- **Total Assets**: ~303MB in public/, minimal duplication in dist/

## Video Playback System (✅ PRODUCTION-READY WITH FALLBACKS)
**PlaybackHandler** implements globally synchronized HTML5 video playback with intelligent fallback handling:

### Content Sources (Priority Order)
1. **Scheduled Content** (Primary - Archive.org): 391 shows streaming from archive.org (weeks 1-78)
2. **Saved Videos** (Optional - Local): 478 MP4 files from /public/saved_videos/ (gitignored, dev-only)
3. **Static Fallback**: Animated TV static canvas for transitions and errors

### Production Deployment Strategy
- **Primary Mode**: Scheduled content from archive.org (always available)
- **Hybrid Mode**: Mixed saved + scheduled (when saved_videos/ exists locally)
- **Graceful Degradation**: Auto-detects missing saved_videos and continues with scheduled only
- **Static Display**: Shows TV static during video transitions and loading states

### Playback Features
- **Video Queue**: 3-video rotation system with preloading for seamless playback
- **Global Sync**: All viewers worldwide see identical content at identical time
- **Sync Epoch**: 2025-11-05T00:00:00Z baseline for index calculation
- **Duration**: 5-second playback limit per video for perfect synchronization
- **Load Timeout**: 10-second timeout for unresponsive videos

### Real Video Streaming
- HTML5 `<video>` elements with direct src URLs
- Saved (optional): `/public/saved_videos/[filename].mp4`
- Scheduled: Direct archive.org URLs (CORS-enabled)
- Auto-advance after 5 seconds OR video end (whichever comes first)
- Unavailable videos (403/404) skipped automatically
- Preloads next video while current plays
- Drift detection and automatic resyncing every transition

### On-Screen Display
- Real-time "Now Playing" overlay showing current video title
- Color-coded: Cyan (#00ffff) for saved videos, Yellow (#ffff00) for scheduled
- Semi-transparent background for readability
- Truncates long titles with ellipsis
- Smooth transitions between video changes
- TV slapping feature: Click screen for audio feedback (static → thud → whine)

### Static Fallback System
- **Canvas-Based Static**: Animated TV static using HTML5 canvas
- **Automatic Rendering**: Updates at 50ms intervals for realistic effect
- **Transition Static**: 300ms flash between videos
- **Error Static**: 500ms display when videos fail to load
- **Loading Static**: 10s display when no content available

### Error Handling (Production-Hardened)
- **Missing Saved Videos**: Gracefully falls back to scheduled content only
- **CORS Errors**: Skip to next video with static transition
- **404/403 Errors**: Skip unavailable archive.org content automatically
- **Load Timeout**: Skip videos that don't load within 10 seconds
- **Autoplay Blocked**: Fallback to muted playback, then skip
- **Network Errors**: Continue playback with available content
- **Console Logging**: Detailed logs for debugging (✓/⚠/❌ indicators)

### Content Loading
- Loads saved videos from /public/videos.json (optional)
- Loads weekly schedules from /public/schedule_weeks/week_N.json (required)
- Auto-detects current week (1-78) and loads appropriate schedule
- Interleaves both video types when both available
- HEAD request verification for saved_videos availability
- Console logging shows video type and source for debugging

### Files
- **playback-handler.js**: Enhanced video playback with production fallbacks
- **tv-scheduler.js**: Weekly schedule loader with archive.org URLs
- **public/videos.json**: 478 saved video metadata (gitignored in production)
- **public/schedule_weeks/**: Year-long TV schedule (78 weeks, 391 programs)

### Testing
- Tested with Playwright - both saved and scheduled streaming
- Local development: Full hybrid mode with saved + scheduled
- Production deployment: Scheduled-only mode (expected behavior)
- Static fallback verified for error states

## Automated Testing (✅ COMPREHENSIVE EVALS)

### Basic Tests - evals/eval.js
Fast integration tests using fetch:
- Automatic port cleanup (kills servers on 3100-3109)
- Starts server with dynamic port detection
- Tests health endpoint functionality
- Validates both site designs (247420, schwepe)
- Tests all major pages (home, lore, gallery, images, videos)
- Verifies static asset serving and MIME types
- Validates JavaScript modules (playback-handler, tv-scheduler)
- Checks videos.json library (478 videos)
- Validates weekly schedule format (373+ programs per week)
- Automatic server cleanup after tests
- Color-coded output for easy debugging
- Robust error handling for port conflicts

Run: `node evals/eval.js` (~15 seconds)

### Browser Testing
For comprehensive Schwelevision testing including video playback, use Playwright MCP:
- Navigate to videos-thread.html
- Check window.playback and window.tv objects
- Monitor console for playback logs
- Verify video element src changes
- Confirm color-coded "Now Playing" display

## Implementation Notes
- Each domain gets its own site directory with separate templates
- Build system renders templates with site-specific config
- schwelevision.js and lib/ are copied to dist root for ES module imports
- All modules properly exported and available in broadcasting system
- CSS-in-head approach for instant styling
- Complete Schwelevision broadcasting network fully operational
- MIME type handling for CSS, JS, JSON, images in server.cjs
- navbar.css styling with cyberpunk color scheme (#00f5ff primary)
