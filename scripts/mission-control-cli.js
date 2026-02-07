#!/usr/bin/env node
/**
 * Mission Control CLI
 * Quick status checks and actions for The Hub
 * 
 * Usage:
 *   node scripts/mission-control-cli.js status       # Full system status
 *   node scripts/mission-control-cli.js quick        # Quick health check
 *   node scripts/mission-control-cli.js scrapers     # Scraper details
 *   node scripts/mission-control-cli.js newsletter   # Newsletter stats
 *   node scripts/mission-control-cli.js hotdeals     # Find hot deals
 *   node scripts/mission-control-cli.js restart      # Restart server
 */

require('dotenv').config();
const http = require('http');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';
const COMMANDS = ['status', 'quick', 'scrapers', 'newsletter', 'hotdeals', 'restart'];

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return colors[color] + text + colors.reset;
}

function header(text) {
  console.log('\n' + colorize('═'.repeat(60), 'cyan'));
  console.log(colorize(`  ${text}`, 'bright'));
  console.log(colorize('═'.repeat(60), 'cyan'));
}

function section(title) {
  console.log('\n' + colorize(`▸ ${title}`, 'blue'));
}

function success(text) {
  console.log(colorize('  ✓ ', 'green') + text);
}

function warning(text) {
  console.log(colorize('  ⚠ ', 'yellow') + text);
}

function error(text) {
  console.log(colorize('  ✗ ', 'red') + text);
}

function info(text) {
  console.log('  ' + text);
}

/**
 * Fetch data from API
 */
async function apiGet(endpoint) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * COMMAND: status - Full system status
 */
async function cmdStatus() {
  header('🚀 MISSION CONTROL - FULL STATUS');
  
  try {
    const data = await apiGet('/api/dashboard/status');
    
    // Server
    section('Server');
    success(`Status: ${data.server.status}`);
    info(`Uptime: ${data.server.uptime}`);
    info(`Memory: ${data.server.memory.used}MB / ${data.server.memory.total}MB (${data.server.memory.percent}%)`);
    info(`CPU Load: ${data.server.cpu}`);
    info(`Node: ${data.server.nodeVersion} on ${data.server.platform}`);
    
    // Scrapers
    section('Scrapers');
    success(`${data.scrapers.last24h} listings in last 24h`);
    info(`Total listings: ${data.scrapers.totalListings.toLocaleString()}`);
    Object.entries(data.scrapers.sources).forEach(([source, info]) => {
      if (info.status === 'ok') {
        success(`${source}: ${info.status} (last: ${new Date(info.lastRun).toLocaleTimeString()})`);
      } else {
        warning(`${source}: ${info.status}`);
      }
    });
    
    // Newsletter
    section('Newsletter');
    info(`Subscribers: ${data.newsletter.subscribers}`);
    if (data.newsletter.lastCampaign) {
      info(`Last campaign: ${data.newsletter.lastCampaign.name}`);
      info(`Sent: ${data.newsletter.lastCampaign.sent} emails`);
      info(`Status: ${data.newsletter.lastCampaign.status}`);
    } else {
      info('No campaigns sent yet');
    }
    
    // Telegram
    section('Telegram');
    info(`Bot: ${data.telegram.botStatus}`);
    info(`Channel: ${data.telegram.channelId}`);
    info(`Posts today: ${data.telegram.postsToday}`);
    info(`Scheduled jobs: ${data.telegram.scheduledJobs}`);
    
    // Deals
    section('Deals');
    info(`Hot deals today: ${data.deals.hotDealsToday}`);
    info(`Active watchlists: ${data.deals.activeWatchlists}`);
    
    // Activity
    if (data.activity && data.activity.length > 0) {
      section('Recent Activity');
      data.activity.slice(0, 5).forEach(item => {
        info(`• ${item.title} - $${item.price} (${item.source})`);
      });
    }
    
    console.log('');
    success('All systems operational');
    
  } catch (err) {
    error(`Failed to fetch status: ${err.message}`);
    warning('Is the server running? Try: npm start');
    process.exit(1);
  }
}

/**
 * COMMAND: quick - Quick health check
 */
