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

## Three-Layer Video Playback System (✅ OPERATIONAL)
**PlaybackHandler** implements continuous rotating playback of three content layers:
- **Layer 1 (Static)**: Static Loop (10s) - fallback baseline content
- **Layer 2 (Filler)**: Ambient Video (5s) - ads/spacing content
- **Layer 3 (Scheduled)**: Main Content 1, 2, 3... (default 5s) - synced global content

Features:
- Automatic rotation through all videos in sequence (modulo cycling)
- Color-coded display backgrounds: Green (#00ff00) static, Cyan (#00ffff) filler, Yellow (#ffff00) scheduled
- Loads from JSON config files: saved_videos.json and scheduled_videos.json
- Console logging of each transition for debugging
- Graceful fallback to default videos if JSON load fails
- Tested and verified with Playwright MCP - all layers cycling correctly

Files:
- **playback-handler.js**: PlaybackHandler class with video rotation logic
- **saved_videos.json**: Layer 1 (static) and Layer 2 (filler) definitions
- **scheduled_videos.json**: Layer 3 (scheduled) content definitions

## Implementation Notes
- Each domain gets its own site directory with separate templates
- Build system renders templates with site-specific config
- schwelevision.js and lib/ are copied to dist root for ES module imports
- All modules properly exported and available in broadcasting system
- CSS-in-head approach for instant styling
- Complete Schwelevision broadcasting network fully operational
- MIME type handling for CSS, JS, JSON, images in server.cjs
- navbar.css styling with cyberpunk color scheme (#00f5ff primary)
