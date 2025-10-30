#!/bin/bash
echo "🔍 Verifying build..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ dist directory not found"
  exit 1
fi

# Check if multi-site build output exists
if [ ! -d "dist/247420" ] || [ ! -d "dist/schwepe" ]; then
  echo "❌ Multi-site build directories not found"
  exit 1
fi

# Check for index.html files in each site
if [ ! -f "dist/247420/index.html" ] || [ ! -f "dist/schwepe/index.html" ]; then
  echo "❌ Site index.html files not found"
  exit 1
fi

# Check for static assets
if [ ! -d "dist/static" ]; then
  echo "❌ Static assets directory not found"
  exit 1
fi

echo "✅ Multi-site build verification successful"
exit 0
