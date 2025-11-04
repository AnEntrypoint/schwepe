# CLAUDE.md - Technical Architecture

## Deployment Status: ✅ LIVE
- Deployed to Coolify on 2025-11-04 16:39:14 UTC
- Both domains live and serving correct designs
- Domain routing fix deployed and verified

## Application Status: ✅ PRODUCTION
- Multi-site Node.js application fully functional
- Builds successfully with npm run build:multi-site
- Server runs with domain-based routing
- Health endpoint /api/health working
- Health check verified: `{"status":"ok","timestamp":"2025-11-04T16:40:17.544Z","version":"1.0.0"}`

## Domain Routing & Designs (✅ VERIFIED LIVE)
- `247420.xyz` → **247420 Digital Stoner Den** (VT323 monospace, dark theme) ✅
- `schwepe.247420.xyz` → **Schwepe's Funky Universe** (Fredoka sans-serif, animated gradients) ✅
- `schwepe.247240.xyz` → **Schwepe's Funky Universe** (same as schwepe.247420.xyz)
- Exact domain matching in server.cjs line 38 prevents cross-domain design confusion
- Original Schwepe design restored from git history with cornermen assets

## Technical Architecture
- Runtime: Node.js 20 Alpine
- Build System: Custom multi-site builder
- Sites: 247420, schwepe
- Server: Express.js with static file serving and domain-based routing
- Container: Docker with nixpacks build

## Recent Changes (Nov 4, 2025)
- Fixed domain routing: Changed from `domain.startsWith('schwepe.')` to exact matches
- Restored original Schwepe design (Schwepe's Funky Universe) with Fredoka font and animated backgrounds
- Reinstated cornermen assets in gallery templates
- Deployment successful via Coolify
- Both domains verified serving completely distinct designs
- 247420: Dark monospace "Stoner Den" aesthetic
- Schwepe: Light sans-serif "Funky Universe" with animated gradients
