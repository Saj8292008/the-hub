/**
 * URGENT: Run database migration for blog_subscribers table
 * Adds missing columns needed for newsletter system
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('\n🚨 URGENT: Running blog_subscribers migration');
  console.log('==========================================\n');

  const columns = [
    { name: 'confirmation_token', type: 'TEXT', required: true },
    { name: 'confirmed', type: 'BOOLEAN DEFAULT false', required: true },
    { name: 'name', type: 'VARCHAR(255)', required: false },
    { name: 'source', type: 'VARCHAR(50)', required: false },
    { name: 'unsubscribed', type: 'BOOLEAN DEFAULT false', required: true },
    { name: 'unsubscribe_reason', type: 'TEXT', required: false },
    { name: 'unsubscribed_at', type: 'TIMESTAMP', required: false },
    { name: 'last_sent_at', type: 'TIMESTAMP', required: false },
    { name: 'open_count', type: 'INTEGER DEFAULT 0', required: true },
    { name: 'click_count', type: 'INTEGER DEFAULT 0', required: true }
  ];

  console.log('📋 Checking existing columns...\n');

  try {
    // Check current table structure
    const { data: testData, error: testError } = await supabase
      .from('blog_subscribers')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Error accessing blog_subscribers table:', testError.message);
      console.log('\n⚠️  Table may not exist. Creating it first...\n');

      // Create the table if it doesn't exist
      console.log('📝 Creating blog_subscribers table...');
      console.log('\n⚠️  MANUAL ACTION REQUIRED:');
      console.log('Go to Supabase SQL Editor and run:');
      console.log('\nCREATE TABLE IF NOT EXISTS blog_subscribers (');
      console.log('  id SERIAL PRIMARY KEY,');
      console.log('  email VARCHAR(255) UNIQUE NOT NULL,');
      console.log('  subscribed_at TIMESTAMP DEFAULT NOW()');
      console.log(');\n');
      process.exit(1);
    }

    const existingColumns = testData && testData.length > 0 ? Object.keys(testData[0]) : [];
    console.log('✅ Existing columns:', existingColumns.join(', '));
    console.log('');

    const missingColumns = columns.filter(col => !existingColumns.includes(col.name));

    if (missingColumns.length === 0) {
      console.log('✅ All columns already exist! No migration needed.\n');
      return;
    }

    console.log(`⚠️  Found ${missingColumns.length} missing columns:\n`);
    missingColumns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
    console.log('');

    console.log('📝 To add these columns, run this SQL in Supabase SQL Editor:\n');
    console.log('--- Copy from here ---');

    missingColumns.forEach(col => {
      console.log(`ALTER TABLE blog_subscribers ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
    });

    console.log('\n-- Create indexes for better performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_blog_subscribers_confirmation_token ON blog_subscribers(confirmation_token);');
    console.log('CREATE INDEX IF NOT EXISTS idx_blog_subscribers_email ON blog_subscribers(email);');
    console.log('CREATE INDEX IF NOT EXISTS idx_blog_subscribers_confirmed ON blog_subscribers(confirmed);');

    console.log('\nSELECT \'Migration complete!\' as status;');
    console.log('--- Copy to here ---\n');

    console.log('🔗 Direct link: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql/new\n');

    console.log('⏱️  This will take 30 seconds to run.');
    console.log('📧 After running, test with: bash test-newsletter-subscribe.sh\n');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

runMigration()
  .then(() => {
    console.log('==========================================');
    console.log('📋 Migration instructions generated!');
    console.log('==========================================\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
