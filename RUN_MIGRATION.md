# How to Run Newsletter System Database Migration

## Issue
The automated migration script failed because Supabase doesn't have an `exec_sql()` RPC function. We need to run the SQL manually in the Supabase dashboard.

## Steps to Run Migration

### 1. Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project (the one with URL: `sysvawxchniqelifyenl.supabase.co`)

### 2. Open SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **New Query** button

### 3. Copy and Paste the Migration SQL

Copy the entire content from:
```
/Users/sydneyjackson/the-hub/database/migrations/create_newsletter_system.sql
```

Or copy this SQL directly:

```sql
-- =====================================================
-- Newsletter & Telegram Automation System
-- Migration: Create all tables and columns needed
-- =====================================================

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  source VARCHAR(50),
  confirmed BOOLEAN DEFAULT false,
  confirmation_token TEXT,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP,
  last_sent_at TIMESTAMP,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  CONSTRAINT chk_status CHECK (status IN ('active', 'unsubscribed', 'bounced'))
);

-- Email tracking table
CREATE TABLE IF NOT EXISTS email_sends (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  campaign_type VARCHAR(50),
  subject VARCHAR(255),
  sent_at TIMESTAMP DEFAULT NOW(),
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced BOOLEAN DEFAULT false,
  unsubscribed BOOLEAN DEFAULT false,

  CONSTRAINT chk_campaign_type CHECK (campaign_type IN ('daily', 'weekly', 'welcome', 'custom'))
);

-- Add Telegram integration columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100),
  ADD COLUMN IF NOT EXISTS telegram_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS telegram_preferences JSONB DEFAULT '{"categories": ["watches", "cars", "sneakers", "sports"], "min_score": 8.0, "max_price": null}'::jsonb;

-- Telegram channel posts tracking
CREATE TABLE IF NOT EXISTS telegram_posts (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER,
  deal_type VARCHAR(50),
  category VARCHAR(50),
  channel_id VARCHAR(100),
  message_id BIGINT,
  posted_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_deal_type CHECK (deal_type IN ('watch', 'car', 'sneaker', 'sports'))
);

-- Telegram user alerts tracking
CREATE TABLE IF NOT EXISTS telegram_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  deal_id INTEGER,
  deal_type VARCHAR(50),
  sent_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_deal_type_alert CHECK (deal_type IN ('watch', 'car', 'sneaker', 'sports'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmed ON newsletter_subscribers(confirmed);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_sends_subscriber ON email_sends(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_user ON email_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_chat_id ON users(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_telegram_posts_posted_at ON telegram_posts(posted_at);
CREATE INDEX IF NOT EXISTS idx_telegram_posts_deal ON telegram_posts(deal_id, deal_type);
CREATE INDEX IF NOT EXISTS idx_telegram_alerts_user ON telegram_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_alerts_sent_at ON telegram_alerts(sent_at);

-- Add comments
COMMENT ON TABLE newsletter_subscribers IS 'Email newsletter subscribers (separate from users table)';
COMMENT ON TABLE email_sends IS 'Tracks all emails sent for analytics and debugging';
COMMENT ON TABLE telegram_posts IS 'Tracks deals posted to public Telegram channel';
COMMENT ON TABLE telegram_alerts IS 'Tracks personalized Telegram alerts sent to users';

COMMENT ON COLUMN users.telegram_chat_id IS 'Telegram chat ID for sending personalized alerts';
COMMENT ON COLUMN users.telegram_preferences IS 'User preferences for Telegram alerts (categories, min_score, max_price)';
```

### 4. Run the Migration
1. Click the **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for completion - you should see success messages
3. If you see "already exists" errors, that's normal and means tables are already created

### 5. Verify Tables Were Created

In the SQL Editor, run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'newsletter_subscribers',
    'email_sends',
    'telegram_posts',
    'telegram_alerts'
  )
ORDER BY table_name;
```

Expected result: You should see all 4 tables listed.

### 6. Verify User Columns Were Added

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'telegram_chat_id',
    'telegram_username',
    'telegram_notifications',
    'telegram_preferences'
  );
```

Expected result: You should see all 4 columns listed.

## What These Tables Do

### newsletter_subscribers
Stores email subscribers for the daily newsletter system. Tracks subscription status, confirmation, and engagement metrics (opens, clicks).

### email_sends
Logs every email sent for analytics. Tracks which subscriber received which campaign, when they opened it, and if they clicked links.

### telegram_posts
Logs all deals posted to the public @TheHubDeals Telegram channel. Used for avoiding duplicate posts and analytics.

### telegram_alerts
Logs personalized Telegram alerts sent to individual users based on their preferences (categories, price range, deal score).

### users columns (telegram_*)
Adds Telegram integration to existing users. Users can link their Telegram account to receive personalized deal alerts.

## Next Steps After Migration

1. Verify Telegram bot is added to channel (see TELEGRAM_BOT_SETUP.md)
2. Test newsletter generation: `node scripts/testNewsletterEmail.js`
3. Start the server: `npm run dev`
4. Start the frontend: `cd the-hub && npm run dev`
5. Test email subscription from frontend

## Troubleshooting

**Error: "users" table does not exist**
- Run the main database setup first: `bash scripts/setup.sh`

**Error: column "telegram_chat_id" already exists**
- This is fine! It means the column was already added. The migration uses `IF NOT EXISTS` to handle this.

**Error: relation "newsletter_subscribers" already exists**
- This is fine! The tables are already created. You can skip the migration.
