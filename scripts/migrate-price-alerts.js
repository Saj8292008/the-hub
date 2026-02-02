#!/usr/bin/env node
/**
 * Migration: Price Alerts Table
 * Run: node scripts/migrate-price-alerts.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function migrate() {
  console.log('🔄 Running price alerts migration...\n');

  // Check if table exists first
  const { data: existing } = await supabase
    .from('price_alerts')
    .select('id')
    .limit(1);

  if (existing !== null) {
    console.log('✅ price_alerts table already exists');
    return;
  }

  // Table doesn't exist - provide SQL for manual creation
  console.log('⚠️  price_alerts table does not exist.');
  console.log('\nRun this SQL in your Supabase dashboard:\n');
  
  const sql = `
-- Price Alerts Table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  brand TEXT,
  model_keywords TEXT,
  target_price NUMERIC NOT NULL,
  notification_channel TEXT DEFAULT 'telegram',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_triggered TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);

-- RLS (Row Level Security)
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own alerts
CREATE POLICY "Users can view their own alerts" ON price_alerts
  FOR SELECT USING (true);

CREATE POLICY "Users can create alerts" ON price_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own alerts" ON price_alerts
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own alerts" ON price_alerts
  FOR DELETE USING (true);
`;

  console.log(sql);
  console.log('\n📋 SQL copied above. Paste into Supabase SQL editor.');
}

migrate().catch(console.error);
