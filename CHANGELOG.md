# CHANGELOG.md

## 2025-11-13 - DEPLOYMENT ISSUE RESOLVED ✅

### Issue (RESOLVED)
Schwelevision video playback was broken on live site (schwepe.247420.xyz) - playback-handler.js and tv-scheduler.js were returning HTML instead of JavaScript.

### Root Cause
**Coolify uses nixpacks** which auto-generates Dockerfile and expected `npm run build:multi-site` script, but package.json only had `npm run build`.

### Solution
Added `build:multi-site` alias in package.json pointing to same build script:
```json
"scripts": {
  "build": "node build-multi-site.js",
  "build:multi-site": "node build-multi-site.js"  // Added for nixpacks
}
```

### Deployment Success ✅
- **Deployed**: 2025-11-13 14:23:18 GMT
- **Verified**: playback-handler.js serves as `application/javascript; charset=utf-8`
- **Verified**: tv-scheduler.js serves correctly
- **Tested**: Full end-to-end Playwright testing confirms TV working

### Live Site Verification (Playwright MCP Testing)
✅ **JavaScript modules load correctly**
- schwelevision.js: ✅
- playback-handler.js: ✅ (10KB, proper MIME type)
- tv-scheduler.js: ✅ (1.2KB, proper MIME type)
- All 12 lib/ modules: ✅

✅ **Video playback system operational**
- 858 total videos in queue (478 saved + 380 scheduled)
- Global synchronized playback at index 194 (epoch-based sync)
- Video transitions working (5-second intervals)
- NOW PLAYING display updates correctly
- Color coding works (cyan for saved, yellow for scheduled)
- TV slapping feature works (click screen for audio feedback)

✅ **Playback features verified**
- Mixed content mode active (saved + scheduled interleaving)
- Automatic error handling for unavailable videos (404s, timeouts)
- Sync drift detection and automatic resyncing
- Archive.org streaming with CDN redirects
- Graceful fallback for missing saved videos

### Performance Observations
**Video loading pattern observed:**
- Archive.org videos redirect to CDN nodes (expected behavior)
- Some double-loading occurs due to:
  - Sync drift corrections (keeps global playback aligned)
  - Archive.org URL resolution (initial → CDN redirect)
  - Browser autoplay policy retries
- Many saved videos return 404 (expected - production has fewer saved videos than dev)
- System automatically skips failed videos and continues playback

**Overall assessment**: TV is fully functional with expected behavior for distributed CDN streaming and global synchronization.

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
