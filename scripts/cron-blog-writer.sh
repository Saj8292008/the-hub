#!/bin/bash
# cron-blog-writer.sh — Daily blog post generation (cron-ready)

cd "$(dirname "$0")/.." || exit 1
export NODE_ENV=production

LOG_DIR="./logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/blog-cron-$(date +%Y-%m-%d).log"

echo "🚀 Starting Auto-SEO Blog Writer at $(date)" >> "$LOG_FILE"

node scripts/auto-blog-writer.js >> "$LOG_FILE" 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Blog generation failed" >> "$LOG_FILE"
  exit 1
fi

LATEST_MD=$(ls -t content/blog/*.md 2>/dev/null | head -n 1)

if [ -z "$LATEST_MD" ]; then
  echo "❌ No markdown file found" >> "$LOG_FILE"
  exit 1
fi

FILENAME=$(basename "$LATEST_MD")
echo "📄 Publishing: $FILENAME" >> "$LOG_FILE"

node scripts/publish-blog.js "$FILENAME" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Blog published successfully at $(date)" >> "$LOG_FILE"
else
  echo "❌ Publishing failed" >> "$LOG_FILE"
  exit 1
fi

echo "---" >> "$LOG_FILE"
