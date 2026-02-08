#!/usr/bin/env node
/**
 * Empire CLI - Command-line interface for agent management
 * Usage: node scripts/empire-cli.js <command> [args]
 */

require('dotenv').config();
const { empire } = require('../src/agents/empireController');
const { AGENTS } = require('../src/agents/definitions');

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  await empire.init();

  switch (command) {
    case 'status':
      await handleStatus();
      break;
    
    case 'list':
      await handleList();
      break;
    
    case 'spawn':
      if (args.length === 0) {
        console.error('Usage: empire-cli spawn <agent-id> [task]');
        process.exit(1);
      }
      await handleSpawn(args[0], args.slice(1).join(' '));
      break;
    
    case 'stop':
      if (args.length === 0) {
        console.error('Usage: empire-cli stop <agent-id>');
        process.exit(1);
      }
      await handleStop(args[0]);
      break;
    
    case 'report':
      if (args.length === 0) {
        await handleAllReports();
      } else {
        await handleReport(args[0]);
      }
      break;
    
    case 'help':
    default:
      showHelp();
      break;
  }
}

async function handleStatus() {
  console.log('🏛️ THE HUB EMPIRE STATUS\n');
  
  const statuses = await empire.getAllStatus();
  
  console.log('         🔥 JAY');
  console.log('   CEO / Chief Operating Officer');
  console.log('              |');
  console.log('    ┌────┬────┼────┬────┐');
  console.log('    |    |    |    |    |');
  console.log('');
  
  for (const status of statuses) {
    const statusIcon = status.active ? '🟢' : '⚪';
    console.log(`${status.emoji} ${status.label} ${statusIcon}`);
    console.log(`   ${status.title}`);
    console.log(`   Model: ${status.model}`);
    if (status.lastReport) {
      console.log(`   Last report: ${new Date(status.lastReport).toLocaleString()}`);
    }
    console.log('');
  }
}

async function handleList() {
  console.log('🏛️ AVAILABLE AGENTS\n');
  
  for (const [id, agent] of Object.entries(AGENTS)) {
    console.log(`${agent.emoji} ${agent.label}`);
    console.log(`   ID: ${id}`);
    console.log(`   Title: ${agent.title}`);
    console.log(`   Model: ${agent.model}`);
    console.log(`   Default task: ${agent.defaultTask}`);
    console.log('');
  }
}

async function handleSpawn(agentId, task) {
  console.log(`🚀 Spawning ${agentId}...`);
  
  try {
    const result = await empire.spawnAgent(agentId, task || null);
    console.log(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

async function handleStop(agentId) {
  console.log(`🛑 Stopping ${agentId}...`);
  
  try {
    const result = await empire.stopAgent(agentId);
    console.log(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

async function handleReport(agentId) {
  // Not implemented yet - would read latest report
  console.log(`📊 Report for ${agentId} coming soon...`);
}

async function handleAllReports() {
  console.log('📊 ALL AGENT REPORTS\n');
  // Not implemented yet
  console.log('Coming soon...');
}

function showHelp() {
  console.log(`
🏛️ EMPIRE CLI

Commands:
  status              Show agent org chart and statuses
  list                List all available agents
  spawn <id> [task]   Spawn an agent with optional custom task
  stop <id>           Stop an agent
  report [id]         Show reports (all or specific agent)
  help                Show this help

Examples:
  node scripts/empire-cli.js status
  node scripts/empire-cli.js spawn deal-hunter
  node scripts/empire-cli.js spawn content-manager "Create 3 tweets about watches"
  node scripts/empire-cli.js stop deal-hunter

Available agent IDs:
  - deal-hunter       Find and score hot deals
  - content-manager   Create social media content
  - data-analyst      Generate analytics reports
  - growth-lead       Develop growth strategies
  - dev-agent         Build features and fix bugs
`);
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
