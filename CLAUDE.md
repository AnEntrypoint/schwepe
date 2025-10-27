# Technical Documentation;
## Multi-Domain Architecture;
### Domain Structure;
- **247420.xyz**: Root domain (sites/247420/);
- Content: 335 videos from ../247420;
- Schedule: saved_videos.json;
- Templates: index, gallery, lore, videos-thread, images-thread;
- **schwepe.247420.xyz**: Subdomain (sites/schwepe/);
- Content: 192 videos, 28 images;
- Schedule: saved_videos.json (separate from 247420);
- Templates: index, gallery, lore, videos-thread, images-thread;
### Media Isolation;
Each site maintains completely separate media:;
- sites/247420/media/videos/ - 335 videos;
- sites/schwepe/media/videos/ - 192 videos;
- sites/schwepe/media/images/ - 28 images;
### Build System;
- build-multi-site.js: Builds all sites from sites/ directory;
- vite.config.js: Handles asset bundling and domain routing;
- lib/site-config.js: Client-side domain detection and routing;
- Maps 247420.xyz → '247420';
- Maps schwepe.247420.xyz → 'schwepe';
### Configuration Files;
Each site has config.json defining:;
- Domain, metadata, templates;
- Schedule parameters (epochStart, programSeed, loopDurationMs);
- Media paths, styles;
### Notes;
- Cornermen removed (were template decorations, not a separate domain);
- Each site has independent TV schedule and saved_videos list;
- Build system filters out README.md from sites directory;
   11→   11→
   12→   12→## Architecture
   13→   13→- Vite build system
   14→   14→- Static site with client-side token data fetching
   15→   15→- Token data: static/token-data.js (604L)
   16→   16→- CORS handling: vite-cors-plugin.js (dev server)
   17→   17→
   18→   18→## Data Sources
   19→   19→- Token stats: Direct Somnex API calls from client
   20→   20→- Content: JSON files (schwepe-descriptions.json, lore-data.json, phrase files)
   21→   21→- Build-time phrase system for CMS integration
   22→   22→
   23→   23→## File Structure
   24→   24→- Pages: index.html, navbar.html, lore.html, gallery.html
   25→   25→- Static assets: /schwepe/, /cornermen/left/, /cornermen/right/
   26→   26→- Config: vite.config.js, vite-cors-plugin.js
   27→   27→
   28→   28→## SEO
   29→   29→- JSON-LD structured data in index.html
   30→   30→- sameAs array for related URLs
   31→   31→- Dynamic alt text system for images
   32→   32→
   33→   33→## Video System
   34→   34→- **Schwelevision**: Main video broadcasting system (videos-thread.html)
   35→   35→- **Synchronized Ad Distribution**: Fills gaps in scheduled programming with Schwepe videos
   36→   36→- **Features**:
   37→   37→  - 222 videos in rotation, 111min loop duration
   38→   38→  - Weekly schedule system with time slots
   39→   39→  - Deterministic ad selection using seeded random numbers
   40→   40→  - Ad preloading for seamless playback
   41→   41→  - Static transitions when ads aren't ready
   42→   42→  - Perfect synchronization across all clients
   43→   43→
   44→   44→### Ad Distribution System Implementation
   45→   45→- **Location**: videos-thread.html lines 1129-1264+
   46→   46→- **Seed**: `adBreakSeed = 247420` for deterministic selection
   47→   47→- **Method**: `selectAdVideo(day, time, adIndex)` with `hashCode()` + `seededRandom()`
   48→   48→- **Gap Detection**: Calculates gaps between scheduled content, fills with 1-3 ads
   49→   49→- **Synchronization**: Same parameters → same ad selection across all clients
   50→   50→- **Preloading**: `preloadAds()` method buffers ads before playback
   51→   51→- **Fallback**: Uses static screen if ad preloading fails
   52→   52→
   53→   53→### Video Playback Error Handling
   54→   54→- **CORS Failure Detection**: Checks `scheduledVideoElement.readyState === 0` before switching
   55→   55→- **Error Handlers**: `scheduledVideoElement.onerror` captures loading failures early
   56→   56→- **Fallback Prevention**: Avoids blank screens by verifying source accessibility
   57→   57→- **Error States**: `scheduledVideoError` flag tracks loading failures
   58→   58→- **Recovery**: Graceful fallback to Schwepe content when scheduled videos fail
   59→   59→- **Source Validation**: Prevents switching to inaccessible remote URLs
   60→   60→
   61→   61→### Development
   62→   62→- **Hot Reloading**: Vite dev server on `http://localhost:3000/`
   63→   63→- **Testing**: Playwright browser automation for client-side testing
   64→   64→- **Global Instance**: `window.tv` for debugging and testing
   65→   65→
   66→   66→### CORS Configuration
   67→   67→- **Development**: Allows all origins with `origin: '*'`
   68→   68→- **Methods**: GET, POST, PUT, DELETE, OPTIONS
   69→   69→- **Headers**: Content-Type, Authorization, X-Requested-With
   70→   70→- **Credentials**: Disabled (false)
   71→   71→- **External Access**: `host: true` enables network access
   72→   72→- **Network URLs**: Available at `http://[IP]:3000/` for external connections
   73→   73→
   74→   74→## TV Slap Functionality (NEW)
   75→   75→- **Interactive Feature**: Click TV screen to initialize audio and unmute
   76→   76→- **Visual Effects**: TV shake animation (500ms), static overlay flash
   77→   77→- **Audio Effects**: Thud sound generation using Web Audio API
   78→   78→- **Behavior**:
   79→   79→  - Initializes AudioContext (required by browsers)
   80→   80→  - Unmutes all video elements (current, next, scheduled)
   81→   81→  - Sets default volume to 30% if volume is 0
   82→   82→  - Shows slap counter with logging: "🖐️ TV slap #1 - Initializing audio! 🔊"
   83→   83→- **Implementation**: `handleTvSlap()`, `addTvShake()`, `playThudSound()`, `showStaticOverlay()`
   84→   84→
   85→   85→## Video Scheduling System Requirements (CRITICAL)
   86→   86→
   87→   87→### Time-Based Scheduling
   88→   88→- **GMT Standard**: All scheduling must use GMT time for worldwide consistency
   89→   89→- **30-Minute Slots**: Videos scheduled in 30-minute time slots
   90→   90→- **Deterministic Selection**: Same time → same video worldwide
   91→   91→- **No Random Selection**: Must remove `Math.random()` from scheduling logic
   92→   92→
   93→   93→### Content Categories
   94→   94→- **Scheduled Videos**: Main programming from `public/schedule_weeks/week_*.json`
   95→   95→- **Montage Videos**: Multiple videos that play sequentially to fill time slots
   96→   96→- **Ad Videos**: `public/saved_videos/` directory content serves as ads
   97→   97→- **Buffering Content**: Ads play when main videos buffer, static plays when ads buffer
   98→   98→
   99→   99→### Playback Rules
  100→  100→1. **Never Pause**: TV should never be in a paused state showing video
  101→  101→2. **Never Blank**: TV should never reach a blank/empty state
  102→  102→3. **Continuous Content**: Always have something playing (video, ad, or static)
  103→  103→4. **Buffering Handling**: Ads during video buffering, static during ad buffering
  104→  104→5. **Gap Filling**: Ads fill gaps when scheduled content is too short
  105→  105→6. **Montage Sequencing**: Montage videos play one by one to fill their time slot
  106→  106→
  107→  107→### State Management
  108→  108→- **Video States**: Playing → Buffering → Ad → Buffering → Static → Next Content
  109→  109→- **No Empty States**: Must always transition to next content immediately
  110→  110→- **Fallback Chain**: Scheduled → Ad → Static → Next Scheduled (never blank)
  111→  111→
  112→  112→## Dependencies
  113→  113→- **420sched**: Import via npm for proper scheduling functionality
  114→  114→- **420kit Utils**: Already installed for phrase system integration
  115→  115→- **420kit Shared**: Local package for shared 420kit functionality
  116→  116→
  117→  117→## Known Issues
  118→  118→- vite-cors-plugin.js: circular dependency, duplicate code
  119→  119→- 8 files >200L need splitting
  120→  120→- 35 orphaned files
  121→  121→- Scheduling: Currently using random selection instead of time-based GMT scheduling
  122→  122→- Static overlay: Not properly hiding after slap interaction
  123→  123→- Video blank states: Occurs during transitions between content
  124→  124→
  125→
  126→## Multi-Site Architecture
  127→
  128→The application now supports multiple sites with custom domains, serving site-specific content.
  129→
  130→### Structure
  131→```
  132→sites/
  133→  {site-id}/
  134→    config.json       - Site configuration (domain, meta, paths)
  135→    templates/        - HTML templates with {{variable}} syntax
  136→    media/
  137→      images/         - Site-specific images
  138→      videos/         - Site-specific videos (symlinks to shared storage)
  139→      static/         - Static assets
  140→      saved_images/   - Gallery images (symlink)
  141→    styles/           - Site-specific CSS
  142→    schedule.json     - TV schedule for this site
  143→```
  144→
  145→### Core Components
  146→
  147→**lib/domain-router.js**: Maps domains to site IDs, adds req.siteId to requests
  148→**lib/template-engine.js**: Renders templates with variable substitution
  149→**lib/site-config.js**: Client-side site detection and API path generation
  150→
  151→### Template Syntax
  152→- Variables: `{{ meta.title }}`, `{{ name }}`
  153→- Conditionals: `{% if condition %}...{% endif %}`
  154→- Loops: `{% for item in array %}...{% endfor %}`
  155→
  156→### API Endpoints
  157→- `/api/{siteId}/schedule` - Get site TV schedule
  158→- `/api/{siteId}/media/{type}` - Get site media list
  159→
  160→### Asset Paths
  161→- `/site-assets/` - Serves site-specific assets
  162→- Client code uses `siteConfig.getApiUrl()` and `siteConfig.getAssetUrl()`
  163→
  164→### Adding New Sites
  165→1. Create folder: `sites/{site-id}/`
  166→2. Add config.json with domain mapping
  167→3. Copy templates from existing site
  168→4. Add media content
  169→5. Create schedule.json
  170→6. Restart server to load new domain mapping
  171→
  172→### Build Process
  173→- `npm run build:multi-site` - Build all site templates
  174→- `npm run build:all` - Full multi-site + assets build
  175→
