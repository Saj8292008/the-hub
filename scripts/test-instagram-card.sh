#!/bin/bash
# Quick test script for Instagram card generation

cd /Users/sydneyjackson/the-hub

echo "🧪 Testing Instagram Card Generator..."

# Test deal data
DEAL_JSON='{
  "title": "Rolex Submariner Date 41mm",
  "price": 8500,
  "original_price": 13000,
  "score": 18,
  "category": "watches",
  "source": "Chrono24"
}'

# Generate test card
node scripts/generate-deal-card.js "$DEAL_JSON" test-instagram-card.png

if [ -f "test-instagram-card.png" ]; then
  echo "✅ Success! Card generated: test-instagram-card.png"
  ls -lh test-instagram-card.png
  echo ""
  echo "Open it to see the result:"
  echo "open test-instagram-card.png"
else
  echo "❌ Failed to generate card"
  exit 1
fi
