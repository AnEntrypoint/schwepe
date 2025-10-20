# 🐸 Schwepe Digital Experience

**Warning: This content contains mature themes, strong language, and existential humor.**

## Overview

The Schwepe Digital Experience is an interactive, immersive platform built with modern SSR architecture. This dynamic web application features multiple interconnected systems including video broadcasting, content galleries, and interactive lore exploration - all served through a high-performance Node.js backend with Vite frontend tooling.

## Architecture

### SSR (Server-Side Rendering) Setup
- **Backend**: Node.js Express server with SSR capabilities
- **Frontend**: Vite build system with modern JavaScript
- **Deployment**: Coolify + Nixpacks for automated CI/CD
- **Static Generation**: Hybrid approach with client-side data fetching

### Key Features
- **Age Verification**: Adult content warning with blur overlay
- **Video Broadcasting System**: Schwelevision with synchronized ad distribution
- **Dynamic Content Management**: JSON-powered content system
- **Gallery System**: Image and video galleries with metadata
- **Lore Library**: 9 chapters of interactive content
- **Responsive Design**: Mobile-friendly interface with glassmorphism effects
- **Schedule System**: Time-based content programming

## Pages & Systems

1. **Main Site** (`index.html`) - Landing page with overview
2. **Gallery** (`gallery.html`) - Media galleries with filtering
3. **Lore Library** (`lore.html`) - Interactive storytelling system
4. **Images Thread** (`images-thread.html`) - Image broadcasting system
5. **Videos Thread** (`videos-thread.html`) - Video broadcasting with Schwelevision

## Technical Stack

- **Build System**: Vite 5.x with custom plugins
- **Backend**: Node.js Express server
- **Styling**: TailwindCSS with custom glassmorphism
- **Data**: JSON files for content and metadata
- **Media**: Static asset management with organized directories
- **Deployment**: Automated via Git push to main branch

## Content Warning

This project contains:
- Strong language and adult themes
- Existential humor and absurdist content
- Black humor reminiscent of British comedy
- Cultural satire and social commentary

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd schwepe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   # Standard Vite dev server
   npm run dev

   # Full SSR development with CORS proxy
   npm run dev:ssr:full
   ```

4. **Access the application**
   - Main site: http://localhost:3000
   - SSR server: http://localhost:3000 (with SSR enabled)
   - Network access: http://[your-ip]:3000

### Build & Production

```bash
# Build for production
npm run build:ssr:production

# Start production server
npm start

# Deploy (build + git push)
npm run deploy
```

## Development Workflow

### Making Changes
1. Edit source files in the root directory
2. Test locally with `npm run dev` or `npm run dev:ssr:full`
3. Build and deploy with `npm run deploy`

### File Structure
```
├── index.html              # Main landing page
├── gallery.html            # Media galleries
├── lore.html               # Interactive lore system
├── videos-thread.html      # Video broadcasting
├── images-thread.html      # Image broadcasting
├── server.js               # SSR server
├── vite.config.js          # Vite configuration
├── static/                 # Static assets
├── schwepe/               # Schwepe media
├── cornermen/             # UI corner elements
├── saved_images/          # User image uploads
├── saved_videos/          # User video uploads
└── *.json                 # Content data files
```

## Video Broadcasting System

### Schwelevision Features
- **222 videos** in rotation with 111-minute loop duration
- **Weekly schedule** system with time slots
- **Synchronized ad distribution** using seeded random numbers
- **Gap detection** fills spaces between scheduled content
- **Perfect synchronization** across all clients
- **Error handling** with graceful fallbacks

### Ad Distribution Implementation
- **Seed-based selection**: `adBreakSeed = 247420` for deterministic results
- **Gap calculation**: Automatic detection of empty time slots
- **Preloading**: Ads buffered before playback for seamless experience
- **Fallback system**: Static content when media unavailable

## Deployment

### Automated Deployment (Coolify + Nixpacks)
1. Push changes to main branch
2. Coolify detects changes automatically
3. Nixpacks builds the project with `npm run build:ssr:production`
4. Static files served from `dist/` directory

### Production URL
- **Production**: https://schwepe.247420.xyz/

### Environment Variables
- `NODE_ENV`: Set to 'production' for production builds
- CORS configuration handled automatically for development

## Contributing

Feel free to submit issues and enhancement requests. When contributing:
- Maintain the established tone and style
- Test changes locally before deployment
- Follow the existing file structure
- Update documentation as needed

## License

This project is for entertainment purposes only. All content is fictional and satirical.

---

*Built with modern web technologies for a seamless digital experience.* 🐸✨# Deployment trigger Thu Oct 16 11:16:16 SAST 2025
## TV Guide Status
- ✅ Fixed SSR build configuration
- ✅ Added tv-guide-client.js copying
- ✅ Updated build process
- 🔄 Waiting for deployment pickup

Last deployment trigger: Thu Oct 16 11:21:15 SAST 2025
