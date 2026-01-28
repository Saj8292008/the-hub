#!/bin/bash

# Newsletter Database Migration Script
# This script helps run the newsletter system database migration

set -e

echo "🗄️  Newsletter System Database Migration"
echo "========================================"
echo ""

# Check if migration file exists
MIGRATION_FILE="supabase/migrations/20260126000000_newsletter_system.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found at $MIGRATION_FILE"
  exit 1
fi

echo "✅ Migration file found"
echo ""
echo "📋 Migration will create the following tables:"
echo "   • newsletter_campaigns (campaigns and drafts)"
echo "   • newsletter_sends (individual email send log)"
echo "   • newsletter_events (opens, clicks, unsubscribes)"
echo "   • newsletter_settings (system configuration)"
echo "   • Enhanced blog_subscribers (with newsletter fields)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To run this migration:"
echo ""
echo "1. Go to Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/sysvawxchniqelifyenl"
echo ""
echo "2. Click 'SQL Editor' in the left sidebar"
echo ""
echo "3. Click 'New Query'"
echo ""
echo "4. Copy the SQL below and paste it into the editor:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Display the migration file
cat "$MIGRATION_FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "5. Click 'Run' (or press Cmd/Ctrl + Enter)"
echo ""
echo "After running the migration, you can test the newsletter system!"
echo ""
