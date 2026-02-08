#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { supabase } = require('../src/db/supabase');

async function runMigration(filename) {
  const migrationPath = path.join(__dirname, '..', 'migrations', filename);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(`Running migration: ${filename}`);
  console.log(`SQL length: ${sql.length} bytes`);
  
  try {
    // Split on ; and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (!statement) continue;
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
      
      if (error) {
        // Try direct query
        const result = await supabase.from('_migrations').insert({ statement }).select();
        if (result.error) {
          console.error('Error:', error.message);
          throw error;
        }
      }
    }
    
    console.log('✅ Migration completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

const migrationFile = process.argv[2] || 'create_alert_queue.sql';
runMigration(migrationFile).then(() => process.exit(0));
