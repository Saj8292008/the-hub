#!/usr/bin/env node
/**
 * Health Monitor for The Hub
 * Checks system health and alerts on issues
 * Run: node scripts/health-monitor.js
 */

require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../logs/health-state.json');
const LOG_FILE = path.join(__dirname, '../logs/health-monitor.log');

// Telegram config for alerts
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALERT_CHAT_ID = process.env.TELEGRAM_OWNER_ID || '8427035818'; // Syd's ID

/**
 * Send Telegram alert
 */
async function sendAlert(message) {
  if (!TELEGRAM_TOKEN) {
    console.log('⚠️ No Telegram token, logging only:', message);
    return;
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: ALERT_CHAT_ID,
      text: `🚨 *HUB ALERT*\n\n${message}`,
      parse_mode: 'Markdown'
    });

    const req = https.request(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Check if server is running
 */
async function checkServer() {
  return new Promise((resolve) => {
    const req = require('http').get('http://localhost:4003/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ 
            ok: res.statusCode === 200, 
            status: json.status || 'unknown',
            uptime: json.uptime 
          });
        } catch {
          resolve({ ok: res.statusCode === 200, status: 'unknown' });
        }
      });
    });
    req.on('error', () => resolve({ ok: false, status: 'unreachable' }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ ok: false, status: 'timeout' });
    });
  });
}

/**
 * Check recent scraper activity
 */
async function checkScrapers() {
  return new Promise((resolve) => {
    const req = require('http').get('http://localhost:4003/api/dashboard/status', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const scrapers = json.scrapers || {};
          resolve({
            ok: scrapers.last24h > 0,
            count24h: scrapers.last24h || 0,
            lastRun: scrapers.lastRun
          });
        } catch {
          resolve({ ok: false, error: 'parse error' });
        }
      });
    });
    req.on('error', () => resolve({ ok: false, error: 'unreachable' }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
  });
}

/**
 * Check for recent errors in logs
 */
function checkLogs() {
  const logPath = path.join(__dirname, '../logs/nohup.log');
  try {
    if (!fs.existsSync(logPath)) return { ok: true, errors: [] };
    
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n').slice(-200); // Last 200 lines
    
    const errors = lines.filter(line => 
      line.includes('Error:') || 
      line.includes('FATAL') ||
      line.includes('UnhandledPromiseRejection') ||
      line.includes('ECONNREFUSED')
    ).slice(-5); // Last 5 errors
    
    return { ok: errors.length === 0, errors };
  } catch {
    return { ok: true, errors: [] };
  }
}

/**
 * Load/save state
 */
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { lastAlerts: {}, consecutiveFailures: {} };
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Log to file
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, line);
}

/**
 * Main health check
 */
async function runHealthCheck() {
  log('🏥 Running health check...');
  
  const state = loadState();
  const now = Date.now();
  const alerts = [];

  // 1. Server Check
  const server = await checkServer();
  log(`Server: ${server.ok ? '✅' : '❌'} ${server.status}`);
  
  if (!server.ok) {
    state.consecutiveFailures.server = (state.consecutiveFailures.server || 0) + 1;
    
    // Alert after 2 consecutive failures (avoid false positives)
    if (state.consecutiveFailures.server >= 2) {
      const lastAlert = state.lastAlerts.server || 0;
      // Don't spam - only alert every 30 min
      if (now - lastAlert > 30 * 60 * 1000) {
        alerts.push(`🔴 Server is DOWN (${server.status})\nConsecutive failures: ${state.consecutiveFailures.server}`);
        state.lastAlerts.server = now;
      }
    }
  } else {
    // Server back up after being down
    if (state.consecutiveFailures.server >= 2) {
      alerts.push(`🟢 Server is BACK UP (was down for ${state.consecutiveFailures.server} checks)`);
    }
    state.consecutiveFailures.server = 0;
  }

  // 2. Scraper Check
  const scrapers = await checkScrapers();
  log(`Scrapers: ${scrapers.ok ? '✅' : '⚠️'} ${scrapers.count24h || 0} listings in 24h`);
  
  if (!scrapers.ok && scrapers.count24h === 0) {
    state.consecutiveFailures.scrapers = (state.consecutiveFailures.scrapers || 0) + 1;
    
    if (state.consecutiveFailures.scrapers >= 4) { // ~2 hours of no activity
      const lastAlert = state.lastAlerts.scrapers || 0;
      if (now - lastAlert > 2 * 60 * 60 * 1000) { // 2 hour cooldown
        alerts.push(`⚠️ Scrapers inactive - 0 listings in 24h\nLast run: ${scrapers.lastRun || 'unknown'}`);
        state.lastAlerts.scrapers = now;
      }
    }
  } else {
    state.consecutiveFailures.scrapers = 0;
  }

  // 3. Log Errors Check
  const logs = checkLogs();
  log(`Logs: ${logs.ok ? '✅' : '⚠️'} ${logs.errors.length} recent errors`);
  
  if (!logs.ok && logs.errors.length > 0) {
    const lastAlert = state.lastAlerts.logErrors || 0;
    if (now - lastAlert > 60 * 60 * 1000) { // 1 hour cooldown
      const errorSummary = logs.errors.slice(0, 3).map(e => `• ${e.substring(0, 100)}`).join('\n');
      alerts.push(`⚠️ Recent errors in logs:\n${errorSummary}`);
      state.lastAlerts.logErrors = now;
    }
  }

  // Send alerts
  for (const alert of alerts) {
    log(`📢 Sending alert: ${alert.substring(0, 50)}...`);
    try {
      await sendAlert(alert);
    } catch (e) {
      log(`Failed to send alert: ${e.message}`);
    }
  }

  saveState(state);
  
  log(`✅ Health check complete. ${alerts.length} alerts sent.`);
  
  return {
    server: server.ok,
    scrapers: scrapers.ok,
    logs: logs.ok,
    alertsSent: alerts.length
  };
}

// Run
runHealthCheck().then(result => {
  console.log('\nResult:', JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Health check failed:', err);
  process.exit(1);
});
