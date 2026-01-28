#!/bin/bash

echo "================================================"
echo "Telegram Bot Setup Verification"
echo "================================================"
echo ""
echo "Channel: @TheHubDeals"
echo "Bot: @TheHubDealBot"
echo "Token: 8432859549:AAGOHwCl_57vYMsbCqeeZQc7Z6CnbZNh_s0"
echo ""
echo "================================================"
echo "Step 1: Verify bot exists"
echo "================================================"

curl -s "https://api.telegram.org/bot8432859549:AAGOHwCl_57vYMsbCqeeZQc7Z6CnbZNh_s0/getMe" | python3 -m json.tool

echo ""
echo "================================================"
echo "Step 2: Verify channel exists"
echo "================================================"

curl -s "https://api.telegram.org/bot8432859549:AAGOHwCl_57vYMsbCqeeZQc7Z6CnbZNh_s0/getChat?chat_id=@TheHubDeals" | python3 -m json.tool

echo ""
echo "================================================"
echo "Step 3: Test posting to channel"
echo "================================================"

response=$(curl -s -X POST "https://api.telegram.org/bot8432859549:AAGOHwCl_57vYMsbCqeeZQc7Z6CnbZNh_s0/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "@TheHubDeals",
    "text": "✅ Bot test successful! The Hub is ready to post deals.",
    "parse_mode": "Markdown"
  }')

echo "$response" | python3 -m json.tool

if echo "$response" | grep -q '"ok":true'; then
  echo ""
  echo "✅ SUCCESS! Bot can post to channel!"
  echo "🔗 Check your channel: https://t.me/TheHubDeals"
  exit 0
else
  echo ""
  echo "❌ FAILED! Bot cannot post to channel."
  echo ""
  echo "⚠️  ACTION REQUIRED:"
  echo "1. Open Telegram and go to @TheHubDeals channel"
  echo "2. Click the channel name → Administrators"
  echo "3. Click 'Add Administrator'"
  echo "4. Search for '@TheHubDealBot' (include the @ symbol)"
  echo "5. Select the bot and enable 'Post Messages' permission"
  echo "6. Click 'Save'"
  echo "7. Wait 2 minutes, then run this script again:"
  echo "   bash verify-bot-setup.sh"
  echo ""
  echo "📖 For detailed instructions, see: TELEGRAM_BOT_SETUP.md"
  exit 1
fi
