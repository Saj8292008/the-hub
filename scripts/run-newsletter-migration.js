/**
 * Run Newsletter System Migration
 * Executes the SQL migration to create all newsletter and Telegram tables
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabaseWrapper = require('../src/db/supabase');
const supabase = supabaseWrapper.client;

async function runMigration() {
  console.log('\n📦 Newsletter System Migration');
  console.log('================================\n');

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '../database/migrations/create_newsletter_system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Read migration file:', sqlPath);
    console.log(`   ${sql.split('\n').length} lines\n`);

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🔧 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      const preview = statement.split('\n')[0].substring(0, 60);

      try {
        // Execute via Supabase
        const { error } = await supabase.rpc('exec_sql', { sql_string: statement });

        if (error) {
          // Check if it's a "already exists" error (not fatal)
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`⏭️  [${i + 1}/${statements.length}] Skipped (already exists): ${preview}...`);
            skipCount++;
          } else {
            throw error;
          }
        } else {
          console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
          successCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
        console.error(`   Statement: ${preview}...`);
        errorCount++;

        // Continue with other statements
      }
    }

    console.log('\n================================');
    console.log('Migration Complete!');
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏭️  Skipped: ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('================================\n');

    if (errorCount > 0) {
      console.log('⚠️  Some statements failed. Check errors above.');
      console.log('   This is often normal if tables already exist.\n');
    }

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const tablesToCheck = [
      'newsletter_subscribers',
      'email_sends',
      'telegram_posts',
      'telegram_alerts'
    ];

    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: NOT FOUND`);
      } else {
        console.log(`✅ ${table}: Exists`);
      }
    }

    console.log('\n✅ Migration script complete!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
