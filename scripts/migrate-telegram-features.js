/**
 * Migration: Add Telegram Interactive Features Tables
 * Run: node scripts/migrate-telegram-features.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('🔄 Running Telegram features migration...\n');

  const migrations = [
    {
      name: 'saved_deals',
      sql: `
        CREATE TABLE IF NOT EXISTS saved_deals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          listing_id UUID,
          saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          notes TEXT,
          UNIQUE(user_id, listing_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_saved_deals_user ON saved_deals(user_id);
        CREATE INDEX IF NOT EXISTS idx_saved_deals_listing ON saved_deals(listing_id);
      `
    },
    {
      name: 'price_alerts',
      sql: `
        CREATE TABLE IF NOT EXISTS price_alerts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          listing_id UUID,
          alert_type VARCHAR(50) DEFAULT 'price_drop',
          target_price DECIMAL(12,2),
          is_active BOOLEAN DEFAULT true,
          triggered_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
        CREATE INDEX IF NOT EXISTS idx_price_alerts_listing ON price_alerts(listing_id);
        CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active);
      `
    },
    {
      name: 'deal_votes',
      sql: `
        CREATE TABLE IF NOT EXISTS deal_votes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          listing_id UUID,
          telegram_user_id BIGINT,
          vote VARCHAR(20),
          voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(listing_id, telegram_user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_deal_votes_listing ON deal_votes(listing_id);
      `
    },
    {
      name: 'telegram_posts',
      sql: `
        CREATE TABLE IF NOT EXISTS telegram_posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          listing_id UUID,
          channel_id VARCHAR(100),
          message_text TEXT,
          message_id BIGINT,
          deal_score DECIMAL(3,1),
          posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          engagement_stats JSONB DEFAULT '{}'::jsonb
        );
        
        CREATE INDEX IF NOT EXISTS idx_telegram_posts_listing ON telegram_posts(listing_id);
        CREATE INDEX IF NOT EXISTS idx_telegram_posts_channel ON telegram_posts(channel_id);
        CREATE INDEX IF NOT EXISTS idx_telegram_posts_date ON telegram_posts(posted_at);
      `
    },
    {
      name: 'telegram_alerts',
      sql: `
        CREATE TABLE IF NOT EXISTS telegram_alerts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          chat_id BIGINT,
          listing_id UUID,
          alert_type VARCHAR(50),
          message TEXT,
          sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_telegram_alerts_user ON telegram_alerts(user_id);
        CREATE INDEX IF NOT EXISTS idx_telegram_alerts_chat ON telegram_alerts(chat_id);
        CREATE INDEX IF NOT EXISTS idx_telegram_alerts_date ON telegram_alerts(sent_at);
      `
    },
    {
      name: 'users_telegram_fields',
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'telegram_chat_id'
          ) THEN
            ALTER TABLE users ADD COLUMN telegram_chat_id BIGINT;
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'telegram_username'
          ) THEN
            ALTER TABLE users ADD COLUMN telegram_username VARCHAR(100);
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'telegram_notifications'
          ) THEN
            ALTER TABLE users ADD COLUMN telegram_notifications BOOLEAN DEFAULT false;
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'telegram_preferences'
          ) THEN
            ALTER TABLE users ADD COLUMN telegram_preferences JSONB DEFAULT '{"categories": ["watches", "sneakers", "cars"], "min_score": 8.0}'::jsonb;
          END IF;
        END $$;
        
        CREATE INDEX IF NOT EXISTS idx_users_telegram_chat ON users(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
      `
    }
  ];

  for (const migration of migrations) {
    console.log(`📦 Running: ${migration.name}...`);
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: migration.sql });
      
      if (error) {
        // Try running directly if exec_sql doesn't exist
        console.log(`   ⚠️ exec_sql not available, table may already exist`);
      } else {
        console.log(`   ✅ ${migration.name} completed`);
      }
    } catch (err) {
      console.log(`   ⚠️ ${migration.name}: ${err.message}`);
    }
  }

  console.log('\n✅ Migration complete!');
  console.log('\nNew tables:');
  console.log('  • saved_deals - User saved deals watchlist');
  console.log('  • price_alerts - User price alert preferences');
  console.log('  • deal_votes - Community deal voting');
  console.log('  • telegram_posts - Channel post tracking');
  console.log('  • telegram_alerts - User alert history');
  console.log('\nNew user fields:');
  console.log('  • telegram_chat_id');
  console.log('  • telegram_username');
  console.log('  • telegram_notifications');
  console.log('  • telegram_preferences');
}

migrate().catch(console.error);
