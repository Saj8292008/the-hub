/**
 * Run Email Sequences Migration
 * Execute this script to create the sequence tables
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running email sequences migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../database/migrations/create_email_sequences.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split into individual statements (Supabase can only run one at a time via RPC)
  // We'll use the REST API instead
  
  console.log('📋 Creating tables via Supabase...\n');

  try {
    // Create email_sequences table
    console.log('1. Creating email_sequences table...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS email_sequences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          trigger_event VARCHAR(100) NOT NULL DEFAULT 'signup',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    if (error1) throw error1;
    console.log('   ✅ email_sequences created');

    // Create sequence_emails table
    console.log('2. Creating sequence_emails table...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS sequence_emails (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
          step_number INTEGER NOT NULL,
          delay_days INTEGER NOT NULL DEFAULT 0,
          delay_hours INTEGER NOT NULL DEFAULT 0,
          subject VARCHAR(500) NOT NULL,
          subject_variant VARCHAR(500),
          content_html TEXT NOT NULL,
          content_text TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(sequence_id, step_number)
        );
      `
    });
    if (error2) throw error2;
    console.log('   ✅ sequence_emails created');

    // Create subscriber_sequence_progress table
    console.log('3. Creating subscriber_sequence_progress table...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS subscriber_sequence_progress (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subscriber_id UUID NOT NULL REFERENCES blog_subscribers(id) ON DELETE CASCADE,
          sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
          current_step INTEGER NOT NULL DEFAULT 0,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          started_at TIMESTAMPTZ DEFAULT NOW(),
          last_sent_at TIMESTAMPTZ,
          next_send_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(subscriber_id, sequence_id)
        );
      `
    });
    if (error3) throw error3;
    console.log('   ✅ subscriber_sequence_progress created');

    // Create sequence_sends table
    console.log('4. Creating sequence_sends table...');
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS sequence_sends (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          subscriber_id UUID NOT NULL REFERENCES blog_subscribers(id) ON DELETE CASCADE,
          sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
          sequence_email_id UUID NOT NULL REFERENCES sequence_emails(id) ON DELETE CASCADE,
          step_number INTEGER NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'sent',
          resend_email_id VARCHAR(255),
          sent_at TIMESTAMPTZ DEFAULT NOW(),
          opened_at TIMESTAMPTZ,
          clicked_at TIMESTAMPTZ,
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    if (error4) throw error4;
    console.log('   ✅ sequence_sends created');

    console.log('\n✅ All tables created successfully!');
    console.log('\n📝 Now seeding welcome sequence...');

  } catch (error) {
    // RPC might not exist, try direct table creation
    console.log('\n⚠️  RPC not available, trying direct approach...');
    console.log('   Please run the SQL manually in Supabase Dashboard.');
    console.log(`   File: ${migrationPath}`);
    console.log('\n   Or copy this SQL and run it in SQL Editor:\n');
    console.log('─'.repeat(60));
    console.log(sql.substring(0, 2000) + '...\n');
    console.log('─'.repeat(60));
    console.log('\nFull SQL file saved at:', migrationPath);
    process.exit(1);
  }
}

runMigration().catch(console.error);
