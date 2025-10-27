#!/bin/bash

# CI/CD Build Verification Script
# Tests the build process in a clean environment similar to Nixpacks

set -e

echo "🔍 Starting CI/CD build verification..."

# Clean any existing artifacts
echo "🧹 Cleaning existing artifacts..."
rm -rf dist/ node_modules/.cache

# Set production environment variables
export NODE_ENV=production
export NPM_CONFIG_LOGLEVEL=warn
export NPM_CONFIG_PRODUCTION=false
export PORT=3000

# Run the exact build process that CI/CD would use
echo "🚀 Running production build (multi-site)..."
npm run build

# Verify the build output
echo "✅ Verifying build output..."
if [ ! -d "dist" ]; then
    echo "❌ ERROR: dist directory not found"
    exit 1
fi

# Check for critical files - now we expect multi-site structure
CRITICAL_FILES=("dist/247420/index.html" "dist/schwepe/index.html" "server.cjs")
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ ERROR: Critical file missing: $file"
        exit 1
    fi
done

# Test server startup (dry run)
echo "🔧 Testing server configuration..."
timeout 10s npm run start &
SERVER_PID=$!
sleep 2

# Check if server started successfully
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server startup successful"
    kill $SERVER_PID 2>/dev/null || true
else
    echo "❌ ERROR: Server failed to start"
    exit 1
fi

# Check file sizes for reasonableness
echo "📊 Checking build output sizes..."
INDEX_SIZE=$(stat -c%s "dist/247420/index.html" 2>/dev/null || echo 0)
if [ "$INDEX_SIZE" -lt 1000 ]; then
    echo "❌ ERROR: index.html seems too small ($INDEX_SIZE bytes)"
    exit 1
fi

echo "✅ All CI/CD verification checks passed!"
echo "🎉 Build is ready for deployment"

# Show build summary
echo ""
echo "📋 Build Summary:"
echo "- Environment: $NODE_ENV"
echo "- Sites built: $(find dist -maxdepth 1 -type d | grep -v '^dist$' | wc -l)"
echo "- Total files: $(find dist -type f | wc -l)"
echo "- Dist size: $(du -sh dist/ | cut -f1)"
