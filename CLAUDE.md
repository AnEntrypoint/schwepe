# CLAUDE.md - Technical Architecture

## Deployment Status: ✅ LIVE & VERIFIED
- Deployed to Coolify on 2025-11-04
- Both domains live with completely distinct designs
- Domain routing verified working correctly

## Application Status: ✅ PRODUCTION
- Multi-site Node.js application fully functional
- Builds successfully with npm run build:multi-site
- Server runs with exact domain-based routing
- Health endpoint /api/health working

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

## Three-Layer Video Playback System (✅ FULLY OPERATIONAL WITH YEAR-LONG TV SCHEDULE)
**PlaybackHandler** implements continuous rotating playback mixing 478 saved videos with 391 scheduled programs:
- **Saved Videos**: 478 files from saved_videos/ directory (local content library)
- **Scheduled Content**: 391 shows from year-long weekly schedule (weeks 1-78)
- **Interleaving Ratio**: ~1 scheduled per 1.2 saved videos for balanced exposure
- All rotate every 5 seconds through entire library

Features:
- Loads saved videos from /public/videos.json
- Loads weekly schedules from /public/schedule_weeks/week_N.json
- Auto-detects current week and loads appropriate schedule
- Interleaves both video types for continuous mixed playback
- Color-coded display: Cyan (#00ffff) saved, Yellow (#ffff00) scheduled
- Display format: Saved = "filename.mp4", Scheduled = "Show Name - Episode Title"
- Console logging shows video type and title for debugging
- Graceful fallback if scheduler unavailable
- Tested with Playwright - both types cycling with proper colors confirmed

Files:
- **playback-handler.js**: PlaybackHandler with interleaving logic
- **tv-scheduler.js**: TVScheduler class loads weekly schedules dynamically
- **public/videos.json**: 478 saved video metadata
- **public/schedule_weeks/**: Year-long programming schedule (78 weeks)

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

### Schwelevision Tests - evals/eval-tv.js
Comprehensive Playwright browser tests for video playback:
- **Initialization**: Verifies Schwelevision system starts correctly
- **Library Loading**: Confirms 478 saved + 391 scheduled videos load
- **Video Rotation**: Validates continuous playback with multiple transitions
- **Type Interleaving**: Ensures both saved and scheduled videos appear
- **Color Coding**: Verifies cyan (#00ffff) for saved, yellow (#ffff00) for scheduled
- **Display Updates**: Checks DOM updates with correct video names
- **Content Format**: Validates scheduled shows use "Show - Episode" format
- **Playback Timing**: Confirms ~5 second rotation intervals

Run: `node evals/eval-tv.js` (~80 seconds)

All 16 tests passing ✅

## Implementation Notes
- Each domain gets its own site directory with separate templates
- Build system renders templates with site-specific config
- schwelevision.js and lib/ are copied to dist root for ES module imports
- All modules properly exported and available in broadcasting system
- CSS-in-head approach for instant styling
- Complete Schwelevision broadcasting network fully operational
- MIME type handling for CSS, JS, JSON, images in server.cjs
- navbar.css styling with cyberpunk color scheme (#00f5ff primary)
