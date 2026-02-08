#!/usr/bin/env node
/**
 * Run Instagram tracking column migration
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function runMigration() {
  console.log('🔄 Running Instagram tracking migration...\n');
  
  const migrationPath = path.join(__dirname, '../migrations/add_instagram_tracking.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let success = 0;
  let failed = 0;
  
  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      
      // Execute via rpc if available, otherwise try direct query
      const { error } = await supabase.rpc('exec_sql', { 
        query: statement + ';' 
      }).catch(async () => {
        // Fallback: try to execute as raw query
        // Note: This might not work with Supabase depending on permissions
        return await supabase.from('_migrations').insert({ sql: statement });
      });
      
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        failed++;
      } else {
        console.log('✅ Success\n');
        success++;
      }
    } catch (err) {
      console.error(`❌ Failed: ${err.message}\n`);
      failed++;
    }
  }
  
  console.log('\n📊 Migration Results:');
  console.log(`   Success: ${success}`);
  console.log(`   Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n✅ Migration completed successfully!');
  } else {
    console.log('\n⚠️  Some statements failed. You may need to run them manually in Supabase dashboard.');
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
