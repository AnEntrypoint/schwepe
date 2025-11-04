# CLAUDE.md - Technical Architecture

## Application Status: ✅ READY
- Multi-site Node.js application fully functional
- Builds successfully with npm run build:multi-site
- Server starts correctly with npm start
- Health endpoint /api/health working
- Domain-based routing working correctly

## Domain Routing
- `247420.xyz` → serves 247420 design
- `schwepe.247420.xyz` → serves schwepe design
- `schwepe.247240.xyz` → serves schwepe design
- Exact domain matching prevents cross-domain design confusion

## Technical Architecture
- Runtime: Node.js 20 Alpine
- Build System: Custom multi-site builder
- Sites: 247420, schwepe
- Health Check: /api/health (30s timeout)
- Server: Express.js with static file serving and domain-based routing

## Verification Commands
- npm run build:multi-site ✅
- npm start ✅
- curl http://localhost:3000/api/health ✅
