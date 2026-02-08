#!/usr/bin/env node

/**
 * All Metrics - Combined Dashboard
 * 
 * Pulls and displays metrics from all sources in one view.
 * 
 * Usage:
 *   node all-metrics.js              # Full combined report
 *   node all-metrics.js --quick      # Quick summary
 *   node all-metrics.js --json       # JSON output
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const TelegramBot = require('node-telegram-bot-api');

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
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

async function getAllMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    status: {},
    summary: {},
    details: {}
  };

  // Track which services are available
  metrics.status = {
    supabase: !!supabase,
    stripe: !!stripe,
    telegram: !!bot
  };

  // =========================================================================
  // SUPABASE METRICS
  // =========================================================================

  if (supabase) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Users
      const { count: users } = await supabase
        .from('user_alert_preferences')
        .select('*', { count: 'exact', head: true });
      
      // Deals
      const { count: deals } = await supabase
        .from('watch_listings')
        .select('*', { count: 'exact', head: true });
      
      const { count: hotDeals } = await supabase
        .from('watch_listings')
        .select('*', { count: 'exact', head: true })
        .gte('deal_score', 85);
      
      const { count: todayDeals } = await supabase
        .from('watch_listings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);
      
      // Alerts
      const { count: alerts } = await supabase
        .from('alert_delivery_log')
        .select('*', { count: 'exact', head: true });
      
      // Content
      const { count: posts } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      
      const { count: views } = await supabase
        .from('blog_post_views')
        .select('*', { count: 'exact', head: true });
      
      // Email
      const { count: emailSubs } = await supabase
        .from('blog_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('unsubscribed', false);
      
      metrics.details.supabase = {
        users: users || 0,
        deals: {
          total: deals || 0,
          hot: hotDeals || 0,
          today: todayDeals || 0
        },
        alerts: alerts || 0,
        content: {
          posts: posts || 0,
          views: views || 0
        },
        email: emailSubs || 0
      };
      
      metrics.summary.users = users || 0;
      metrics.summary.deals = deals || 0;
      metrics.summary.hotDeals = hotDeals || 0;
      metrics.summary.emailSubs = emailSubs || 0;
      
    } catch (e) {
      metrics.details.supabase = { error: e.message };
    }
  }

  // =========================================================================
  // STRIPE METRICS
  // =========================================================================

  if (stripe) {
    try {
      const subs = await stripe.subscriptions.list({ status: 'active', limit: 100 });
      
      let mrr = 0;
      for (const sub of subs.data) {
        for (const item of sub.items.data) {
          const amount = item.price.unit_amount || 0;
          const interval = item.price.recurring?.interval || 'month';
          let monthly = amount / 100;
          if (interval === 'year') monthly = monthly / 12;
          mrr += monthly;
        }
      }
      
      metrics.details.stripe = {
        mrr: Math.round(mrr * 100) / 100,
        subscribers: subs.data.length
      };
      
      metrics.summary.mrr = Math.round(mrr * 100) / 100;
      metrics.summary.subscribers = subs.data.length;
      
    } catch (e) {
      metrics.details.stripe = { error: e.message };
    }
  }

  // =========================================================================
  // TELEGRAM METRICS
  // =========================================================================

  if (bot && process.env.TELEGRAM_CHANNEL_ID) {
    try {
      const members = await bot.getChatMemberCount(process.env.TELEGRAM_CHANNEL_ID);
      
      metrics.details.telegram = {
        channelMembers: members
      };
      
      metrics.summary.telegramMembers = members;
      
    } catch (e) {
      metrics.details.telegram = { error: e.message };
    }
  }

  return metrics;
}

function printQuickSummary(metrics) {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│       THE HUB - QUICK METRICS          │');
  console.log('├────────────────────────────────────────┤');
  
  const s = metrics.summary;
  
  console.log(`│  💰 MRR:          $${String(s.mrr || 0).padEnd(8)} (${s.subscribers || 0} subs)  │`);
  console.log(`│  👥 Users:        ${String(s.users || 0).padEnd(8)}              │`);
  console.log(`│  📦 Deals:        ${String(s.deals || 0).padEnd(8)} (🔥 ${s.hotDeals || 0})     │`);
  console.log(`│  📱 Telegram:     ${String(s.telegramMembers || 'N/A').padEnd(8)}              │`);
  console.log(`│  📧 Email:        ${String(s.emailSubs || 0).padEnd(8)}              │`);
  
  console.log('└────────────────────────────────────────┘\n');
}

function printFullReport(metrics) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                THE HUB - ALL METRICS                         ║');
  console.log(`║                ${new Date().toLocaleString().padEnd(32)}       ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  // Service Status
  const status = metrics.status;
  console.log('║  📡 SERVICE STATUS                                           ║');
  console.log(`║  • Supabase:   ${status.supabase ? '✅ Connected' : '❌ Unavailable'}                             ║`);
  console.log(`║  • Stripe:     ${status.stripe ? '✅ Connected' : '❌ Unavailable'}                             ║`);
  console.log(`║  • Telegram:   ${status.telegram ? '✅ Connected' : '❌ Unavailable'}                             ║`);
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  🎯 NORTH STAR METRICS                                       ║');
  
  const s = metrics.summary;
  console.log(`║                                                              ║`);
  console.log(`║     💰 MRR:              $${String(s.mrr || 0).padEnd(10)}                      ║`);
  console.log(`║     👥 Active Users:     ${String(s.users || 0).padEnd(10)}                       ║`);
  console.log(`║     🔔 Subscribers:      ${String(s.subscribers || 0).padEnd(10)}                       ║`);
  console.log(`║                                                              ║`);
  
  // Supabase details
  if (metrics.details.supabase && !metrics.details.supabase.error) {
    const db = metrics.details.supabase;
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  📊 DATABASE (Supabase)                                      ║');
    console.log(`║  • Total deals:        ${String(db.deals.total).padEnd(10)}                       ║`);
    console.log(`║  • Hot deals (85+):    ${String(db.deals.hot).padEnd(10)}                       ║`);
    console.log(`║  • Added today:        ${String(db.deals.today).padEnd(10)}                       ║`);
    console.log(`║  • Alerts delivered:   ${String(db.alerts).padEnd(10)}                       ║`);
    console.log(`║  • Blog posts:         ${String(db.content.posts).padEnd(10)}                       ║`);
    console.log(`║  • Blog views:         ${String(db.content.views).padEnd(10)}                       ║`);
    console.log(`║  • Email subscribers:  ${String(db.email).padEnd(10)}                       ║`);
  }
  
  // Stripe details
  if (metrics.details.stripe && !metrics.details.stripe.error) {
    const rev = metrics.details.stripe;
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  💰 REVENUE (Stripe)                                         ║');
    console.log(`║  • MRR:                $${String(rev.mrr).padEnd(9)}                       ║`);
    console.log(`║  • ARR:                $${String(Math.round(rev.mrr * 12 * 100) / 100).padEnd(9)}                       ║`);
    console.log(`║  • Active subscribers: ${String(rev.subscribers).padEnd(10)}                       ║`);
  }
  
  // Telegram details
  if (metrics.details.telegram && !metrics.details.telegram.error) {
    const tg = metrics.details.telegram;
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  📱 TELEGRAM                                                 ║');
    console.log(`║  • Channel members:    ${String(tg.channelMembers).padEnd(10)}                       ║`);
  }
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  📋 QUICK COMMANDS                                           ║');
  console.log('║                                                              ║');
  console.log('║  node analytics/scripts/pull-supabase.js   # DB metrics      ║');
  console.log('║  node analytics/scripts/pull-stripe.js     # Revenue         ║');
  console.log('║  node analytics/scripts/pull-telegram.js   # Channel         ║');
  console.log('║  node analytics/scripts/daily-snapshot.js  # Save snapshot   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

async function main() {
  try {
    const metrics = await getAllMetrics();
    
    if (isJson) {
      console.log(JSON.stringify(metrics, null, 2));
    } else if (isQuick) {
      printQuickSummary(metrics);
    } else {
      printFullReport(metrics);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching metrics:', error.message);
    process.exit(1);
  }
}

main();
