#!/usr/bin/env node
/**
 * Set Autonomy Level
 * Change how autonomous Jay can be
 */

const fs = require('fs');
const path = require('path');

const level = parseInt(process.argv[2]);

if (isNaN(level) || level < 0 || level > 4) {
  console.log('Usage: node set-autonomy.js <level>');
  console.log('');
  console.log('Autonomy Levels:');
  console.log('  0 - Manual: Jay asks before every action');
  console.log('  1 - Assisted: Jay suggests, user approves');
  console.log('  2 - Supervised: Jay acts, user gets notified (DEFAULT)');
  console.log('  3 - Autonomous: Jay works independently');
  console.log('  4 - Full Autonomy: Jay makes all decisions');
  console.log('');
  process.exit(1);
}

const configPath = path.join(__dirname, '../config.json');

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.autonomyLevel = level;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  const levels = ['Manual', 'Assisted', 'Supervised', 'Autonomous', 'Full Autonomy'];
  console.log(`✅ Autonomy level set to ${level} (${levels[level]})`);
  
  if (level >= 3) {
    console.log('');
    console.log('⚠️  High autonomy enabled!');
    console.log('   Jay will make decisions without approval.');
    console.log('   Monitor activity in Mission Control.');
  }
} catch (error) {
  console.error('❌ Failed to update config:', error.message);
  process.exit(1);
}