async function cmdQuick() {
  header('⚡ QUICK HEALTH CHECK');
  
  try {
    const health = await apiGet('/health');
    success(`Server: ${health.status}`);
    success(`Uptime: ${health.uptime}s`);
    success(`Memory: ${health.memory.used}MB / ${health.memory.total}MB`);
    
    const dashboard = await apiGet('/api/dashboard/status');
    success(`Scrapers: ${dashboard.scrapers.last24h} listings in 24h`);
    success(`Newsletter: ${dashboard.newsletter.subscribers} subscribers`);
    
    console.log('');
    success('✓ All systems GO');
    
  } catch (err) {
    error(`Health check failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * COMMAND: scrapers - Scraper details
 */
async function cmdScrapers() {
  header('🔍 SCRAPER STATUS');
  
  try {
    const data = await apiGet('/api/dashboard/status');
    
    section('Overview');
    info(`Total listings: ${data.scrapers.totalListings.toLocaleString()}`);
    info(`Last 24h: ${data.scrapers.last24h}`);
    
    section('Sources');
    Object.entries(data.scrapers.sources).forEach(([source, info]) => {
      const lastRun = info.lastRun ? new Date(info.lastRun).toLocaleString() : 'Never';
      const statusColor = info.status === 'ok' ? 'green' : 'yellow';
      console.log(colorize(`  • ${source.padEnd(12)}`, statusColor) + 
                  ` ${info.status.toUpperCase().padEnd(8)} Last: ${lastRun}`);
    });
    
    console.log('');
    
  } catch (err) {
    error(`Failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * COMMAND: newsletter - Newsletter stats
 */
async function cmdNewsletter() {
  header('📧 NEWSLETTER STATUS');
  
  try {
    const data = await apiGet('/api/newsletter/subscribers');
    
    section('Subscribers');
    info(`Total: ${data.pagination.total}`);
    
    const confirmed = data.subscribers.filter(s => s.confirmed);
    const unconfirmed = data.subscribers.filter(s => !s.confirmed);
    
    info(`Confirmed: ${confirmed.length}`);
    info(`Unconfirmed: ${unconfirmed.length}`);
    
    if (confirmed.length > 0) {
      section('Active Subscribers');
      confirmed.slice(0, 10).forEach(sub => {
        const sentCount = sub.send_count || 0;
        info(`• ${sub.email} (${sentCount} emails sent)`);
      });
    }
    
    console.log('');
    
  } catch (err) {
    error(`Failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * COMMAND: hotdeals - Find hot deals
 */
async function cmdHotdeals() {
  header('🔥 HOT DEALS (Score > 15)');
  
  try {
    // This would query the database directly or via an API endpoint
    // For now, showing placeholder
    warning('Not yet implemented - needs direct DB query or new API endpoint');
    info('TODO: Query watch_listings WHERE deal_score > 15 ORDER BY created_at DESC');
    
    console.log('');
    
  } catch (err) {
    error(`Failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * COMMAND: restart - Restart server
 */
function cmdRestart() {
  header('🔄 RESTARTING SERVER');
  
  try {
    info('Stopping server...');
    try {
      execSync('pkill -f "node.*src/index.js"', { stdio: 'inherit' });
      success('Server stopped');
    } catch (e) {
      warning('No running server found');
    }
    
    info('Starting server...');
    execSync('cd /Users/sydneyjackson/the-hub && nohup node src/index.js > logs/server.log 2>&1 &', { 
      stdio: 'inherit',
      shell: true 
    });
    
    success('Server restarted');
    info('Give it a few seconds to fully start...');
    
    setTimeout(() => {
      console.log('');
      info('Try: node scripts/mission-control-cli.js quick');
      console.log('');
    }, 2000);
    
  } catch (err) {
    error(`Restart failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
${colorize('Mission Control CLI', 'bright')}

${colorize('Usage:', 'cyan')}
  node scripts/mission-control-cli.js <command>

${colorize('Commands:', 'cyan')}
  status       Full system status (server, scrapers, newsletter, etc.)
  quick        Quick health check (essential metrics only)
  scrapers     Detailed scraper activity and sources
  newsletter   Newsletter subscriber stats
  hotdeals     Find hot deals (score > 15)
  restart      Restart the server

${colorize('Examples:', 'cyan')}
  node scripts/mission-control-cli.js status
  node scripts/mission-control-cli.js quick

${colorize('Aliases:', 'cyan')}
  npm run mission-control       # Full status
  npm run mc:quick              # Quick check
`);
}

/**
 * Main
 */
async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }
  
  if (!COMMANDS.includes(command)) {
    error(`Unknown command: ${command}`);
    info('Run without arguments to see available commands');
    process.exit(1);
  }
  
  switch (command) {
    case 'status':
      await cmdStatus();
      break;
    case 'quick':
      await cmdQuick();
      break;
    case 'scrapers':
      await cmdScrapers();
      break;
    case 'newsletter':
      await cmdNewsletter();
      break;
    case 'hotdeals':
      await cmdHotdeals();
      break;
    case 'restart':
      cmdRestart();
      break;
  }
}

// Run
main().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
