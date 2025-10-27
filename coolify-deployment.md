# Coolify Deployment Instructions

## 🚀 Quick Setup
Use these settings in Coolify Admin (https://coolify.247420.xyz):

### Build Configuration
- **Dockerfile**: `Dockerfile.coolify` (NOT Dockerfile)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: 3000
- **Health Check**: GET http://localhost:3000

### Environment Variables
- `NODE_ENV=production`
- `PORT=3000`

## 📁 Required Files (All Present)
✅ `.env.example` - Environment template  
✅ `docker-compose.template.yml` - Docker compose config  
✅ `Dockerfile.coolify` - Production-ready Dockerfile  
✅ `package.json` - Node.js configuration  

## 🔧 Key Features of Dockerfile.coolify
- **Non-root user**: Runs as `nextjs` user (UID 1001)
- **Multi-stage build**: Smaller production image
- **Proper permissions**: All files owned by non-root user
- **Health check**: Built-in monitoring
- **Security**: No root access in production

## 🛠️ Why This Fixes Permission Issues
- Current `Dockerfile` runs as root → Coolify can't write config files
- `Dockerfile.coolify` runs as non-root → Coolify can write files properly
- Proper file ownership prevents "permission denied" errors

## 🌐 Deployment URLs
- **Main URL**: https://schwepe.247420.xyz
- **Actual URL**: https://c0s8g4k00oss8kkcoccs88g0.247420.xyz
- **Coolify Admin**: https://coolify.247420.xyz

## 📋 Deployment Steps
1. In Coolify: Change Dockerfile to `Dockerfile.coolify`
2. Set build/start commands as above
3. Add environment variables
4. Enable health check
5. Deploy

## ✅ Expected Result
- No permission errors
- Successful build and deployment
- Health check passes
- URLs accessible (200 status)