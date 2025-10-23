# Multi-Site Deployment Guide

## Overview

This project supports a multi-domain architecture that allows serving multiple sites from a single codebase and deployment. Currently configured for:
- **247420.xyz** - Main 247420 TV streaming site
- **schwepe.247420.xyz** - Schwepe's Funky Universe site

Additional sites can be easily added following the same pattern.

## Architecture

### Components

1. **Domain Router** (`lib/domain-router.js`)
   - Maps incoming hostnames to site IDs
   - Loads configuration from each site's `config.json`
   - Provides middleware for Express to inject `req.siteId` and `req.sitePath`

2. **Template Engine** (`lib/template-engine.js`)
   - Renders site-specific HTML templates
   - Supports variable substitution (`{{ var }}`)
   - Handles conditional blocks and loops

3. **Server** (`server.js`)
   - Express-based Node.js server
   - Uses Domain Router to route requests to correct site
   - Serves site-specific assets, templates, and APIs
   - Supports both development (with Vite) and production modes

4. **Build System** (`build-multi-site.js`)
   - Builds all sites from `sites/` directory
   - Generates dist structure: `dist/{siteId}/*.html`
   - Includes build-process.js for phrase processing
   - Creates SSR-ready output via build-ssr.js

### Directory Structure

```
schwepe/
├── sites/
│   ├── 247420/                 # Main site
│   │   ├── config.json         # Domain: 247420.xyz
│   │   ├── schedule.json       # TV schedule
│   │   ├── saved_videos.json   # Video list
│   │   ├── templates/          # HTML templates
│   │   ├── media/              # Media files
│   │   │   ├── images/
│   │   │   ├── videos/
│   │   │   └── static/
│   │   └── styles/             # CSS files
│   │
│   └── schwepe/                # Subdomain site
│       ├── config.json         # Domain: schwepe.247420.xyz
│       ├── schedule.json
│       ├── saved_videos.json
│       ├── templates/
│       ├── media/
│       └── styles/
│
├── dist/                       # Built output (after npm run build)
│   ├── 247420/                 # Built 247420 site
│   ├── schwepe/                # Built schwepe site
│   ├── public/                 # Shared public assets
│   └── static/                 # Shared static assets
│
├── lib/
│   ├── domain-router.js        # Hostname → siteId mapping
│   ├── template-engine.js      # Template rendering
│   └── site-config.js          # Client-side site config
│
├── server.js                   # Express server
├── build-multi-site.js         # Multi-site build script
├── build-process.js            # Phrase processing
├── build-ssr.js                # SSR asset copying
└── package.json
```

## Adding a New Site

### 1. Create Site Directory Structure

```bash
mkdir -p sites/{site-id}/{media,templates,styles}
```

### 2. Create config.json

```json
{
  "id": "mysite",
  "domain": "mysite.247420.xyz",
  "name": "My Site Name",
  "meta": {
    "title": "My Site Title",
    "description": "Site description",
    "keywords": "keywords",
    "author": "Author Name",
    "themeColor": "#ffffff",
    "ogImage": "/media/og-image.gif",
    "twitter": "@handle"
  },
  "templates": {
    "index": "index.html",
    "gallery": "gallery.html",
    "lore": "lore.html",
    "videos": "videos-thread.html",
    "images": "images-thread.html"
  },
  "schedule": {
    "file": "schedule.json",
    "epochStart": 1735689600000,
    "programSeed": 247420,
    "loopDurationMs": 6660000
  },
  "media": {
    "images": "media/images",
    "videos": "media/videos",
    "static": "media/static"
  },
  "styles": {
    "main": "styles/main.css",
    "navbar": "styles/navbar.css",
    "lore": "styles/lore.css"
  }
}
```

### 3. Copy Templates

Copy HTML templates from an existing site:
```bash
cp sites/schwepe/templates/* sites/{site-id}/templates/
```

### 4. Add Media Content

- Place images in `sites/{site-id}/media/images/`
- Place videos in `sites/{site-id}/media/videos/`
- Place static assets in `sites/{site-id}/media/static/`

### 5. Create Schedule and Video Lists

