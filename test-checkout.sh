#!/bin/bash

echo "🧪 Testing Toolkit Checkout Endpoint"
echo "====================================="
echo ""

API_URL="http://localhost:4003/api/checkout/create-session"
MONTHLY_PRICE="price_1Sy1BjCaz620S5FSO8c5KhF9"
YEARLY_PRICE="price_1Sy1BjCaz620S5FSDGlVkwJ4"

echo "1️⃣ Testing monthly plan checkout..."
RESPONSE=$(curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"priceId\": \"$MONTHLY_PRICE\",
    \"successUrl\": \"http://localhost:4003/toolkit.html?success=true\",
    \"cancelUrl\": \"http://localhost:4003/toolkit.html?canceled=true\"
  }")

if echo "$RESPONSE" | grep -q "sessionId"; then
  echo "✅ Monthly checkout: SUCCESS"
  echo "$RESPONSE" | grep -o '"url":"[^"]*"' | head -1
else
  echo "❌ Monthly checkout: FAILED"
  echo "$RESPONSE"
fi

echo ""
echo "2️⃣ Testing yearly plan checkout..."
RESPONSE=$(curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"priceId\": \"$YEARLY_PRICE\",
    \"successUrl\": \"http://localhost:4003/toolkit.html?success=true\",
    \"cancelUrl\": \"http://localhost:4003/toolkit.html?canceled=true\"
  }")

if echo "$RESPONSE" | grep -q "sessionId"; then
  echo "✅ Yearly checkout: SUCCESS"
  echo "$RESPONSE" | grep -o '"url":"[^"]*"' | head -1
else
  echo "❌ Yearly checkout: FAILED"
  echo "$RESPONSE"
fi

echo ""
echo "3️⃣ Testing invalid price ID..."
RESPONSE=$(curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"priceId\": \"invalid_price_id\",
    \"successUrl\": \"http://localhost:4003/toolkit.html?success=true\",
    \"cancelUrl\": \"http://localhost:4003/toolkit.html?canceled=true\"
  }")

if echo "$RESPONSE" | grep -q "error"; then
  echo "✅ Invalid price ID properly rejected"
else
  echo "❌ Should have rejected invalid price ID"
fi

echo ""
echo "====================================="
echo "✨ Test complete!"
