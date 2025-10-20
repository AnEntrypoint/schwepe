#!/bin/bash

# Check deployment status and provide information
# Usage: ./scripts/check-deployment.sh [verbose]

echo "🌐 Deployment Status Check"
echo "========================="

# Get current commit info
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "Current Commit: $CURRENT_COMMIT"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current Branch: $CURRENT_BRANCH"

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  Warning: You have uncommitted changes"
else
    echo "✅ Working directory is clean"
fi

# Show recent commits affecting CI/CD
echo ""
echo "📋 Recent CI/CD Related Commits:"
git log --oneline --since="1 day ago" --grep="build\|deploy\|nixpacks\|CI\|CD" || echo "No CI/CD commits in last 24h"

# Check build output
echo ""
echo "📁 Build Status:"
if [ -d "dist" ]; then
    echo "✅ dist/ directory exists"
    echo "   Size: $(du -sh dist/ | cut -f1)"
    echo "   Files: $(find dist -type f | wc -l)"
    echo "   Last modified: $(stat -c %y dist/)"
else
    echo "❌ dist/ directory missing"
fi

# Production URL
echo ""
echo "🌍 Production URL:"
echo "- Production: https://schwepe.247420.xyz/"

# Server test
echo ""
echo "🔧 Server Test:"
if command -v curl &> /dev/null; then
    if curl -s -f "https://schwepe.247420.xyz/" > /dev/null; then
        echo "✅ Production URL is responding"
    else
        echo "❌ Production URL is not responding"
    fi
else
    echo "❓ curl not available - cannot test URLs"
fi

if [ "$1" = "verbose" ]; then
    echo ""
    echo "📊 Detailed Build Information:"
    if [ -f "static/build-manifest.json" ]; then
        echo "Build Manifest:"
        cat static/build-manifest.json | jq . 2>/dev/null || cat static/build-manifest.json
    fi

    echo ""
    echo "🔍 Git Status:"
    git status
fi