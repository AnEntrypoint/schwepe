#!/bin/bash

# Enhanced deployment script with CI/CD integration
# Usage: ./scripts/deploy.sh [skip-build]

set -e

echo "🚀 Starting enhanced deployment process..."

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "⚠️  Warning: Not on main/master branch ($CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "Please commit or stash changes before deploying"
    git status --short
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Build unless skipped
if [ "$1" != "skip-build" ]; then
    echo "🔨 Building application..."
    chmod +x scripts/verify-build.sh
    ./scripts/verify-build.sh
else
    echo "⏭️  Skipping build step"
fi

# Deploy to Coolify
echo "🚀 Deploying to Coolify..."
npx --package=setdomain-coolify-deployer@latest setdomain-coolify coolify.247420.xyz schwepe.247420.xyz

# Wait for deployment
echo "⏳ Waiting for deployment to propagate (3 minutes)..."
sleep 180

# Verify deployment
echo "🔍 Verifying deployment..."
chmod +x scripts/check-deployment.sh
./scripts/check-deployment.sh verbose

echo "✅ Deployment process completed!"
