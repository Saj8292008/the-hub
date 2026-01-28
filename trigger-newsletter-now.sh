#!/bin/bash
# Manually trigger newsletter send NOW

echo "🚀 Triggering newsletter send manually..."
echo "=========================================="
echo ""

curl -X POST http://localhost:3001/api/newsletter/scheduler/run-now \
  -H "Content-Type: application/json" \
  --silent | python3 -m json.tool

echo ""
echo "=========================================="
echo "Newsletter triggered! Check server logs for progress"
echo ""
echo "Monitor with:"
echo "tail -f /private/tmp/claude/-Users-sydneyjackson-the-hub/tasks/b790848.output | grep newsletter"
