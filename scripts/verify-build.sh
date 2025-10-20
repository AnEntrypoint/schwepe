    1→#!/bin/bash
    2→
    3→# CI/CD Build Verification Script
    4→# Tests the build process in a clean environment similar to Nixpacks
    5→
    6→set -e
    7→
    8→echo "🔍 Starting CI/CD build verification..."
    9→
   10→# Clean any existing artifacts
   11→echo "🧹 Cleaning existing artifacts..."
   12→rm -rf dist/ node_modules/.cache
   13→
   14→# Set production environment variables
   15→export NODE_ENV=production
   16→export NPM_CONFIG_LOGLEVEL=warn
   17→export NPM_CONFIG_PRODUCTION=false
   18→export PORT=3000
   19→
   20→# Run the exact build process that CI/CD would use
   21→echo "🚀 Running production build..."
   22→npm run build
   23→
   24→# Verify the build output
   25→echo "✅ Verifying build output..."
   26→if [ ! -d "dist" ]; then
   27→    echo "❌ ERROR: dist directory not found"
   28→    exit 1
   29→fi
   30→
   31→# Check for critical files
   32→CRITICAL_FILES=("dist/index.html" "dist/videos-thread.html" "dist/lore.html" "dist/gallery.html" "server.js")
   33→for file in "${CRITICAL_FILES[@]}"; do
   34→    if [ ! -f "$file" ]; then
   35→        echo "❌ ERROR: Critical file missing: $file"
   36→        exit 1
   37→    fi
   38→done
   39→
   40→# Verify static assets were copied
   41→echo "📁 Verifying static assets..."
   42→STATIC_DIRS=("dist/schwepe" "dist/
   43→for dir in "${STATIC_DIRS[@]}"; do
   44→    if [ ! -d "$dir" ]; then
   45→        echo "❌ ERROR: Static directory missing: $dir"
   46→        exit 1
   47→    fi
   48→done
   49→
   50→# Test server startup (dry run)
   51→echo "🔧 Testing server configuration..."
   52→timeout 10s npm run start &
   53→SERVER_PID=$!
   54→sleep 2
   55→
   56→# Check if server started successfully
   57→if ps -p $SERVER_PID > /dev/null; then
   58→    echo "✅ Server startup successful"
   59→    kill $SERVER_PID 2>/dev/null || true
   60→else
   61→    echo "❌ ERROR: Server failed to start"
   62→    exit 1
   63→fi
   64→
   65→# Check file sizes for reasonableness
   66→echo "📊 Checking build output sizes..."
   67→INDEX_SIZE=$(stat -c%s "dist/index.html" 2>/dev/null || echo 0)
   68→if [ "$INDEX_SIZE" -lt 1000 ]; then
   69→    echo "❌ ERROR: index.html seems too small ($INDEX_SIZE bytes)"
   70→    exit 1
   71→fi
   72→
   73→echo "✅ All CI/CD verification checks passed!"
   74→echo "🎉 Build is ready for deployment"
   75→
   76→# Show build summary
   77→echo ""
   78→echo "📋 Build Summary:"
   79→echo "- Environment: $NODE_ENV"
   80→echo "- Dist size: $(du -sh dist/ | cut -f1)"
   81→echo "- Main files: $(find dist -name "*.html" | wc -l) HTML files"
   82→echo "- Assets: $(find dist -type f | wc -l) total files"