- Create `sites/{site-id}/schedule.json` (TV schedule)
- Create `sites/{site-id}/saved_videos.json` (video list for gallery)

### 6. Customize Styles

- Edit `sites/{site-id}/styles/` CSS files to match your site theme

### 7. Build and Test

```bash
npm run build
npm start
```

Visit `http://localhost:3000` (it will use the default site)

## Domain Routing Logic

The `domain-router.js` uses this logic to map domains to sites:

1. Exact domain match: `mysite.247420.xyz` → check for exact match
2. Domain suffix match: any subdomain ending with domain
3. Default site: if no match found, use first loaded site

**Example:**
```javascript
// config.json domain values
const domains = [
  "247420.xyz",           // Exact match
  "schwepe.247420.xyz"    // Exact match
];

// Requests routed as:
"247420.xyz"          → '247420'
"www.247420.xyz"      → '247420' (suffix match)
"schwepe.247420.xyz"  → 'schwepe'
"test.247420.xyz"     → 'schwepe' (no match, default)
```

## Build Process

### Local Build
```bash
npm run build
```

Steps:
1. `build-multi-site.js` - Renders all site templates to `dist/{siteId}/`
2. `build-process.js` - Phrase processing and optimization
3. `build-ssr.js` - Copies additional assets and creates final dist structure

### Coolify Build

On Coolify, the deployment uses `nixpacks.toml`:
```toml
[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

The `npm start` command runs `server.js` in production mode, serving pre-built HTML from `dist/` directory.

## API Endpoints

All endpoints follow the pattern `/api/{siteId}/...`:

### Get Schedule
```
GET /api/{siteId}/schedule
Response: { videoList: [...], schedule: {...} }
```

### Get Media List
```
GET /api/{siteId}/media/{type}
Parameters:
  - type: 'images' or 'videos'
Response: [{ filename, size, created, modified }, ...]
```

## Running Locally

### Development Mode
```bash
npm run dev
```
- Runs on `http://localhost:3000` with Vite hot reload
- Uses templates to generate HTML
- Supports domain routing via Host header

### Production Mode
```bash
npm run build
npm start
```
- Runs on `http://localhost:3000`
- Serves pre-built HTML from `dist/` directory
- Uses production-optimized assets

## Coolify Deployment

### Prerequisites
- GitHub repository linked to Coolify
- Domain pointing to your server
- Coolify instance configured with multi-site support

### Deployment Steps
1. Push changes to GitHub
2. Coolify automatically:
   - Clones the repository
   - Runs `npm install`
   - Runs `npm run build`
   - Starts the application with `npm start`

### Viewing Logs
Use the coolify-tools CLI:
```bash
# List all deployments
coolify-logs https://coolify.247420.xyz list

# View specific deployment logs
coolify-logs https://coolify.247420.xyz {resource-id}
```

## Troubleshooting

### Site Not Appearing
1. Check domain in `sites/{site-id}/config.json`
2. Verify `npm run build` completed successfully
3. Check `dist/{site-id}/` has all required HTML files
4. Restart server: `npm start`

### Styles Not Loading
1. Verify CSS files exist in `sites/{site-id}/styles/`
2. Check paths in `config.json` media section
3. Ensure `/site-assets/styles/` is being served correctly

### Build Fails
1. Check `npm install` completes without errors
2. Verify all template files exist in `templates/` directory
3. Check `schedule.json` and `saved_videos.json` are valid JSON
4. Review build output for specific errors

### Deployment Issues
1. Check Coolify logs: `coolify-logs https://coolify.247420.xyz {resource-id}`
2. Verify git repository is accessible
3. Ensure `package.json` has correct build and start commands
4. Check environment variables are set if needed

## Performance Considerations

- Each site's HTML is pre-built and served as static files in production
- Templates are only rendered during build, not at request time
- Assets are cached by the browser
- Schedule calculations are done client-side using JavaScript
- Media lists are generated server-side for better performance

## Future Enhancements

- Database-backed site configuration
- Admin dashboard for managing sites
- Dynamic site creation without code changes
- CDN integration for media assets
- Automated backups of site content
- Analytics per site
