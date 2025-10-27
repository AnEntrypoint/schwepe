# SCHWEPE Technical Documentation

## Current Status (2025-06-20 15:34)

### Deployment Environment
- ✅ Clean deployment environment achieved
- ✅ Temporary deployment monitoring process terminated
- ✅ Deployment status files cleaned
- ✅ System ready for next deployment

### Coolify Deployment Status
- Application: schwepe.247420.xyz
- Coolify Admin: coolify.247420.xyz
- Status: Code ready, blocked by Coolify server permissions
- Issue: Coolify cannot write .env and docker-compose.yaml files
- Required: Server admin access to fix /data/coolify/applications/ permissions

### Technical Architecture
- Build system: Multi-site SSR optimized build
- Media generation: Dynamic phrase system with video processing
- Deployment: CI/CD with Coolify integration
- Monitoring: URL monitoring and health checks

### Recent Actions
- Cleaned up Alfred AI deployment monitoring processes
- Removed temporary deployment status files (.deployment-*.json)
- Verified system readiness for next deployment
- Maintained clean development environment per workflow requirements

## Project Structure
- Entry points: url-monitor.cjs, schwepe-tv-scheduler.js
- Core modules: build-multi-site.js, build-ssr-optimized.js, server.js
- Media processing: media-generator.js, phrase-system.js
- Deployment: deployment-monitor.js, coolify integration scripts
