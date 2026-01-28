#!/bin/bash

# Test Newsletter Notification System
# This script tests the instant notification feature for new newsletter subscribers

set -e

PORT=${PORT:-3001}
API_URL="http://localhost:$PORT"

echo "🧪 Testing Newsletter Notification System"
echo "=========================================="
echo ""

# Generate a unique test email
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-${TIMESTAMP}@example.com"
TEST_NAME="Test User ${TIMESTAMP}"
TEST_SOURCE="automated-test"

echo "📧 Subscribing test user..."
echo "   Email: $TEST_EMAIL"
echo "   Name: $TEST_NAME"
echo "   Source: $TEST_SOURCE"
echo ""

# Subscribe
RESPONSE=$(curl -s -X POST "$API_URL/api/newsletter/subscribe" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"name\":\"$TEST_NAME\",\"source\":\"$TEST_SOURCE\"}")

echo "✅ Response:"
echo "$RESPONSE" | python3 -m json.tool
echo ""

echo "⏳ Waiting 2 seconds for notifications to process..."
sleep 2
echo ""

echo "📊 Fetching recent subscribers..."
curl -s "$API_URL/api/newsletter/admin/subscribers?limit=3" | python3 -m json.tool
echo ""

echo "=========================================="
echo "✅ Test Complete!"
echo ""
echo "Check the following for notifications:"
echo "  1. ✅ Console log: Look for '📧 NEW SUBSCRIBER' in server logs"
echo "  2. ✅ Email: Check carmarsyd@icloud.com inbox"
echo "  3. ⚠️  Telegram: Check your Telegram admin chat"
echo ""
