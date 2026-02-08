#!/usr/bin/env node

/**
 * Daily Metrics Snapshot
 * 
 * Collects all metrics and saves a daily snapshot.
 * Can also store to Supabase for historical tracking.
 * 
 * Usage:
 *   node daily-snapshot.js              # Create snapshot
 *   node daily-snapshot.js --save       # Also save to Supabase
 *   node daily-snapshot.js --json       # Output JSON only
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const TelegramBot = require('node-telegram-bot-api');

const args = process.argv.slice(2);
const shouldSave = args.includes('--save');
const isJson = args.includes('--json');

// Initialize clients
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const bot = process.env.TELEGRAM_BOT_TOKEN
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  : null;

async function collectMetrics() {
  const snapshot = {
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    users: {},
    revenue: {},
    deals: {},
    alerts: {},
    content: {},
    channels: {}
  };

  // =========================================================================
  // SUPABASE METRICS
  // =========================================================================
  
  if (supabase) {
    try {
      // Users
      const { count: totalUsers } = await supabase
        .from('user_alert_preferences')
        .select('*', { count: 'exact', head: true });
      snapshot.users.total = totalUsers || 0;

      const { data: alertUsers } = await supabase
        .from('user_alert_preferences')
        .select('*')
        .or('email_enabled.eq.true,telegram_enabled.eq.true,discord_enabled.eq.true');
      snapshot.users.withAlerts = alertUsers?.length || 0;

      // Deals
      const { count: totalDeals } = await supabase
        .from('watch_listings')
        .select('*', { count: 'exact', head: true });
      snapshot.deals.total = totalDeals || 0;

      const today = new Date().toISOString().split('T')[0];
      const { count: todayDeals } = await supabase
        .from('watch_listings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
      snapshot.deals.addedToday = todayDeals || 0;

      const { count: hotDeals } = await supabase
        .from('watch_listings')
        .select('*', { count: 'exact', head: true })
        .gte('deal_score', 85);
      snapshot.deals.hotDeals = hotDeals || 0;

      // Alerts
      const { count: totalAlerts } = await supabase
        .from('alert_delivery_log')
        .select('*', { count: 'exact', head: true });
      snapshot.alerts.totalDelivered = totalAlerts || 0;

      const { count: todayAlerts } = await supabase
        .from('alert_delivery_log')
        .select('*', { count: 'exact', head: true })
        .gte('delivered_at', today);
      snapshot.alerts.deliveredToday = todayAlerts || 0;

      // Content
      const { count: totalPosts } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      snapshot.content.publishedPosts = totalPosts || 0;

      const { count: totalViews } = await supabase
        .from('blog_post_views')
        .select('*', { count: 'exact', head: true });
      snapshot.content.totalViews = totalViews || 0;

      const { count: todayViews } = await supabase
        .from('blog_post_views')
        .select('*', { count: 'exact', head: true })
        .gte('viewed_at', today);
      snapshot.content.viewsToday = todayViews || 0;

      // Email subscribers
      const { count: emailSubs } = await supabase
        .from('blog_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('unsubscribed', false);
      snapshot.channels.emailSubscribers = emailSubs || 0;

    } catch (e) {
      snapshot.errors = snapshot.errors || [];
      snapshot.errors.push(`Supabase: ${e.message}`);
    }
  }

  // =========================================================================
  // STRIPE METRICS
  // =========================================================================

  if (stripe) {
    try {
      const activeSubscriptions = await stripe.subscriptions.list({
        status: 'active',
        limit: 100
      });
      snapshot.revenue.activeSubscribers = activeSubscriptions.data.length;

      // Calculate MRR
      let mrr = 0;
      for (const sub of activeSubscriptions.data) {
        for (const item of sub.items.data) {
          const amount = item.price.unit_amount || 0;
          const interval = item.price.recurring?.interval || 'month';
          let monthlyAmount = amount / 100;
          if (interval === 'year') monthlyAmount = monthlyAmount / 12;
          mrr += monthlyAmount;
        }
      }
      snapshot.revenue.mrr = Math.round(mrr * 100) / 100;

      // Customers
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const newCustomers = await stripe.customers.list({
        created: { gte: Math.floor(monthStart.getTime() / 1000) },
        limit: 100
      });
      snapshot.revenue.newCustomersThisMonth = newCustomers.data.length;

    } catch (e) {
      snapshot.errors = snapshot.errors || [];
      snapshot.errors.push(`Stripe: ${e.message}`);
    }
  }

  // =========================================================================
  // TELEGRAM METRICS
  // =========================================================================

  if (bot && process.env.TELEGRAM_CHANNEL_ID) {
    try {
      const memberCount = await bot.getChatMemberCount(process.env.TELEGRAM_CHANNEL_ID);
      snapshot.channels.telegramMembers = memberCount;
    } catch (e) {
      snapshot.channels.telegramMembers = 'N/A';
    }
  }

  return snapshot;
}

async function saveToSupabase(snapshot) {
  if (!supabase) {
    console.log('⚠️  Supabase not configured, skipping save');
    return;
  }

  try {
    const record = {
      date: snapshot.date,
      total_users: snapshot.users.total || 0,
      new_users: 0, // Would need previous day to calculate
      active_users: snapshot.users.withAlerts || 0,
      premium_users: snapshot.revenue.activeSubscribers || 0,
      mrr: snapshot.revenue.mrr || 0,
      alerts_sent: snapshot.alerts.deliveredToday || 0,
      deals_scraped: snapshot.deals.addedToday || 0,
      blog_views: snapshot.content.viewsToday || 0,
      telegram_members: typeof snapshot.channels.telegramMembers === 'number' 
        ? snapshot.channels.telegramMembers : 0,
      email_subscribers: snapshot.channels.emailSubscribers || 0
    };

    const { error } = await supabase
      .from('daily_metrics')
      .upsert(record, { onConflict: 'date' });

    if (error) {
      throw error;
    }

    console.log('✅ Snapshot saved to Supabase');
  } catch (e) {
    console.error('❌ Failed to save to Supabase:', e.message);
  }
}

function saveToFile(snapshot) {
  const dataDir = path.join(__dirname, '../data/snapshots');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filename = `${snapshot.date}.json`;
  const filepath = path.join(dataDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
  console.log(`✅ Snapshot saved to ${filepath}`);
}

function printSnapshot(snapshot) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              THE HUB - DAILY SNAPSHOT                        ║');
  console.log(`║              ${snapshot.date}                                       ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  console.log('║                                                              ║');
  console.log(`║  👥 Users:           ${String(snapshot.users.total || 0).padStart(6)} (${snapshot.users.withAlerts || 0} with alerts)       ║`);
  console.log(`║  💰 MRR:             $${String(snapshot.revenue.mrr || 0).padStart(5)} (${snapshot.revenue.activeSubscribers || 0} subscribers)     ║`);
  console.log(`║  📦 Deals:           ${String(snapshot.deals.total || 0).padStart(6)} total (+${snapshot.deals.addedToday || 0} today)        ║`);
  console.log(`║  🔥 Hot Deals:       ${String(snapshot.deals.hotDeals || 0).padStart(6)}                                ║`);
  console.log(`║  🔔 Alerts Today:    ${String(snapshot.alerts.deliveredToday || 0).padStart(6)}                                ║`);
  console.log(`║  📝 Blog Views:      ${String(snapshot.content.viewsToday || 0).padStart(6)} today                          ║`);
  console.log(`║  📱 Telegram:        ${String(snapshot.channels.telegramMembers || 'N/A').padStart(6)} members                       ║`);
  console.log(`║  📧 Email Subs:      ${String(snapshot.channels.emailSubscribers || 0).padStart(6)}                                ║`);
  console.log('║                                                              ║');
  
  if (snapshot.errors && snapshot.errors.length > 0) {
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  ⚠️  ERRORS:                                                  ║');
    for (const err of snapshot.errors) {
      console.log(`║  • ${err.substring(0, 50).padEnd(50)}    ║`);
    }
  }
  
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

async function main() {
  try {
    console.log('📊 Collecting metrics...\n');
    
    const snapshot = await collectMetrics();
    
    if (isJson) {
      console.log(JSON.stringify(snapshot, null, 2));
    } else {
      printSnapshot(snapshot);
    }
    
    // Always save to file
    saveToFile(snapshot);
    
    // Optionally save to Supabase
    if (shouldSave) {
      await saveToSupabase(snapshot);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating snapshot:', error.message);
    process.exit(1);
  }
}

main();
