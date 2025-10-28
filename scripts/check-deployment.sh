#!/bin/bash
echo "🔍 Checking deployment..."

VERBOSE="$1"
URL="https://schwepe.247420.xyz"
ACTUAL_URL="https://c0s8g4k00oss8kkcoccs88g0.247420.xyz"

check_url() {
  local url="$1"
  local name="$2"
  
  if [ "$VERBOSE" = "verbose" ]; then
    echo "Checking $name: $url"
  fi
  
  if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
    echo "✅ $name is accessible"
    return 0
  else
    echo "❌ $name is not accessible"
    return 1
  fi
}

# Check main domain
if ! check_url "$URL" "Main domain"; then
  echo "❌ Main domain check failed"
  exit 1
fi

# Check actual deployment URL
if ! check_url "$ACTUAL_URL" "Actual deployment"; then
  echo "❌ Actual deployment check failed"
  exit 1
fi

echo "✅ Deployment verification successful"
exit 0
