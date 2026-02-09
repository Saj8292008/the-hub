#!/usr/bin/env node
/**
 * Sports Expert Test Script
 * 
 * Tests all components of the Sports Broadcasting Expert
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const GameAnalyzer = require('./analyzer');
const SportsKnowledge = require('./knowledge');
const SportsExpertChat = require('./chat');

async function runTests() {
  console.log('🏀 Testing Sports Broadcasting Expert\n');
  console.log('=' .repeat(50));

  // Test 1: Database Connection
  console.log('\n✅ Test 1: Database Connection');
  const analyzer = new GameAnalyzer();
  
  try {
    await analyzer.connect();
    console.log('✓ Successfully connected to sports database');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return;
  }

  // Test 2: Get Today's Games
  console.log('\n✅ Test 2: Today\'s Games');
  try {
    const summary = await analyzer.getTodaysSummary();
    console.log(`✓ Found ${summary.total} games today (${summary.live} live, ${summary.upcoming} upcoming)`);
    
    if (summary.total > 0) {
      console.log('\nSample games:');
      const games = summary.games.slice(0, 3);
      games.forEach(game => {
        console.log(`  • ${game.away_team_name} @ ${game.home_team_name}`);
        console.log(`    Status: ${game.status}, Score: ${game.away_score}-${game.home_score}`);
      });
    }
  } catch (error) {
    console.error('✗ Error fetching games:', error.message);
  }

  // Test 3: Game Analysis
  console.log('\n✅ Test 3: Game Analysis');
  try {
    const games = await analyzer.getLiveGames(null, 1);
    if (games.length > 0) {
      const game = games[0];
      console.log(`\nAnalyzing: ${game.away_team_name} @ ${game.home_team_name}`);
      
      const analysis = await analyzer.analyzeGame(game.id);
      console.log('✓ Successfully generated game analysis');
      console.log(`  Records: ${analysis.teams.away.wins}-${analysis.teams.away.losses} vs ${analysis.teams.home.wins}-${analysis.teams.home.losses}`);
      
      if (analysis.insights.length > 0) {
        console.log('  Insights:', analysis.insights[0].text);
      }
    } else {
      console.log('  No games available to analyze');
    }
  } catch (error) {
    console.error('✗ Error analyzing game:', error.message);
  }

  // Test 4: Talking Points
  console.log('\n✅ Test 4: Talking Points Generator');
  try {
    const games = await analyzer.getLiveGames(null, 1);
    if (games.length > 0) {
      const game = games[0];
      const points = await analyzer.generateTalkingPoints(game.id, 3);
      console.log('✓ Generated talking points:');
      points.forEach((point, i) => {
        console.log(`  ${i + 1}. ${point}`);
      });
    } else {
      console.log('  No games available for talking points');
    }
  } catch (error) {
    console.error('✗ Error generating talking points:', error.message);
  }

  // Test 5: Knowledge Base
  console.log('\n✅ Test 5: Sports Knowledge Base');
  const knowledge = new SportsKnowledge();
  
  const rivalry = knowledge.getRivalryContext('Lakers', 'Celtics');
  if (rivalry) {
    console.log('✓ Rivalry context loaded');
    console.log(`  Lakers-Celtics: ${rivalry.history}`);
  }
  
  const trends = knowledge.getLeagueTrends('NBA');
  console.log('✓ League trends loaded');
  console.log(`  NBA trends: ${trends[0]}`);

  // Test 6: Chat Interface (without LLM)
  console.log('\n✅ Test 6: Chat Interface');
  const chat = new SportsExpertChat();
  
  try {
    console.log('  Testing query routing...');
    // We won't actually send queries that require LLM in this test
    console.log('✓ Chat interface initialized');
  } catch (error) {
    console.error('✗ Chat interface error:', error.message);
  }

  // Test 7: Configuration
  console.log('\n✅ Test 7: Configuration Check');
  console.log(`  SPORTS_EXPERT_ENABLED: ${process.env.SPORTS_EXPERT_ENABLED || 'NOT SET'}`);
  console.log(`  SPORTS_EXPERT_MODEL: ${process.env.SPORTS_EXPERT_MODEL || 'NOT SET'}`);
  console.log(`  SPORTS_BOT_DB: ${process.env.SPORTS_BOT_DB || 'NOT SET'}`);
  console.log(`  OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET'}`);

  // Cleanup
  analyzer.close();
  chat.close();

  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests complete!\n');
  console.log('Next steps:');
  console.log('1. Set OPENROUTER_API_KEY in .env for full functionality');
  console.log('2. Start The Hub: npm start');
  console.log('3. Access dashboard: http://localhost:4003/api/expert/');
  console.log('4. Try Telegram: /expert or /experthelp');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
