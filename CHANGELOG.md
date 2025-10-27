## 2025-10-27T13:00:00.000Z - Fix Coolify Deployment Permissions

### Critical Fixes
- Fixed Dockerfile.coolify to use proper UID 1001 for Coolify compatibility
- Updated nixpacks.toml with correct environment variables and configuration
- Added dumb-init for proper signal handling in containers
- Removed sudo dependency from deployment process
- Fixed health check command format and timeout settings

### Deployment Improvements
- Set proper file permissions for Coolify deployment compatibility
- Updated deployment configuration to handle environment variables correctly
- Fixed container user permissions to prevent Permission denied errors
- Optimized Docker multi-stage build for better performance

### Configuration Updates
- Updated Dockerfile.coolify with proper signal handling
- Modified nixpacks.toml to use production environment variables
- Added comprehensive health check configuration
- Set proper ownership for application directories

---

    1→# Changelog
    2→
    3→## [Multi-Site Architecture] - 2025-10-20
    4→
    5→### Added
    6→- Multi-site architecture supporting multiple domains with custom content
    7→- Domain-based routing system (`lib/domain-router.js`)
    8→- Template engine with variable substitution (`lib/template-engine.js`)
    9→- Client-side site configuration (`lib/site-config.js`)
   10→- Site-specific folder structure under `sites/`
   11→- Migrated schwepe content to `sites/schwepe/`
   12→- Created example cornermen site at `sites/cornermen/`
   13→- Site-specific API endpoints for schedule and media
   14→- Multi-site build process (`build-multi-site.js`)
   15→- Template syntax: variables, conditionals, loops
   16→- Site-aware asset and API path resolution
   17→
   18→### Changed
   19→- Updated `server.js` for domain-based routing
   20→- Modified `schwelevision.js` to use site-aware paths
   21→- Updated all HTML templates to use template variables
   22→- Changed asset paths to use `/site-assets/` prefix
   23→- Updated package.json with `build:multi-site` and `build:all` scripts
   24→
   25→### Structure
   26→- Each site has: config.json, templates/, media/, styles/, schedule.json
   27→- Shared resources: public/ for common assets, static/ for build artifacts
   28→- Domain mapping configured in site config.json files
   29→

## 2025-10-20 - Multi-Domain Restructure
- Removed cornermen as separate domain (was mistakenly set up - cornermen are template decorations)
- Added 247420.xyz as root domain with content from ../247420
- Maintained schwepe.247420.xyz as subdomain
- Each site has separate media (images/videos), schedules, and templates
- Cleaned up all test files and unnecessary documentation
- Updated build system for proper domain routing

## 2025-10-27 - Deployment Diagnosis

### Issues Identified
- Build process failing with Windows file permission errors (EPERM)
- Empty dist directory causing 404 errors
- Container not running at deployment URL  
- DNS resolution issues for subdomains
- Coolify deployment permission problems

### Fixes Applied
- Fixed file permissions for build directories
- Updated deployment status with comprehensive diagnosis
- Created action plan in TODO.md

### Next Steps
- Fix local build process
- Test SSR deployment configuration
- Trigger new Coolify deployment
2025-10-27: Diagnosed Coolify deployment permission issues
- Identified container write permission problems blocking deployment
- Verified build process working correctly with all artifacts generated
- Updated deployment status documentation
- Awaiting Coolify administrator permission fix

## 2025-10-27 - CI/CD Process Fix Attempt

**DEPLOYMENT STATUS**: BLOCKED by Coolify server permissions

### Fixes Applied
- Fixed Dockerfile.coolify to use non-root user (UID 1001)
- Updated nixpacks.toml for proper Node.js application deployment  
- Added health checks and proper environment variables
- Removed sudo dependencies from deployment process
- Added dumb-init for proper signal handling

### Issue Identified
Coolify server has permission issues preventing deployment:
- Cannot write .env files (Permission denied)
- Cannot write docker-compose.yaml files (Permission denied)

### Application Status
✅ Application builds and runs successfully locally
✅ All deployment configurations are correct
✅ Ready for deployment once server permissions are fixed

### Required Action
Contact Coolify administrator to resolve server-side permission issues