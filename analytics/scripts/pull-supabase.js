#!/usr/bin/env node

/**
 * Pull metrics from Supabase
 * 
 * Collects user, deal, alert, and content metrics.
 * 
 * Usage:
 *   node pull-supabase.js              # Full report
 *   node pull-supabase.js --quick      # Quick summary
 *   node pull-supabase.js --json       # JSON output
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
const isJson = args.includes('--json');

async function getMetrics() {
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const metrics = {
    timestamp: new Date().toISOString(),
    users: {},
    deals: {},
    alerts: {},
    content: {},
    channels: {}
  };

  // =========================================================================
  // USER METRICS
  // =========================================================================

  // Total users (from auth.users if accessible, else user tables)
  try {
    const { count: totalUsers } = await supabase
      .from('user_alert_preferences')
      .select('*', { count: 'exact', head: true });
    metrics.users.total = totalUsers || 0;
  } catch (e) {
    metrics.users.total = 'N/A';
  }

  // Users with alerts enabled
  try {
    const { data: alertUsers } = await supabase
      .from('user_alert_preferences')
      .select('*')
      .or('email_enabled.eq.true,telegram_enabled.eq.true,discord_enabled.eq.true');
    metrics.users.withAlerts = alertUsers?.length || 0;
  } catch (e) {
    metrics.users.withAlerts = 'N/A';
  }

  // Brand watchlist items
  try {
    const { count: watchlistItems } = await supabase
      .from('user_brand_watchlist')
      .select('*', { count: 'exact', head: true });
    metrics.users.watchlistItems = watchlistItems || 0;
  } catch (e) {
    metrics.users.watchlistItems = 'N/A';
  }

  // =========================================================================
  // DEAL METRICS
  // =========================================================================

  // Total watch listings
  try {
    const { count: totalDeals } = await supabase
      .from('watch_listings')
      .select('*', { count: 'exact', head: true });
    metrics.deals.total = totalDeals || 0;
  } catch (e) {
    metrics.deals.total = 'N/A';
  }

  // Deals added today
  try {
    const { count: todayDeals } = await supabase
      .from('watch_listings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);
    metrics.deals.addedToday = todayDeals || 0;
  } catch (e) {
    metrics.deals.addedToday = 'N/A';
  }

  // Deals added this week
  try {
    const { count: weekDeals } = await supabase
      .from('watch_listings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo);
    metrics.deals.addedThisWeek = weekDeals || 0;
  } catch (e) {
    metrics.deals.addedThisWeek = 'N/A';
  }

  // Hot deals (score >= 85)
  try {
    const { count: hotDeals } = await supabase
      .from('watch_listings')
      .select('*', { count: 'exact', head: true })
      .gte('deal_score', 85);
    metrics.deals.hotDeals = hotDeals || 0;
  } catch (e) {
    metrics.deals.hotDeals = 'N/A';
  }

  // Deals by source
  try {
    const { data: sources } = await supabase
      .from('watch_listings')
      .select('source')
      .limit(10000);
    
    const sourceCounts = {};
    for (const item of sources || []) {
      sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
    }
    metrics.deals.bySource = sourceCounts;
  } catch (e) {
    metrics.deals.bySource = {};
  }

  // Average deal score
  try {
    const { data: scores } = await supabase
      .from('watch_listings')
      .select('deal_score')
      .not('deal_score', 'is', null)
      .limit(1000);
    
    if (scores && scores.length > 0) {
      const avg = scores.reduce((sum, s) => sum + (s.deal_score || 0), 0) / scores.length;
      metrics.deals.avgScore = Math.round(avg * 10) / 10;
    } else {
      metrics.deals.avgScore = 'N/A';
    }
  } catch (e) {
    metrics.deals.avgScore = 'N/A';
  }

  // =========================================================================
  // ALERT METRICS
  // =========================================================================

  // Total alerts delivered
  try {
    const { count: totalAlerts } = await supabase
      .from('alert_delivery_log')
      .select('*', { count: 'exact', head: true });
    metrics.alerts.totalDelivered = totalAlerts || 0;
  } catch (e) {
    metrics.alerts.totalDelivered = 'N/A';
  }

  // Alerts today
  try {
    const { count: todayAlerts } = await supabase
      .from('alert_delivery_log')
      .select('*', { count: 'exact', head: true })
      .gte('delivered_at', today);
    metrics.alerts.deliveredToday = todayAlerts || 0;
  } catch (e) {
    metrics.alerts.deliveredToday = 'N/A';
  }

  // Alerts this week
  try {
    const { count: weekAlerts } = await supabase
      .from('alert_delivery_log')
      .select('*', { count: 'exact', head: true })
      .gte('delivered_at', weekAgo);
    metrics.alerts.deliveredThisWeek = weekAlerts || 0;
  } catch (e) {
    metrics.alerts.deliveredThisWeek = 'N/A';
  }

  // Pending alerts
  try {
    const { count: pendingAlerts } = await supabase
      .from('alert_queue')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'pending');
    metrics.alerts.pending = pendingAlerts || 0;
  } catch (e) {
    metrics.alerts.pending = 'N/A';
  }

  // Failed alerts
  try {
    const { count: failedAlerts } = await supabase
      .from('alert_queue')
      .select('*', { count: 'exact', head: true })
      .eq('delivery_status', 'failed');
    metrics.alerts.failed = failedAlerts || 0;
  } catch (e) {
    metrics.alerts.failed = 'N/A';
  }

  // Alerts by channel
  try {
    const { data: channels } = await supabase
      .from('alert_delivery_log')
      .select('channel')
      .limit(10000);
    
    const channelCounts = {};
    for (const item of channels || []) {
      channelCounts[item.channel] = (channelCounts[item.channel] || 0) + 1;
    }
    metrics.alerts.byChannel = channelCounts;
  } catch (e) {
    metrics.alerts.byChannel = {};
  }

  // =========================================================================
  // CONTENT METRICS
  // =========================================================================

  // Total blog posts
  try {
    const { count: totalPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true });
    metrics.content.totalPosts = totalPosts || 0;
  } catch (e) {
    metrics.content.totalPosts = 'N/A';
  }

  // Published posts
  try {
    const { count: publishedPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    metrics.content.publishedPosts = publishedPosts || 0;
  } catch (e) {
    metrics.content.publishedPosts = 'N/A';
  }

  // Total blog views
  try {
    const { count: totalViews } = await supabase
      .from('blog_post_views')
      .select('*', { count: 'exact', head: true });
    metrics.content.totalViews = totalViews || 0;
  } catch (e) {
    metrics.content.totalViews = 'N/A';
  }

  // Views today
  try {
    const { count: todayViews } = await supabase
      .from('blog_post_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', today);
    metrics.content.viewsToday = todayViews || 0;
  } catch (e) {
    metrics.content.viewsToday = 'N/A';
  }

  // Views this week
  try {
    const { count: weekViews } = await supabase
      .from('blog_post_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', weekAgo);
    metrics.content.viewsThisWeek = weekViews || 0;
  } catch (e) {
    metrics.content.viewsThisWeek = 'N/A';
  }

  // =========================================================================
  // CHANNEL METRICS (Email)
  // =========================================================================

  // Total email subscribers
  try {
    const { count: totalSubs } = await supabase
      .from('blog_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('unsubscribed', false);
    metrics.channels.emailSubscribers = totalSubs || 0;
  } catch (e) {
    metrics.channels.emailSubscribers = 'N/A';
  }

  // Confirmed subscribers
  try {
    const { count: confirmedSubs } = await supabase
      .from('blog_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('confirmed', true)
      .eq('unsubscribed', false);
    metrics.channels.confirmedSubscribers = confirmedSubs || 0;
  } catch (e) {
    metrics.channels.confirmedSubscribers = 'N/A';
  }

  // New subscribers this week
  try {
    const { count: newSubs } = await supabase
      .from('blog_subscribers')
      .select('*', { count: 'exact', head: true })
      .gte('subscribed_at', weekAgo);
    metrics.channels.newSubsThisWeek = newSubs || 0;
  } catch (e) {
    metrics.channels.newSubsThisWeek = 'N/A';
  }

  return metrics;
}

function printMetrics(metrics) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              THE HUB - SUPABASE METRICS                      ║');
  console.log(`║              ${new Date().toLocaleString().padEnd(32)}       ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  console.log('║  👥 USERS                                                    ║');
  console.log(`║  • Total with preferences:    ${String(metrics.users.total).padStart(8)}                    ║`);
  console.log(`║  • With alerts enabled:       ${String(metrics.users.withAlerts).padStart(8)}                    ║`);
  console.log(`║  • Watchlist items:           ${String(metrics.users.watchlistItems).padStart(8)}                    ║`);
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  📦 DEALS                                                    ║');
  console.log(`║  • Total listings:            ${String(metrics.deals.total).padStart(8)}                    ║`);
  console.log(`║  • Added today:               ${String(metrics.deals.addedToday).padStart(8)}                    ║`);
  console.log(`║  • Added this week:           ${String(metrics.deals.addedThisWeek).padStart(8)}                    ║`);
  console.log(`║  • Hot deals (85+):           ${String(metrics.deals.hotDeals).padStart(8)}                    ║`);
  console.log(`║  • Average score:             ${String(metrics.deals.avgScore).padStart(8)}                    ║`);
  
  if (Object.keys(metrics.deals.bySource).length > 0) {
    console.log('║  • By source:                                                ║');
    for (const [source, count] of Object.entries(metrics.deals.bySource)) {
      console.log(`║      ${source.padEnd(20)} ${String(count).padStart(8)}                    ║`);
    }
  }
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  🔔 ALERTS                                                   ║');
  console.log(`║  • Total delivered:           ${String(metrics.alerts.totalDelivered).padStart(8)}                    ║`);
  console.log(`║  • Delivered today:           ${String(metrics.alerts.deliveredToday).padStart(8)}                    ║`);
  console.log(`║  • Delivered this week:       ${String(metrics.alerts.deliveredThisWeek).padStart(8)}                    ║`);
  console.log(`║  • Pending:                   ${String(metrics.alerts.pending).padStart(8)}                    ║`);
  console.log(`║  • Failed:                    ${String(metrics.alerts.failed).padStart(8)}                    ║`);
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  📝 CONTENT                                                  ║');
  console.log(`║  • Total blog posts:          ${String(metrics.content.totalPosts).padStart(8)}                    ║`);
  console.log(`║  • Published:                 ${String(metrics.content.publishedPosts).padStart(8)}                    ║`);
  console.log(`║  • Total views:               ${String(metrics.content.totalViews).padStart(8)}                    ║`);
  console.log(`║  • Views today:               ${String(metrics.content.viewsToday).padStart(8)}                    ║`);
  console.log(`║  • Views this week:           ${String(metrics.content.viewsThisWeek).padStart(8)}                    ║`);
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  📧 EMAIL CHANNEL                                            ║');
  console.log(`║  • Total subscribers:         ${String(metrics.channels.emailSubscribers).padStart(8)}                    ║`);
  console.log(`║  • Confirmed:                 ${String(metrics.channels.confirmedSubscribers).padStart(8)}                    ║`);
  console.log(`║  • New this week:             ${String(metrics.channels.newSubsThisWeek).padStart(8)}                    ║`);
  
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

function printQuickSummary(metrics) {
  console.log('\n📊 Quick Supabase Summary:');
  console.log(`   Users: ${metrics.users.total} | Deals: ${metrics.deals.total} | Alerts: ${metrics.alerts.totalDelivered}`);
  console.log(`   Blog: ${metrics.content.publishedPosts} posts, ${metrics.content.totalViews} views`);
  console.log(`   Email: ${metrics.channels.emailSubscribers} subscribers\n`);
}

async function main() {
  try {
    const metrics = await getMetrics();
    
    if (isJson) {
      console.log(JSON.stringify(metrics, null, 2));
    } else if (isQuick) {
      printQuickSummary(metrics);
    } else {
      printMetrics(metrics);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching metrics:', error.message);
    process.exit(1);
  }
}

main();
