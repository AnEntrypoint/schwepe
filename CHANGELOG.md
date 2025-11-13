# CHANGELOG.md

## 2025-11-13 - DEPLOYMENT ISSUE INVESTIGATION ⚠️

### Issue
Schwelevision video playback broken on live site (schwepe.247420.xyz) - playback-handler.js and tv-scheduler.js return HTML instead of JavaScript, preventing video playback initialization.

### Root Cause Analysis Completed
1. **Build system verified working** ✅ - Local `npm run build` successfully copies all required files to dist/schwepe/
2. **Server verified working** ✅ - Local server correctly serves .js files with application/javascript MIME type
3. **All source files present** ✅ - playback-handler.js (10KB, 303 lines) and tv-scheduler.js (1.2KB) exist in sites/schwepe/
4. **Coolify deployment NOT updating** ❌ - Last deployment: Nov 4, 2025 19:11:27 GMT despite multiple git pushes

### Actions Taken
- Fixed Dockerfile build command (line 15: `npm run build`)
- Added detailed logging to build-multi-site.js showing file copy operations
- Removed eval-tv.js requiring playwright package
- Added timestamp comment to Dockerfile to force Docker layer rebuild
- Pushed 8+ commits attempting to trigger Coolify webhook

### Current Status
Deployment stuck on November 4th build. Requires manual Coolify dashboard intervention.

### Manual Resolution Steps
1. Access Coolify dashboard
2. Navigate to schwepe project/service
3. Check webhook configuration (GitHub → Coolify)
4. Manually trigger rebuild
5. Verify build logs show: "✓ Copied playback-handler.js" and "✓ Copied tv-scheduler.js"
6. After deployment, verify: `curl https://schwepe.247420.xyz/playback-handler.js` returns JavaScript

## 2025-11-05 - SYNCHRONIZED GLOBAL PLAYBACK & INTERACTIVE FEATURES

### Global Synchronized Playback ✅
- Implemented epoch-based synchronization (2025-11-05T00:00:00Z baseline)
- All viewers worldwide see identical content at identical time
- 5-second enforced playback duration for perfect global alignment
- Automatic drift detection and resyncing every video transition
- Synchronized index calculation based on elapsed time since epoch
- Viewers joining at any time see current global playback position

### Interactive TV Slapping Feature ✅
- Click TV screen to "slap" with visual and audio feedback
- Audio synthesis: static crackle (200ms) → thud (150ms) → whine (300ms)
- Incrementing slap counter with animated pulse effect
- Web Audio API for authentic retro TV sound effects

### Enhanced Video Playback System ✅
- Real HTML5 video streaming with 3-video queue system
- Direct streaming from archive.org URLs (CORS headers already present)
- Interleaved playback: 478 saved videos + 391 scheduled shows
- Graceful error handling for unavailable archive.org content
- Automatic preloading and seamless transitions
- On-screen display with color-coded video titles (cyan: saved, yellow: scheduled)
- Comprehensive Playwright test suite with all evals passing

### Build System Optimization ✅
- Fixed excessive file duplication in build output
- Reduced dist size from 496MB to 305MB (38% reduction)
- site-assets now only contains config, templates, styles, scripts (not media)
- Media files (188MB) no longer duplicated across site builds
- Selective file copying prevents unnecessary bloat

### Files Modified
- build-multi-site.js: Optimized file copying to prevent media duplication
- sites/schwepe/playback-handler.js: Direct archive.org streaming + display
- sites/schwepe/templates/videos-thread.html: Enhanced now-playing display
- server.cjs: Removed proxy endpoint
- CLAUDE.md: Updated documentation

## 2025-10-27 - COMPREHENSIVE CI/CD FIXES (BLOCKED BY COOLIFY)

### Fixes Applied ✅
- Fixed ES module compatibility (server.js → server.cjs)
- Updated build process to use multi-site builder
- Fixed Dockerfile with Node 20 and proper user permissions
- Updated Nixpacks configuration with correct healthcheck
- Fixed GitHub Actions CI/CD workflow
- Updated build verification scripts for multi-site validation
- Created comprehensive documentation

### Current Status ❌
- **Application**: Fully functional and ready for deployment
- **Build**: Successful multi-site builds working
- **Local Testing**: All health checks passing
- **Deployment**: BLOCKED by Coolify infrastructure permission issues
- **Root Cause**: Coolify cannot write .env and docker-compose.yaml files

### Technical Details
- Build completes successfully
- Server starts correctly on port 3000
- Health endpoint /api/health functional
- Multi-site architecture working (247420, schwepe)
- Issue: Coolify server permission problems

### Next Steps Required
1. Manual Coolify server investigation
2. Alternative deployment platform consideration
3. Direct Docker deployment as fallback
4. VPS deployment if needed

## Previous Commits
- Multiple deployment permission attempts
- Infrastructure configuration fixes
- Multi-site architecture implementation
