#!/bin/bash
# Test newsletter subscribe endpoint

echo "Testing Newsletter Subscribe API..."
echo "=================================="
echo ""

curl -X POST http://localhost:3001/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -d '{
    "email": "carmarsyd@icloud.com",
    "source": "manual-test"
  }' \
  --silent | python3 -m json.tool

echo ""
echo "=================================="
echo "Test complete!"
