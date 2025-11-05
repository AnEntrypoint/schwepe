# CHANGELOG.md

## 2025-11-05 - LIVE VIDEO STREAMING & BUILD OPTIMIZATION

### Video Playback System ✅
- Implemented real HTML5 video streaming with 3-video queue system
- Direct streaming from archive.org URLs (CORS headers already present)
- Interleaved playback: 478 saved videos + 391 scheduled shows
- Graceful error handling for unavailable archive.org content
- Automatic preloading and seamless transitions
- On-screen display with color-coded video titles (cyan: saved, yellow: scheduled)
- Updated playback-handler.js to use direct URLs instead of proxy
- Removed unnecessary proxy middleware (archive.org has native CORS support)

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
