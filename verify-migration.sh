#!/bin/bash
# Verify database migration completed successfully

echo "🔍 Verifying database migration..."
echo "=================================="
echo ""

# Test 1: Check if columns exist by trying to subscribe
echo "Test 1: Attempting newsletter subscription..."
response=$(curl -X POST http://localhost:3001/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{
    "email": "test-migration@example.com",
    "source": "migration-test"
  }' \
  --silent)

echo "$response" | python3 -m json.tool
echo ""

# Check if successful
if echo "$response" | grep -q '"success": true'; then
  echo "✅ SUCCESS! Database migration completed successfully!"
  echo "✅ All required columns are present"
  echo "✅ Newsletter signup API is working"
  echo ""
  echo "🎉 You're ready for 8AM newsletter send!"
  echo ""
  echo "📧 Test with real email: bash test-newsletter-subscribe.sh"
  exit 0
elif echo "$response" | grep -q "confirmation_token"; then
  echo "❌ FAILED! Migration not run yet"
  echo ""
  echo "⚠️  Still missing: confirmation_token column"
  echo ""
  echo "📋 Action required:"
  echo "1. Go to Supabase SQL Editor (should be open in browser)"
  echo "2. Copy SQL from: RUN_THIS_SQL.sql"
  echo "3. Paste and click RUN"
  echo "4. Run this script again: bash verify-migration.sh"
  exit 1
else
  echo "⚠️  Unexpected response:"
  echo "$response"
  echo ""
  echo "Check if backend is running: curl http://localhost:3001/api/health"
  exit 1
fi
