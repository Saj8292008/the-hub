#!/usr/bin/env node

/**
 * Test Sports Scores Update
 * Manually fetch and update sports scores from ESPN
 */

require('dotenv').config();
const SportsScoresScheduler = require('../src/schedulers/sportsScoresScheduler');

async function testSportsScores() {
  console.log('🏈 Testing Sports Scores Fetch from ESPN');
  console.log('=========================================\n');

  const scheduler = new SportsScoresScheduler();

  console.log('📡 Fetching live scores from ESPN...');
  console.log('Leagues: NFL, NBA, MLB, NHL\n');

  try {
    const result = await scheduler.updateScores();

    console.log('\n✅ Sports scores updated successfully!\n');
    console.log('Results:');
    console.log('  Updated:', result.updated);
    console.log('  Inserted:', result.inserted);
    console.log('  Failed:', result.failed);
    console.log('  Duration:', result.duration + 'ms');

    if (result.leagues) {
      console.log('\nBreakdown by league:');
      result.leagues.forEach(league => {
        const status = league.error ? '❌' : '✅';
        console.log(`  ${status} ${league.league.toUpperCase()}: ${league.updated} updated, ${league.inserted} inserted`);
        if (league.error) {
          console.log(`     Error: ${league.error}`);
        }
      });
    }

    console.log('\n💡 Scores are now available at:');
    console.log('   Frontend: http://localhost:5173/sports');
    console.log('   API: http://localhost:3000/sports/scores');
    console.log('');
    console.log('🔄 The scheduler will automatically update scores every 2 minutes');
    console.log('   during peak sports hours (10am-1am EST)');

  } catch (error) {
    console.error('\n❌ Failed to fetch sports scores:');
    console.error('   Error:', error.message);
    console.error('');
    console.error('💡 Common issues:');
    console.error('   • ESPN API is down or rate-limited');
    console.error('   • Network connection issues');
    console.error('   • No games currently scheduled');
    console.error('');
    process.exit(1);
  }
}

testSportsScores();
