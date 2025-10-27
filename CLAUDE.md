# CLAUDE.md - Final Technical Documentation

## DEPLOYMENT STATUS: 🟡 BLOCKED BY COOLIFY INFRASTRUCTURE

### Application Status: ✅ READY
- Multi-site Node.js application fully functional
- Builds successfully with npm run build:multi-site
- Server starts correctly with npm start
- Health endpoint /api/health working
- All ES module compatibility issues resolved

### Deployment Status: ❌ COOLIFY PERMISSIONS
- Coolify cannot write .env files (Permission denied)
- Coolify cannot write docker-compose.yaml (Permission denied)
- This is a Coolify server configuration issue
- NOT an application code problem

### Technical Architecture
- Runtime: Node.js 20 Alpine
- Build System: Custom multi-site builder
- Sites: 247420, schwepe
- Health Check: /api/health (30s timeout)
- Server: Express.js with static file serving

### Fixed Issues
1. ES Module Compatibility: Converted to CommonJS where needed
2. Build Process: Multi-site builder implementation
3. Docker Configuration: Proper user permissions
4. Health Checks: Correct endpoint configuration
5. CI/CD Pipeline: GitHub Actions with proper validation

### Deployment Logs Analysis
```
tee: /data/coolify/applications/[uuid]/.env: Permission denied
tee: /data/coolify/applications/[uuid]/docker-compose.yaml: Permission denied
```
This indicates Coolify server cannot write to its own directories.

### Next Steps
1. Contact Coolify support about permission issues
2. Consider alternative deployment platforms
3. Manual deployment via Docker commands
4. VPS deployment as fallback option

### Verification Commands
- npm run build:multi-site ✅
- npm start ✅
- curl http://localhost:3000/api/health ✅
- ./scripts/verify-build.sh ✅
