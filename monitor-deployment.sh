#!/bin/bash
echo "🔍 Monitoring deployment progress..."
echo "Deployment URL: https://schwepe.247420.xyz"
echo "Started at: $(date)"
echo ""

# Monitor for up to 5 minutes
for i in {1..30}; do
  echo "--- Check $i/30 ---"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://schwepe.247420.xyz 2>/dev/null)
  TIMESTAMP=$(date '+%H:%M:%S')
  
  case $STATUS in
    200)
      echo "✅ [$TIMESTAMP] Deployment successful! (HTTP $STATUS)"
      echo "🌐 Site is live: https://schwepe.247420.xyz"
      exit 0
      ;;
    404)
      echo "⏳ [$TIMESTAMP] Deployment in progress (HTTP $STATUS - expected)"
      ;;
    503|502)
      echo "🔄 [$TIMESTAMP] Service starting up (HTTP $STATUS)"
      ;;
    000)
      echo "⚠️  [$TIMESTAMP] Connection failed - server starting"
      ;;
    *)
      echo "❓ [$TIMESTAMP] Unexpected status: HTTP $STATUS"
      ;;
  esac
  
  sleep 10
done

echo ""
echo "⏰ Monitoring complete - deployment may still be in progress"
echo "🌐 Check manually: https://schwepe.247420.xyz"
