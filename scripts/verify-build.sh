#!/bin/bash
echo "🔍 Verifying build..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ dist directory not found"
  exit 1
fi

# Check if build output exists
if [ ! -f "dist/index.html" ] && [ ! -f "dist/server.cjs" ]; then
  echo "❌ No build output found"
  exit 1
fi

# Check package.json build script
if ! npm run build:multi-site; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build verification successful"
exit 0
