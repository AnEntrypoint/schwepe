#!/bin/bash

# Enhanced Deployment Script with Better Error Handling
# Usage: ./scripts/deploy-enhanced.sh

set -e

echo "🚀 ENHANCED DEPLOYMENT PROCESS"
echo "=============================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Pre-deployment checks
print_status $YELLOW "🔍 Pre-deployment checks..."

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    print_status $RED "❌ Not on main/master branch ($CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status $RED "❌ Deployment cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    print_status $YELLOW "⚠️  You have uncommitted changes"
    git status --short
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status $RED "❌ Deployment cancelled"
        exit 1
    fi
fi

# Verify build works locally
print_status $YELLOW "🔨 Verifying local build..."
if ! ./scripts/verify-build.sh; then
    print_status $RED "❌ Local build verification failed"
    exit 1
fi

print_status $GREEN "✅ Local build verification passed"

# Deploy to Coolify
print_status $YELLOW "🚀 Deploying to Coolify..."
if npx --package=setdomain-coolify-deployer@latest setdomain-coolify coolify.247420.xyz schwepe.247420.xyz; then
    print_status $GREEN "✅ Deployment initiated successfully"
else
    print_status $RED "❌ Deployment failed"
    print_status $YELLOW "🔧 Check Coolify server permissions and configuration"
    exit 1
fi

# Wait for deployment with progress indicator
print_status $YELLOW "⏳ Waiting for deployment to propagate..."
for i in {1..18}; do
    echo -n "."
    sleep 10
done
echo ""

# Verify deployment
print_status $YELLOW "🔍 Verifying deployment..."
if ./scripts/check-deployment.sh verbose; then
    print_status $GREEN "✅ Deployment verification passed"
else
    print_status $YELLOW "⚠️  Deployment verification shows issues"
    print_status $YELLOW "🔧 Check logs above and Coolify admin panel"
fi

# Test health endpoints
print_status $YELLOW "🏥 Testing health endpoints..."
health_urls=(
    "https://schwepe.247420.xyz/api/health"
    "https://c0s8g4k00oss8kkcoccs88g0.247420.xyz/api/health"
)

all_healthy=true
for url in "${health_urls[@]}"; do
    if curl -s -f "$url" > /dev/null; then
        print_status $GREEN "✅ $url - Healthy"
    else
        print_status $RED "❌ $url - Not responding"
        all_healthy=false
    fi
done

if $all_healthy; then
    print_status $GREEN "🎉 DEPLOYMENT SUCCESSFUL!"
    print_status $GREEN "✅ All health checks passed"
else
    print_status $YELLOW "⚠️  DEPLOYMENT COMPLETED WITH ISSUES"
    print_status $YELLOW "🔧 Some health checks failed - check Coolify logs"
fi

echo ""
print_status $YELLOW "🌐 URLs:"
echo "   Main: https://schwepe.247420.xyz"
echo "   Admin: https://coolify.247420.xyz"
