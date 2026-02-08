#!/bin/bash
# Quick launch script with credentials

cd /Users/sydneyjackson/the-hub

# Load .env if it exists
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

# Set username
export REDDIT_USERNAME="russelwilson572@gmail.com"

# Prompt for password if not set
if [ -z "$REDDIT_PASSWORD" ]; then
  echo "🔑 Enter your Reddit password:"
  read -s REDDIT_PASSWORD
  export REDDIT_PASSWORD
  echo ""
fi

echo "✅ Credentials loaded"
echo ""
echo "Choose mode:"
echo "  1) Test login (opens browser, logs in)"
echo "  2) Dry run - generate 5 comments (NO POSTING)"
echo "  3) Post 3 real comments"
echo ""
read -p "Choice [1-3]: " choice

case $choice in
  1)
    echo "🚀 Testing login..."
    node scripts/reddit-bot.js
    ;;
  2)
    echo "🧪 Dry run mode..."
    node scripts/reddit-auto-comment.js --dry-run --count=5
    ;;
  3)
    echo "⚠️  LIVE MODE - will post real comments!"
    read -p "Confirm? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      node scripts/reddit-auto-comment.js --count=3
    else
      echo "Cancelled"
    fi
    ;;
  *)
    echo "Invalid"
    ;;
esac
