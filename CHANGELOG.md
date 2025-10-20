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
