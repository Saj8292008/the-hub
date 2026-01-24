#!/bin/bash

# Railway CLI Deployment Script
# Run these commands one by one

echo "🚂 Railway Deployment - Step by Step"
echo "======================================"
echo ""

echo "Step 1: Login to Railway (opens browser)"
npx railway login
echo ""

echo "Step 2: Initialize new Railway project"
npx railway init
echo ""

echo "Step 3: Add environment variables"
npx railway variables set \
  TELEGRAM_BOT_TOKEN="8310191561:AAExxS9nt4a2VsUz0W75CG1H_4C0iDG-9UM" \
  TELEGRAM_ADMIN_CHAT_ID="8427035818" \
  SCRAPERAPI_KEY="c53a3b6bced75cf230ef7574feea5858" \
  APIFY_TOKEN="apify_api_G1UEBZ6UT7XXhLxPRN8f7oMcnS8ZuD1vGz0C" \
  USE_REAL_SCRAPERS="false" \
  POLL_SCHEDULE="0 * * * *" \
  RUN_ON_START="false" \
  SEND_UPDATE_SUMMARY="false" \
  SCRAPER_MIN_TIME_CHRONO24="3000" \
  SCRAPER_MIN_TIME_AUTOTRADER="2000" \
  SCRAPER_MIN_TIME_STOCKX="4000" \
  LOG_LEVEL="info" \
  NODE_ENV="production" \
  DEBUG_SCREENSHOTS="false" \
  DEBUG_HTML="false" \
  PORT="3000"
echo ""

echo "Step 4: Deploy to Railway!"
npx railway up
echo ""

echo "Step 5: Generate public domain"
npx railway domain
echo ""

echo "✅ Deployment complete!"
echo "Run 'npx railway logs' to view logs"
echo "Run 'npx railway open' to open dashboard"
