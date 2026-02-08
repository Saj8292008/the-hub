#!/bin/bash
# Launch The Hub Empire AI - Autonomous Agent System

echo "🏰 Launching The Hub Empire AI..."
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 not found. Installing..."
    npm install -g pm2
fi

cd "$(dirname "$0")/../.."

# Start Empire AI with PM2
pm2 start scripts/agents/empire-ai.js \
    --name "empire-ai" \
    --time \
    --log-date-format "YYYY-MM-DD HH:mm:ss" \
    --output logs/empire-out.log \
    --error logs/empire-error.log

# Save PM2 config
pm2 save

echo ""
echo "✅ Empire AI launched!"
echo ""
echo "📊 Monitor with:"
echo "   pm2 status"
echo "   pm2 logs empire-ai"
echo ""
echo "🛑 Stop with:"
echo "   pm2 stop empire-ai"
echo ""
echo "🔄 Restart with:"
echo "   pm2 restart empire-ai"
echo ""
echo "🏰 The Hub is now autonomous! 🚀"
