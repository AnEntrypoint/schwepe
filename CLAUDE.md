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

## Domain Routing (✅ VERIFIED LIVE)
- `247420.xyz` → serves **247420** design ✅
- `schwepe.247420.xyz` → serves **schwepe** design ✅
- `schwepe.247240.xyz` → serves **schwepe** design
- Exact domain matching in server.cjs line 38 prevents cross-domain design confusion

## Technical Architecture
- Runtime: Node.js 20 Alpine
- Build System: Custom multi-site builder
- Sites: 247420, schwepe
- Server: Express.js with static file serving and domain-based routing
- Container: Docker with nixpacks build

## Recent Changes
- Fixed domain routing: Changed from `domain.startsWith('schwepe.')` to exact matches
- Deployment successful via Coolify
- Both domains verified serving correct designs
