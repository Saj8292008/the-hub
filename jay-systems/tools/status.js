#!/usr/bin/env node
/**
 * Jay Systems Status
 * Check status of autonomous systems
 */

const fs = require('fs');
const path = require('path');

async function showStatus() {
  console.log('\n🧠 JAY\'S AUTONOMOUS SYSTEMS\n');
  console.log('=' .repeat(50));

  // Check config
  try {
    const configPath = path.join(__dirname, '../config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    console.log('\n📋 Configuration:');
    console.log(`   Autonomy Level: ${config.autonomyLevel}`);
    console.log(`   Work Hours: ${config.workHours.start} - ${config.workHours.end}`);
    console.log(`   Auto-Fix: ${config.capabilities.autoFix ? '✅' : '❌'}`);
    console.log(`   Auto-Commit: ${config.capabilities.autoCommit ? '✅' : '❌'}`);
    console.log(`   Auto-Deploy: ${config.capabilities.autoDeploy ? '✅' : '❌'}`);
  } catch (error) {
    console.log('\n❌ Config not found');
  }

  // Check brain state
  try {
    const statePath = path.join(__dirname, '../state.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    
    console.log('\n🧠 Brain Status:');
    console.log(`   Active: ${state.active ? '✅' : '❌'}`);
    console.log(`   Tasks Completed: ${state.taskCount}`);
    console.log(`   Recent Decisions: ${state.decisions?.length || 0}`);
    
    if (state.learning && Object.keys(state.learning).length > 0) {
      console.log('\n📚 Learning:');
      for (const [type, data] of Object.entries(state.learning)) {
        const rate = (data.successRate * 100).toFixed(1);
        console.log(`   ${type}: ${rate}% success (${data.attempts} attempts)`);
      }
    }
  } catch (error) {
    console.log('\n💤 Brain not active (state not found)');
  }

  // Check task queue
  try {
    const queuePath = path.join(__dirname, '../data/queue.json');
    const queueData = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    
    const queued = queueData.queue?.filter(t => t.status === 'queued').length || 0;
    const running = queueData.running?.length || 0;
    const completed = queueData.completed?.length || 0;

    console.log('\n📋 Task Queue:');
    console.log(`   Queued: ${queued}`);
    console.log(`   In Progress: ${running}`);
    console.log(`   Completed: ${completed}`);
  } catch (error) {
    console.log('\n📋 Task Queue: Empty');
  }

  // Check memory
  try {
    const memoryPath = path.join(__dirname, '../data/jay-memory.json');
    const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
    
    console.log('\n💭 Memory:');
    console.log(`   Patterns Learned: ${Object.keys(memory.patterns || {}).length}`);
    console.log(`   Preferences Stored: ${Object.keys(memory.preferences || {}).length}`);
    console.log(`   Successes Recorded: ${memory.successes?.length || 0}`);
    console.log(`   Failures Recorded: ${memory.failures?.length || 0}`);
  } catch (error) {
    console.log('\n💭 Memory: Empty');
  }

  console.log('\n' + '='.repeat(50));
  console.log('\nCommands:');
  console.log('  node jay-systems/core/brain.js       # Start brain');
  console.log('  node jay-systems/tools/set-autonomy.js <level>  # Change autonomy');
  console.log('  node jay-systems/monitors/health.js   # Run health check');
  console.log('');
}

showStatus();
