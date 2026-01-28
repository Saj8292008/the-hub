#!/usr/bin/env node

/**
 * Run Sports Scores Database Migration
 * Adds external_id column and indexes to sports_games table
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🗄️  Sports Scores Database Migration');
  console.log('===================================\n');

  try {
    // Get connection string and construct PostgreSQL REST API URL
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
    }

    // Extract project ref from URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

    if (!projectRef) {
      throw new Error('Could not extract project reference from SUPABASE_URL');
    }

    console.log('📍 Project:', projectRef);
    console.log('');

    // Read migration SQL
    const fs = require('fs');
    const migrationSQL = fs.readFileSync(
      'supabase/migrations/20260126000001_add_external_id_to_sports_games.sql',
      'utf8'
    );

    console.log('📋 Migration steps:');
    console.log('  1. Add external_id column');
    console.log('  2. Create unique index on external_id');
    console.log('  3. Create performance indexes');
    console.log('  4. Update existing rows');
    console.log('  5. Add column comment');
    console.log('');

    // Execute via Supabase Management API
    console.log('⏳ Executing SQL via Supabase...\n');

    const apiUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`;

    try {
      const response = await axios.post(
        apiUrl,
        { query: migrationSQL },
        {
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Migration executed successfully!');
      console.log('');

    } catch (apiError) {
      if (apiError.response?.status === 404) {
        // exec_sql RPC doesn't exist, guide user to manual approach
        console.log('⚠️  Direct SQL execution not available.');
        console.log('');
        console.log('📋 Please run the migration manually:');
        console.log('');
        console.log('1. Open Supabase SQL Editor:');
        console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql`);
        console.log('');
        console.log('2. Click "New Query"');
        console.log('');
        console.log('3. Copy and paste this SQL:');
        console.log('');
        console.log('─'.repeat(60));
        console.log(migrationSQL);
        console.log('─'.repeat(60));
        console.log('');
        console.log('4. Click "Run" (or press Cmd/Ctrl + Enter)');
        console.log('');
        console.log('5. You should see: "Success. No rows returned"');
        console.log('');
        return false;
      }
      throw apiError;
    }

    // Verify migration succeeded
    console.log('🔍 Verifying migration...\n');

    const { data: sampleRow, error } = await supabase
      .from('sports_games')
      .select('id, external_id, league, home_team, status')
      .limit(1)
      .single();

    if (error) {
      console.log('⚠️  Could not verify - please check manually');
      return false;
    }

    if (!sampleRow.hasOwnProperty('external_id')) {
      console.log('❌ Migration verification failed: external_id column not found');
      return false;
    }

    console.log('✅ Migration verified successfully!');
    console.log('');
    console.log('Sample row:', JSON.stringify({
      id: sampleRow.id,
      external_id: sampleRow.external_id || '(will be set by scheduler)',
      league: sampleRow.league,
      status: sampleRow.status
    }, null, 2));
    console.log('');
    console.log('🎉 Database is ready for live sports scores!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Start the server: npm run dev');
    console.log('  2. Test scores: node scripts/testSportsScores.js');
    console.log('  3. Visit: http://localhost:5173/sports');
    console.log('');

    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Please run the migration manually in Supabase SQL Editor:');
    console.error(`https://supabase.com/dashboard/project/${projectRef}/sql`);
    console.error('');
    return false;
  }
}

runMigration().then(success => {
  process.exit(success ? 0 : 1);
});
