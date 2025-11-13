# Deployment Troubleshooting Guide

## Current Status: ⚠️ COOLIFY REBUILD REQUIRED

### Problem
The Schwelevision TV on schwepe.247420.xyz is broken because critical JavaScript modules are not being served correctly.

### Symptoms
- Videos-thread.html page loads but videos don't play
- Console error: "Unexpected end of input"
- `playback-handler.js` returns HTML (homepage) instead of JavaScript
- `tv-scheduler.js` returns HTML (homepage) instead of JavaScript
- `window.playback` and `window.tv` are undefined

### Diagnosis Complete ✅
All code is correct and tested locally. The issue is that **Coolify has not rebuilt the Docker container since November 4th despite multiple git pushes**.

Evidence:
```bash
# Check current deployment timestamp
curl -I https://schwepe.247420.xyz/ | grep last-modified
# Returns: last-modified: Tue, 04 Nov 2025 19:11:27 GMT

# Check etag (should change with new builds)
curl -I https://schwepe.247420.xyz/ | grep etag
# Returns: etag: W/"24eb-19a5047ff7f" (unchanged since Nov 4)
```

### Local Testing (Everything Works)
```bash
# Build locally
npm run build
# Output shows: ✓ Copied playback-handler.js

# Start local server
NODE_ENV=development PORT=3000 node server.cjs

# Test files are served correctly
curl http://localhost:3000/playback-handler.js | head -5
# Returns: export class PlaybackHandler {

# Verify MIME type
curl -I http://localhost:3000/playback-handler.js | grep content-type
# Returns: content-type: application/javascript
```

### What We've Tried (8+ commits)
1. ✅ Fixed Dockerfile build command
2. ✅ Added detailed build logging
3. ✅ Removed problematic eval file
4. ✅ Updated build timestamp in Dockerfile
5. ✅ Multiple deploy timestamp commits
6. ✅ Documentation updates
7. ✅ Verified all files push to GitHub

### Required Action: MANUAL COOLIFY INTERVENTION

#### Step 1: Access Coolify Dashboard
1. Log into Coolify dashboard
2. Navigate to the schwepe project/application

#### Step 2: Check Webhook Status
1. Go to Source settings
2. Verify GitHub webhook is configured and active
3. Check webhook delivery logs for failures
4. If webhook is broken: Regenerate webhook URL and update in GitHub

#### Step 3: Manual Rebuild
1. Click "Deploy" or "Rebuild" button
2. Watch build logs for these lines:
   ```
   Building site: schwepe
   ✓ Copied schwelevision.js
   ✓ Copied playback-handler.js
   ✓ Copied tv-scheduler.js
   ✓ Copied navbar.js
   ✓ Copied navbar.html
   ✓ Copied navbar.css
   ✓ Copied lib/ directory
   ```

#### Step 4: Verify Deployment
After build completes, run these tests:

```bash
# Test 1: Check deployment timestamp updated
curl -I https://schwepe.247420.xyz/ | grep last-modified
# Should show today's date

# Test 2: Verify playback-handler.js serves correctly
curl https://schwepe.247420.xyz/playback-handler.js | head -5
# Should return: export class PlaybackHandler {

# Test 3: Check MIME type
curl -I https://schwepe.247420.xyz/playback-handler.js | grep content-type
# Should return: content-type: application/javascript

# Test 4: Verify tv-scheduler.js
curl https://schwepe.247420.xyz/tv-scheduler.js | head -5
# Should return: export class TVScheduler {
```

#### Step 5: Test Live TV
1. Navigate to https://schwepe.247420.xyz/videos-thread.html
2. Open browser console (F12)
3. Should see:
   ```
   Request for host: schwepe.247420.xyz
   Serving site: schwepe
   Three-layer playback initialized
   Synchronized playback: Starting at index X (global sync)
   Playing [saved|scheduled]: [video name]
   ```
4. Videos should start playing automatically
5. "NOW PLAYING" display should show current video

### Alternative: Check GitHub Webhook

#### Option A: GitHub Settings
1. Go to https://github.com/AnEntrypoint/schwepe/settings/hooks
2. Find Coolify webhook
3. Check "Recent Deliveries"
4. Look for failed deliveries or errors

#### Option B: Webhook Debug
If webhook is failing:
1. Note the webhook URL from GitHub
2. In Coolify, go to Settings → Webhooks
3. Regenerate webhook secret
4. Update in GitHub repository settings
5. Test webhook delivery

### Expected Build Logs

Successful build should show:
```
Building all sites...
✓ Copied public directory
✓ Copied static directory
✓ Copied package-lock.json
Building site: 247420
  Rendering index.html
  ...
  ⚠ Skipped schwelevision.js (not found) <- Expected for 247420 site
✓ Built 247420
Building site: schwepe
  Rendering index.html
  Rendering videos-thread.html
  ✓ Copied schwelevision.js          <- MUST see this
  ✓ Copied playback-handler.js       <- MUST see this
  ✓ Copied tv-scheduler.js           <- MUST see this
  ✓ Copied navbar.js
  ✓ Copied navbar.html
  ✓ Copied navbar.css
  ✓ Copied lib/ directory
✓ Built schwepe
✓ All sites built successfully
```

### Key Files to Verify Exist After Build

In the Docker container at `/app/dist/schwepe/`:
- `playback-handler.js` (10KB, 303 lines)
- `tv-scheduler.js` (1.2KB, 48 lines)
- `schwelevision.js` (2.3KB)
- `lib/` directory with 13 modules

### Contact Info
If issues persist after manual rebuild:
- Check Docker logs for build errors
- Verify Node.js version is 20-alpine
- Ensure `npm run build` command runs during build
- Check file permissions in container
