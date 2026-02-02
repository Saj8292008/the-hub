/**
 * Mission Control Dashboard API
 * Central status endpoint for all Hub systems
 */

const express = require('express');
const router = express.Router();
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

// Import services for status checks
const supabase = require('../db/supabase');

// Memory file paths
const MEMORY_DIR = '/Users/sydneyjackson/clawd/memory';
const MEMORY_FILE = '/Users/sydneyjackson/clawd/MEMORY.md';

// Track server start time
const serverStartTime = Date.now();

/**
 * GET /api/dashboard/status
 * Returns comprehensive system status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await getFullStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/health
 * Quick health check
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  };
  res.json(health);
});

/**
 * GET /api/dashboard/memory
 * Get Jay's memory files for Mission Control
 */
router.get('/memory', async (req, res) => {
  try {
    // Get list of daily memory files
    const files = await fs.readdir(MEMORY_DIR);
    const dailyFiles = files
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
      .sort()
      .reverse()
      .slice(0, 7); // Last 7 days

    // Read recent daily notes
    const dailyNotes = [];
    for (const file of dailyFiles.slice(0, 3)) {
      const content = await fs.readFile(path.join(MEMORY_DIR, file), 'utf-8');
      dailyNotes.push({
        date: file.replace('.md', ''),
        content: content.substring(0, 1000), // First 1000 chars
        preview: content.split('\n').slice(0, 5).join('\n')
      });
    }

    // Read main MEMORY.md (summary only)
    let mainMemory = '';
    try {
      const content = await fs.readFile(MEMORY_FILE, 'utf-8');
      // Get key sections summary
      const lines = content.split('\n');
      const keyInfo = lines.slice(0, 50).join('\n'); // First 50 lines
      mainMemory = keyInfo;
    } catch (e) {
      mainMemory = 'MEMORY.md not found';
    }

    res.json({
      dailyNotes,
      allDays: dailyFiles,
      mainMemory,
      memoryDir: MEMORY_DIR
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/memory/:date
 * Get specific day's memory file
 */
router.get('/memory/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const filePath = path.join(MEMORY_DIR, `${date}.md`);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ date, content });
  } catch (error) {
    res.status(404).json({ error: `Memory file not found for ${req.params.date}` });
  }
});

/**
 * POST /api/dashboard/memory/note
 * Add a quick note for Jay to remember
 */
router.post('/memory/note', async (req, res) => {
  try {
    const { note, category } = req.body;
    if (!note) {
      return res.status(400).json({ error: 'Note content required' });
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const filePath = path.join(MEMORY_DIR, `${today}.md`);

    // Read existing content or create new
    let existingContent = '';
    try {
      existingContent = await fs.readFile(filePath, 'utf-8');
    } catch (e) {
      existingContent = `# Memory - ${today}\n\n`;
    }

    // Add note with timestamp
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const categoryTag = category ? `[${category}] ` : '';
    const newEntry = `\n### ${time} - ${categoryTag}Note from Mission Control\n${note}\n`;

    // Append to file
    await fs.writeFile(filePath, existingContent + newEntry);

    res.json({ 
      success: true, 
      message: 'Note saved to memory',
      file: `${today}.md`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Aggregate all system statuses
 */
async function getFullStatus() {
  const [
    serverStatus,
    scraperStatus,
    newsletterStatus,
    telegramStatus,
    dealStatus,
    recentActivity,
    errorLog
  ] = await Promise.all([
    getServerStatus(),
    getScraperStatus(),
    getNewsletterStatus(),
    getTelegramStatus(),
    getDealStatus(),
    getRecentActivity(),
    getRecentErrors()
  ]);

  return {
    timestamp: new Date().toISOString(),
    server: serverStatus,
    scrapers: scraperStatus,
    newsletter: newsletterStatus,
    telegram: telegramStatus,
    deals: dealStatus,
    activity: recentActivity,
    errors: errorLog
  };
}

/**
 * Server health and system info
 */
async function getServerStatus() {
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);
  const uptimeFormatted = formatUptime(uptimeSeconds);
  
  return {
    status: 'online',
    uptime: uptimeFormatted,
    uptimeSeconds,
    startedAt: new Date(serverStartTime).toISOString(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      percent: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
    },
    cpu: os.loadavg()[0].toFixed(2),
    nodeVersion: process.version,
    platform: os.platform()
  };
}

/**
 * Scraper status from database
 */
async function getScraperStatus() {
  try {
    // Get latest scrape results
    const sources = ['reddit', 'ebay', 'watchuseek'];
    const scraperStats = {};

    for (const source of sources) {
      const { data, error } = await supabase.client
        .from('watch_listings')
        .select('created_at, source')
        .eq('source', source)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        scraperStats[source] = {
          lastRun: data[0].created_at,
          status: 'ok'
        };
      } else {
        scraperStats[source] = {
          lastRun: null,
          status: 'unknown'
        };
      }
    }

    // Get total listings count
    const { count: totalListings } = await supabase.client
      .from('watch_listings')
      .select('*', { count: 'exact', head: true });

    // Get listings from last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: last24h } = await supabase.client
      .from('watch_listings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    return {
      sources: scraperStats,
      totalListings: totalListings || 0,
      last24h: last24h || 0
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Newsletter status
 */
async function getNewsletterStatus() {
  try {
    // Get subscriber count
    const { count: totalSubscribers } = await supabase.client
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('confirmed', true)
      .eq('unsubscribed', false);

    // Get last campaign
    const { data: lastCampaign } = await supabase.client
      .from('newsletter_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    return {
      subscribers: totalSubscribers || 0,
      lastCampaign: lastCampaign?.[0] ? {
        name: lastCampaign[0].name,
        sentAt: lastCampaign[0].send_completed_at,
        sent: lastCampaign[0].total_sent,
        status: lastCampaign[0].status
      } : null,
      nextScheduled: '8:00 AM daily'
    };
  } catch (error) {
    return { error: error.message, subscribers: 0 };
  }
}

/**
 * Telegram status
 */
async function getTelegramStatus() {
  try {
    // Check if bot is configured
    const botConfigured = !!process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID || '@TheHubDeals';

    // Get recent posts from tracking table (if exists)
    let recentPosts = 0;
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase.client
        .from('telegram_posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo);
      recentPosts = count || 0;
    } catch (e) {
      // Table might not exist yet
    }

    return {
      botStatus: botConfigured ? 'active' : 'not configured',
      channelId,
      postsToday: recentPosts,
      scheduledJobs: 8 // From content manager
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Deal and watchlist status
 */
async function getDealStatus() {
  try {
    // Get watchlist count
    const { count: watchlistCount } = await supabase.client
      .from('watches')
      .select('*', { count: 'exact', head: true })
      .eq('alert_enabled', true);

    // Get hot deals (score > 15)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: hotDeals } = await supabase.client
      .from('watch_listings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo)
      .gte('deal_score', 15);

    return {
      activeWatchlists: watchlistCount || 0,
      hotDealsToday: hotDeals || 0
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Recent activity feed
 */
async function getRecentActivity() {
  try {
    const activities = [];

    // Get recent listings
    const { data: recentListings } = await supabase.client
      .from('watch_listings')
      .select('id, title, source, price, deal_score, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentListings) {
      recentListings.forEach(listing => {
        activities.push({
          type: 'listing',
          title: listing.title?.substring(0, 50) + '...',
          source: listing.source,
          price: listing.price,
          score: listing.deal_score,
          timestamp: listing.created_at
        });
      });
    }

    return activities.slice(0, 10);
  } catch (error) {
    return [];
  }
}

/**
 * Recent errors from log
 */
async function getRecentErrors() {
  // In production, this would read from error log file
  // For now, return empty array
  return [];
}

/**
 * Format uptime to human readable
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

module.exports = router;