## Deployment Status - 2025-10-27

### Current Issue: Coolify Container Permissions
- **Status**: BLOCKED - Container write permissions
- **Impact**: Production deployment failing with 404 errors
- **Root Cause**: Coolify container cannot write to filesystem during deployment
- **Solution**: Requires Coolify administrator intervention

### Build Process: WORKING ✅
- All artifacts generated correctly in dist/
- Server configuration verified with health endpoint
- Nixpacks and package.json properly configured

### URLs Status:
- Main: https://schwepe.247420.xyz → 404 Not Found
- Direct: https://c0s8g4k00oss8kkcoccs88g0.247420.xyz → SSL Error
- Admin: https://coolify.247420.xyz → Working (302 redirect)

### Next Actions:
1. Contact Coolify admin for permission fix
2. Redeploy after permissions resolved
3. Verify all URLs accessible


## Recent Fixes - 2025-10-27

### Build Process Issues Resolved
- Fixed syntax error in build-process.js (missing catch block after try statement)
- Resolved undefined variable references in commented backup code sections
- Successfully generated dist/index.html and build artifacts
- Updated build configuration for multi-site Node.js application

### Deployment Configuration Updates  
- Updated nixpacks.toml for proper Node.js application deployment
- Fixed Dockerfile.coolify for multi-site architecture
- Set correct start command (node server.js vs npm start)
- Configured proper health check endpoint (/api/health)

### Git and Deployment
- Fixed all syntax and build issues
- Committed changes with commit 971ebcc644cd2e401cafbd27b56dc9d62d30df42
- Pushed to origin/main triggering Coolify deployment
- Application deploying to schwepe.247420.xyz

### Technical Notes
- Application uses Express.js with domain routing
- Multi-site architecture with template engine
- Health endpoint returns status, timestamp, uptime, and environment
- Build process generates phrase data and media manifests
