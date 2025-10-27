#!/bin/bash

# Deployment Permission Fix Script
echo "🚀 Fixing deployment permissions..."

# Create required directories with proper permissions
sudo mkdir -p /data/coolify/applications/c0s8g4k00oss8kkcoccs88g0
sudo chown -R node:node /data/coolify/applications/c0s8g4k00oss8kkcoccs88g0
sudo chmod -R 755 /data/coolify/applications/c0s8g4k00oss8kkcoccs88g0

# Fix any existing permission issues
sudo find /data/coolify/applications/c0s8g4k00oss8kkcoccs88g0 -type d -exec chmod 755 {} \;
sudo find /data/coolify/applications/c0s8g4k00oss8kkcoccs88g0 -type f -exec chmod 644 {} \;

echo "✅ Permissions fixed successfully"