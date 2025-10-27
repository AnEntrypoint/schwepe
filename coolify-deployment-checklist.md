# Coolify Deployment Checklist

## ✅ Pre-Deployment Requirements
- [ ] `.dockerignore` does NOT exclude `dist/` directory
- [ ] All files have correct ownership (user:user, not root:root)
- [ ] Build process completes successfully (`npm run build`)
- [ ] `dist/` directory exists and contains built assets
- [ ] `server.js` has `/api/health` endpoint
- [ ] Environment variables are properly configured

## 🐳 Docker Configuration
- [ ] `Dockerfile.coolify` is selected as the Dockerfile
- [ ] Port 3000 is exposed and configured
- [ ] Health check is configured for `/api/health`
- [ ] Non-root user is created and used (nextjs:1001)

## 🚀 Coolify Settings
- **Dockerfile**: `Dockerfile.coolify`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: 3000
- **Health Check**: GET http://localhost:3000/api/health

## 📝 Environment Variables
- `NODE_ENV=production`
- `PORT=3000`

## 🔍 Troubleshooting
- Check build logs for permission errors
- Verify `dist/` directory is copied into container
- Ensure health check endpoint returns 200 status
- Monitor container logs for runtime errors
