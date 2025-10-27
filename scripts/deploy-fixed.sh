#!/bin/bash

# Fixed deployment script with permission handling
set -e

echo "🚀 Starting fixed deployment process..."

# Ensure build is working
echo "🔨 Building application..."
npm run build

# Check build output
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Deploy with timeout and retry
echo "🚀 Deploying to Coolify with permission fixes..."
MAX_RETRIES=3
RETRY_DELAY=30

for i in $(seq 1 $MAX_RETRIES); do
    echo "📍 Attempt $i of $MAX_RETRIES..."
    
    if npx --package=setdomain-coolify-deployer@latest setdomain-coolify coolify.247420.xyz schwepe.247420.xyz; then
        echo "✅ Deployment command executed successfully"
        break
    else
        echo "⚠️  Deployment attempt $i failed"
        if [ $i -lt $MAX_RETRIES ]; then
            echo "⏳ Waiting $RETRY_DELAY seconds before retry..."
            sleep $RETRY_DELAY
        else
            echo "❌ All deployment attempts failed"
            exit 1
        fi
    fi
done

echo "⏳ Waiting 3 minutes for deployment to propagate..."
sleep 180

echo "🔍 Verifying deployment..."
if command -v curl &> /dev/null; then
    if curl -s -f "https://schwepe.247420.xyz/api/health" > /dev/null; then
        echo "✅ Deployment successful - health endpoint responding"
    else
        echo "⚠️  Health endpoint not responding, checking root..."
        if curl -s -f "https://schwepe.247420.xyz/" > /dev/null; then
            echo "✅ Deployment successful - root endpoint responding"
        else
            echo "❌ Deployment verification failed"
            exit 1
        fi
    fi
else
    echo "❓ curl not available - skipping verification"
fi

echo "✅ Deployment process completed!"
