#!/bin/bash
# Quick test script for Reddit bot

echo "🤖 Reddit Bot Quick Test"
echo ""

# Check if credentials are set
if [ -z "$REDDIT_USERNAME" ] || [ -z "$REDDIT_PASSWORD" ]; then
  echo "⚠️  Reddit credentials not set!"
  echo ""
  echo "Set them with:"
  echo "  export REDDIT_USERNAME='your_username'"
  echo "  export REDDIT_PASSWORD='your_password'"
  echo ""
  read -p "Or enter them now - Username: " REDDIT_USERNAME
  read -sp "Password: " REDDIT_PASSWORD
  echo ""
  export REDDIT_USERNAME
  export REDDIT_PASSWORD
fi

echo "✅ Credentials set"
echo ""
echo "Choose an option:"
echo "  1) Test login only (opens browser, logs in)"
echo "  2) Dry run - find posts & generate comments (NO POSTING)"
echo "  3) Post 3 real comments (BE CAREFUL)"
echo ""
read -p "Enter choice [1-3]: " choice

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
    echo "⚠️  LIVE MODE - This will actually post comments!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      node scripts/reddit-auto-comment.js --count=3
    else
      echo "Cancelled"
    fi
    ;;
  *)
    echo "Invalid choice"
    ;;
esac
