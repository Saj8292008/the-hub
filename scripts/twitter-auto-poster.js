#!/usr/bin/env node
/**
 * Twitter/X Auto-Poster for The Hub Deals
 * 
 * Posts hot deals, market commentary, and weekly roundup threads to Twitter/X.
 * 
 * Usage:
 *   node twitter-auto-poster.js                    # Post next batch of hot deals
 *   node twitter-auto-poster.js --dry-run           # Preview without posting
 *   node twitter-auto-poster.js --commentary        # Post market commentary tweet
 *   node twitter-auto-poster.js --thread            # Post weekly roundup thread
 *   node twitter-auto-poster.js --max=5             # Post up to 5 deals
 *   node twitter-auto-poster.js --score=15          # Min deal score (default: 10)
 *   node twitter-auto-poster.js --stats             # Show posting stats
 * 
 * Environment Variables (from .env):
 *   SUPABASE_URL, SUPABASE_KEY          - Supabase connection
 *   TWITTER_API_KEY, TWITTER_API_SECRET  - Twitter app credentials
 *   TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET - Twitter user credentials
 *   DRY_RUN=true                         - Preview mode (no actual posting)
 *   TWITTER_SCORE_THRESHOLD=10           - Min score to auto-post (default: 10)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { TwitterApi } = require('twitter-api-v2');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG = {
  scoreThreshold: parseInt(process.env.TWITTER_SCORE_THRESHOLD) || 10,
  maxTweetLength: 280,
  postDelayMs: 30_000,         // 30s between posts (rate limit safety)
  threadDelayMs: 5_000,        // 5s between thread tweets
  siteUrl: 'https://thehubdeals.com',
  dataDir: path.join(__dirname, '../data'),
  postedFile: path.join(__dirname, '../data/twitter-posted.json'),
};

const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run');

// ─── Supabase ────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Twitter Client ──────────────────────────────────────────────────────────

function getTwitterClient() {
  const keys = {
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  };

  const missing = Object.entries(keys).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    if (DRY_RUN) {
      console.log(`⚠️  Missing Twitter keys (${missing.join(', ')}) — DRY_RUN mode, continuing anyway\n`);
      return null;
    }
    console.error(`❌ Missing Twitter env vars: ${missing.join(', ')}`);
    console.error('   See docs/TWITTER-SETUP.md for instructions');
    process.exit(1);
  }

  return new TwitterApi(keys);
}

// ─── Dedup Tracker ───────────────────────────────────────────────────────────

class DeduplicationTracker {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = { posted: [], stats: { totalPosted: 0, lastPostAt: null } };
  }

  async load() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      this.data = JSON.parse(raw);
      // Migrate old format if needed
      if (Array.isArray(this.data.posted) && this.data.posted.length > 0 && typeof this.data.posted[0] === 'string') {
        this.data.posted = this.data.posted.map(id => ({ id, tweetedAt: null, tweetId: null }));
      }
    } catch {
      // File doesn't exist yet — start fresh
    }
    return this;
  }

  async save() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
  }

  isPosted(dealId) {
    return this.data.posted.some(p => p.id === dealId);
  }

  markPosted(dealId, tweetId = null) {
    this.data.posted.push({
      id: dealId,
      tweetId,
      tweetedAt: new Date().toISOString(),
    });
    this.data.stats.totalPosted = this.data.posted.length;
    this.data.stats.lastPostAt = new Date().toISOString();
  }

  get postedCount() {
    return this.data.posted.length;
  }

  getRecentPosts(hours = 24) {
    const since = Date.now() - hours * 3600_000;
    return this.data.posted.filter(p => p.tweetedAt && new Date(p.tweetedAt).getTime() > since);
  }
}

// ─── Hashtag Engine ──────────────────────────────────────────────────────────

const BRAND_HASHTAGS = {
  'rolex':        ['#Rolex', '#WatchDeals'],
  'omega':        ['#Omega', '#WatchDeals'],
  'tudor':        ['#Tudor', '#WatchDeals'],
  'seiko':        ['#Seiko', '#WatchDeals'],
  'grand seiko':  ['#GrandSeiko', '#WatchDeals'],
  'cartier':      ['#Cartier', '#LuxuryWatches'],
  'audemars piguet': ['#AudemarsPiguet', '#LuxuryWatches'],
  'patek philippe': ['#PatekPhilippe', '#LuxuryWatches'],
  'breitling':    ['#Breitling', '#WatchDeals'],
  'iwc':          ['#IWC', '#WatchDeals'],
  'panerai':      ['#Panerai', '#WatchDeals'],
  'tag heuer':    ['#TAGHeuer', '#WatchDeals'],
  'tissot':       ['#Tissot', '#WatchDeals'],
  'hamilton':     ['#Hamilton', '#WatchDeals'],
  'orient':       ['#Orient', '#WatchDeals'],
  'casio':        ['#Casio', '#WatchDeals'],
  'citizen':      ['#Citizen', '#WatchDeals'],
  'sinn':         ['#Sinn', '#WatchDeals'],
  'nomos':        ['#Nomos', '#WatchDeals'],
  'nike':         ['#Nike', '#SneakerDeals'],
  'jordan':       ['#Jordan', '#SneakerDeals'],
  'adidas':       ['#Adidas', '#SneakerDeals'],
  'new balance':  ['#NewBalance', '#SneakerDeals'],
  'yeezy':        ['#Yeezy', '#SneakerDeals'],
  'puma':         ['#Puma', '#SneakerDeals'],
  'asics':        ['#ASICS', '#SneakerDeals'],
};

const MODEL_HASHTAGS = {
  'submariner':   '#Submariner',
  'daytona':      '#Daytona',
  'datejust':     '#Datejust',
  'gmt-master':   '#GMTMaster',
  'explorer':     '#Explorer',
  'speedmaster':  '#Speedmaster',
  'seamaster':    '#Seamaster',
  'royal oak':    '#RoyalOak',
  'nautilus':     '#Nautilus',
  'black bay':    '#BlackBay',
  'skx':          '#SKX',
  'dunk':         '#NikeDunk',
  'air jordan':   '#AirJordan',
  'air force':    '#AirForce1',
  'yeezy 350':    '#Yeezy350',
};

function getHashtags(brand, model, title, maxTags = 4) {
  const tags = new Set();
  const text = `${brand || ''} ${model || ''} ${title || ''}`.toLowerCase();

  // Brand hashtags
  for (const [key, brandTags] of Object.entries(BRAND_HASHTAGS)) {
    if (text.includes(key)) {
      brandTags.forEach(t => tags.add(t));
      break;
    }
  }

  // Model hashtags
  for (const [key, tag] of Object.entries(MODEL_HASHTAGS)) {
    if (text.includes(key)) {
      tags.add(tag);
      break;
    }
  }

  // Category fallback
  if (tags.size === 0) {
    if (text.match(/watch|automatic|chronograph|dive|pilot/)) {
      tags.add('#WatchDeals');
    } else if (text.match(/sneaker|shoe|running|basketball/)) {
      tags.add('#SneakerDeals');
    } else {
      tags.add('#Deals');
    }
  }

  // Always add site hashtag
  tags.add('#TheHubDeals');

  return [...tags].slice(0, maxTags);
}

// ─── Tweet Formatters ────────────────────────────────────────────────────────

function formatPrice(price) {
  if (!price) return '';
  return '$' + Number(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getFireEmoji(score) {
  if (score >= 80) return '🔥🔥🔥';
  if (score >= 50) return '🔥🔥';
  if (score >= 10) return '🔥';
  return '✨';
}

function truncateTitle(title, maxLen) {
  if (!title) return '';
  const clean = title.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return clean.substring(0, maxLen - 1).trim() + '…';
}

/**
 * Format a single deal as an engaging tweet (< 280 chars)
 */
function formatDealTweet(deal) {
  const { title, price, brand, model, deal_score, url, original_price, discount_percentage } = deal;
  const fire = getFireEmoji(deal_score || 0);
  const hashtags = getHashtags(brand, model, title);
  const hashStr = hashtags.join(' ');
  const link = CONFIG.siteUrl;

  // Calculate discount if we have the data
  let discountStr = '';
  if (discount_percentage && discount_percentage > 0) {
    discountStr = ` (${Math.round(discount_percentage)}% OFF)`;
  } else if (original_price && price && original_price > price) {
    const pct = Math.round(((original_price - price) / original_price) * 100);
    if (pct > 0) discountStr = ` (${pct}% OFF)`;
  }

  // Score label
  let scoreLabel = '';
  if (deal_score >= 80) scoreLabel = 'INCREDIBLE DEAL';
  else if (deal_score >= 50) scoreLabel = 'HOT DEAL';
  else if (deal_score >= 20) scoreLabel = 'Great Value';
  else scoreLabel = 'Deal Alert';

  // Build tweet — try full format first, then shorten
  const priceStr = formatPrice(price);

  // Template: fire SCORE_LABEL\n\nTitle\nPrice (discount)\n\nlink\n\nhashtags
  const buildTweet = (titleLen) => {
    const t = truncateTitle(title, titleLen);
    let tw = `${fire} ${scoreLabel}\n\n`;
    tw += `${t}\n`;
    tw += `💰 ${priceStr}${discountStr}\n\n`;
    tw += `${link}\n\n`;
    tw += hashStr;
    return tw;
  };

  // Try full title, then shrink
  for (let len = 140; len >= 40; len -= 10) {
    const tw = buildTweet(len);
    if (tw.length <= CONFIG.maxTweetLength) return tw;
  }

  // Minimal fallback
  return `${fire} ${truncateTitle(title, 60)}\n💰 ${priceStr}\n${link}\n${hashtags[0]}`;
}

// ─── Market Commentary Generator ─────────────────────────────────────────────

/**
 * Generate market commentary tweets based on deal data trends
 */
async function generateCommentary() {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600_000).toISOString();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 3600_000).toISOString();

  // Get this week's deals
  const { data: thisWeek, error: e1 } = await supabase
    .from('watch_listings')
    .select('brand, price, deal_score, title, model, source')
    .gte('created_at', oneWeekAgo)
    .not('price', 'is', null)
    .order('deal_score', { ascending: false });

  // Get last week's deals for comparison
  const { data: lastWeek, error: e2 } = await supabase
    .from('watch_listings')
    .select('brand, price, deal_score, title, model')
    .gte('created_at', twoWeeksAgo)
    .lt('created_at', oneWeekAgo)
    .not('price', 'is', null);

  if (e1 || e2) {
    console.error('❌ Error fetching commentary data:', e1?.message || e2?.message);
    return [];
  }

  const tweets = [];

  // --- Brand price trends ---
  const brandAvg = (deals) => {
    const map = {};
    for (const d of (deals || [])) {
      const b = (d.brand || 'Unknown').toLowerCase();
      if (!map[b]) map[b] = { total: 0, count: 0, brand: d.brand };
      map[b].total += d.price;
      map[b].count++;
    }
    for (const k of Object.keys(map)) {
      map[k].avg = Math.round(map[k].total / map[k].count);
    }
    return map;
  };

  const thisWeekAvg = brandAvg(thisWeek);
  const lastWeekAvg = brandAvg(lastWeek);

  for (const [key, tw] of Object.entries(thisWeekAvg)) {
    const lw = lastWeekAvg[key];
    if (!lw || lw.count < 2 || tw.count < 2) continue;

    const change = ((tw.avg - lw.avg) / lw.avg) * 100;
    if (Math.abs(change) < 3) continue; // Skip tiny changes

    const direction = change < 0 ? 'down' : 'up';
    const emoji = change < 0 ? '📉' : '📈';
    const pctStr = Math.abs(Math.round(change));
    const brand = tw.brand || key;

    let tweet = `${emoji} ${brand} prices are trending ${direction} ${pctStr}% this week\n\n`;
    tweet += `Avg price: ${formatPrice(tw.avg)} (was ${formatPrice(lw.avg)})\n`;
    tweet += `${tw.count} listings tracked\n\n`;
    tweet += `${CONFIG.siteUrl}\n`;
    tweet += `#${brand.replace(/\s+/g, '')} #WatchMarket #TheHubDeals`;

    if (tweet.length <= 280) {
      tweets.push({ type: 'trend', tweet, brand, change });
    }
  }

  // --- Hot deal volume commentary ---
  const hotDealsCount = (thisWeek || []).filter(d => d.deal_score >= 50).length;
  if (hotDealsCount > 0) {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    let tweet = `📊 This week's deal pulse:\n\n`;
    tweet += `🔥 ${hotDealsCount} hot deals found\n`;
    tweet += `📦 ${(thisWeek || []).length} total listings tracked\n\n`;

    // Top brands
    const brandCounts = {};
    for (const d of (thisWeek || [])) {
      const b = d.brand || 'Other';
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    }
    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([b, c]) => `${b} (${c})`)
      .join(', ');

    tweet += `Top brands: ${topBrands}\n\n`;
    tweet += `${CONFIG.siteUrl}\n#TheHubDeals #DealAlert`;

    if (tweet.length <= 280) {
      tweets.push({ type: 'volume', tweet });
    }
  }

  // --- Best deal of the week spotlight ---
  if (thisWeek && thisWeek.length > 0) {
    const best = thisWeek[0]; // Already sorted by deal_score desc
    if (best.deal_score >= 20) {
      let tweet = `⭐ Deal of the Week\n\n`;
      tweet += `${truncateTitle(best.title, 80)}\n`;
      tweet += `💰 ${formatPrice(best.price)} · Score: ${best.deal_score}/100\n\n`;
      tweet += `Don't sleep on this one 👀\n\n`;
      tweet += `${CONFIG.siteUrl}\n`;
      const tags = getHashtags(best.brand, best.model, best.title, 3);
      tweet += tags.join(' ');

      if (tweet.length <= 280) {
        tweets.push({ type: 'spotlight', tweet });
      }
    }
  }

  return tweets;
}

// ─── Weekly Roundup Thread ───────────────────────────────────────────────────

/**
 * Generate a multi-tweet thread for weekly roundup
 */
async function generateWeeklyThread() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();

  const { data: deals, error } = await supabase
    .from('watch_listings')
    .select('*')
    .gte('created_at', oneWeekAgo)
    .not('price', 'is', null)
    .order('deal_score', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Error fetching weekly data:', error.message);
    return [];
  }

  if (!deals || deals.length === 0) {
    console.log('ℹ️  No deals from the past week');
    return [];
  }

  const now = new Date();
  const weekLabel = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const hotDeals = deals.filter(d => d.deal_score >= 50);
  const totalDeals = deals.length;

  const thread = [];

  // Tweet 1: Thread opener
  let opener = `🧵 Weekly Deal Roundup — ${weekLabel}\n\n`;
  opener += `📊 ${totalDeals} deals tracked this week\n`;
  opener += `🔥 ${hotDeals.length} hot deals found\n\n`;
  opener += `Here are the best finds ⬇️\n\n`;
  opener += `#TheHubDeals #WatchDeals #WeeklyRoundup`;
  thread.push(opener);

  // Tweets 2-6: Top deals
  const topDeals = deals.filter(d => d.deal_score >= 10).slice(0, 5);
  for (let i = 0; i < topDeals.length; i++) {
    const d = topDeals[i];
    const fire = getFireEmoji(d.deal_score || 0);
    let tweet = `${i + 1}. ${fire} ${truncateTitle(d.title, 80)}\n\n`;
    tweet += `💰 ${formatPrice(d.price)}`;
    if (d.deal_score) tweet += ` · Score: ${d.deal_score}/100`;
    tweet += `\n📍 ${d.source || 'marketplace'}`;
    if (d.url) tweet += `\n🔗 ${d.url}`;
    
    // Trim to 280
    if (tweet.length > 280) {
      tweet = `${i + 1}. ${fire} ${truncateTitle(d.title, 60)}\n💰 ${formatPrice(d.price)}\n📍 ${d.source || 'marketplace'}`;
      if (d.url) tweet += `\n🔗 ${d.url}`;
    }
    thread.push(tweet.slice(0, 280));
  }

  // Brand breakdown tweet
  const brandCounts = {};
  for (const d of deals) {
    const b = d.brand || 'Other';
    brandCounts[b] = (brandCounts[b] || 0) + 1;
  }
  const sortedBrands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  let brandTweet = `📊 Brand breakdown this week:\n\n`;
  for (const [brand, count] of sortedBrands) {
    brandTweet += `• ${brand}: ${count} listings\n`;
  }
  brandTweet += `\nFull analysis at ${CONFIG.siteUrl}`;
  if (brandTweet.length <= 280) thread.push(brandTweet);

  // Closing tweet
  let closer = `That's this week's roundup! 🎯\n\n`;
  closer += `Follow us for daily deal alerts 🔥\n`;
  closer += `Browse all deals: ${CONFIG.siteUrl}\n\n`;
  closer += `#TheHubDeals #WatchCollector #DealAlert`;
  thread.push(closer);

  return thread;
}

// ─── Posting Engine ──────────────────────────────────────────────────────────

async function postTweet(client, text) {
  if (DRY_RUN || !client) {
    console.log('─'.repeat(50));
    console.log(text);
    console.log(`─ ${text.length}/280 chars`);
    console.log('');
    return { data: { id: `dry_run_${Date.now()}` } };
  }

  const result = await client.v2.tweet(text);
  return result;
}

async function postThread(client, tweets) {
  if (!tweets || tweets.length === 0) return [];

  const results = [];
  let lastTweetId = null;

  for (let i = 0; i < tweets.length; i++) {
    const text = tweets[i];
    console.log(`\n📤 Thread tweet ${i + 1}/${tweets.length}:`);

    if (DRY_RUN || !client) {
      console.log('─'.repeat(50));
      console.log(text);
      console.log(`─ ${text.length}/280 chars`);
      results.push({ data: { id: `dry_run_thread_${i}_${Date.now()}` } });
    } else {
      const opts = lastTweetId ? { reply: { in_reply_to_tweet_id: lastTweetId } } : {};
      const result = await client.v2.tweet(text, opts);
      lastTweetId = result.data.id;
      results.push(result);
      console.log(`✅ Posted! Tweet ID: ${result.data.id}`);
    }

    // Delay between thread tweets
    if (i < tweets.length - 1) {
      const delay = DRY_RUN ? 0 : CONFIG.threadDelayMs;
      if (delay > 0) {
        console.log(`⏳ Waiting ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  return results;
}

// ─── Fetch Hot Deals ─────────────────────────────────────────────────────────

async function fetchHotDeals(minScore) {
  const { data, error } = await supabase
    .from('watch_listings')
    .select('*')
    .gte('deal_score', minScore)
    .not('price', 'is', null)
    .order('deal_score', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Supabase error:', error.message);
    return [];
  }

  return data || [];
}

// ─── CLI Commands ────────────────────────────────────────────────────────────

async function cmdPostDeals(args) {
  const minScore = parseInt(args.find(a => a.startsWith('--score='))?.split('=')[1]) || CONFIG.scoreThreshold;
  const maxPosts = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1]) || 3;

  console.log(`\n🐦 Twitter Auto-Poster for The Hub`);
  console.log(`   Mode: ${DRY_RUN ? '🧪 DRY RUN' : '🚀 LIVE'}`);
  console.log(`   Min Score: ${minScore} | Max Posts: ${maxPosts}\n`);

  const tracker = await new DeduplicationTracker(CONFIG.postedFile).load();
  console.log(`📜 Previously posted: ${tracker.postedCount} deals`);

  // Check daily limit
  const todayPosts = tracker.getRecentPosts(24);
  if (todayPosts.length >= 8 && !DRY_RUN) {
    console.log(`⚠️  Already posted ${todayPosts.length} tweets in the last 24h (limit: 8). Skipping.`);
    return;
  }

  const deals = await fetchHotDeals(minScore);
  console.log(`🔍 Found ${deals.length} deals with score >= ${minScore}`);

  const newDeals = deals.filter(d => !tracker.isPosted(d.id));
  console.log(`📝 ${newDeals.length} not yet posted\n`);

  if (newDeals.length === 0) {
    console.log('ℹ️  No new deals to post. All caught up! 🎉');
    return;
  }

  const toPost = newDeals.slice(0, maxPosts);
  const client = getTwitterClient();

  let posted = 0;
  for (const deal of toPost) {
    const tweet = formatDealTweet(deal);
    console.log(`📤 Posting deal: ${deal.title}`);

    try {
      const result = await postTweet(client, tweet);
      tracker.markPosted(deal.id, result?.data?.id || null);
      posted++;

      // Delay between posts
      if (toPost.indexOf(deal) < toPost.length - 1) {
        const delay = DRY_RUN ? 0 : CONFIG.postDelayMs;
        if (delay > 0) {
          console.log(`⏳ Waiting ${delay / 1000}s before next post...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    } catch (err) {
      console.error(`❌ Failed to post: ${err.message}`);
      if (err.data) console.error('   API Response:', JSON.stringify(err.data));
    }
  }

  await tracker.save();
  console.log(`\n✅ Done! Posted ${posted}/${toPost.length} deals`);
  if (DRY_RUN) console.log('ℹ️  Set DRY_RUN=false or remove --dry-run to post for real');
}

async function cmdCommentary() {
  console.log(`\n📊 Market Commentary Generator`);
  console.log(`   Mode: ${DRY_RUN ? '🧪 DRY RUN' : '🚀 LIVE'}\n`);

  const tweets = await generateCommentary();

  if (tweets.length === 0) {
    console.log('ℹ️  Not enough data to generate commentary yet');
    return;
  }

  console.log(`📝 Generated ${tweets.length} commentary tweets:\n`);

  const client = getTwitterClient();

  // Pick the best one to post (or show all in dry run)
  if (DRY_RUN) {
    for (const t of tweets) {
      console.log(`[${t.type}]`);
      await postTweet(client, t.tweet);
    }
  } else {
    // Post one commentary tweet (rotate types)
    const tracker = await new DeduplicationTracker(CONFIG.postedFile).load();
    
    // Pick a random tweet from generated options
    const pick = tweets[Math.floor(Math.random() * tweets.length)];
    console.log(`📤 Posting [${pick.type}] commentary:`);
    
    try {
      const result = await postTweet(client, pick.tweet);
      console.log(`✅ Posted! Tweet ID: ${result.data.id}`);
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`);
    }
  }
}

async function cmdThread() {
  console.log(`\n🧵 Weekly Roundup Thread`);
  console.log(`   Mode: ${DRY_RUN ? '🧪 DRY RUN' : '🚀 LIVE'}\n`);

  const thread = await generateWeeklyThread();

  if (thread.length === 0) {
    console.log('ℹ️  No data for weekly roundup');
    return;
  }

  console.log(`📝 Generated ${thread.length}-tweet thread:\n`);

  const client = getTwitterClient();
  await postThread(client, thread);

  console.log(`\n✅ Thread complete!`);
}

async function cmdStats() {
  const tracker = await new DeduplicationTracker(CONFIG.postedFile).load();
  const last24h = tracker.getRecentPosts(24);
  const last7d = tracker.getRecentPosts(168);

  console.log(`\n📊 Twitter Auto-Poster Stats`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`Total posted:    ${tracker.postedCount}`);
  console.log(`Last 24 hours:   ${last24h.length}`);
  console.log(`Last 7 days:     ${last7d.length}`);
  console.log(`Last post:       ${tracker.data.stats.lastPostAt || 'Never'}`);
  console.log(`${'─'.repeat(40)}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🐦 Twitter/X Auto-Poster for The Hub Deals

Usage:
  node twitter-auto-poster.js [options]

Modes:
  (default)       Post hot deals to Twitter
  --commentary    Post a market commentary tweet
  --thread        Post a weekly roundup thread
  --stats         Show posting statistics

Options:
  --dry-run       Preview tweets without posting (or set DRY_RUN=true)
  --score=N       Minimum deal score (default: ${CONFIG.scoreThreshold})
  --max=N         Maximum deals to post (default: 3)
  -h, --help      Show this help

Environment:
  DRY_RUN=true                  Preview mode
  TWITTER_SCORE_THRESHOLD=10    Default score threshold

Examples:
  node twitter-auto-poster.js --dry-run
  node twitter-auto-poster.js --score=50 --max=5
  node twitter-auto-poster.js --commentary --dry-run
  node twitter-auto-poster.js --thread --dry-run
  DRY_RUN=true node twitter-auto-poster.js
`);
    return;
  }

  try {
    if (args.includes('--stats')) {
      await cmdStats();
    } else if (args.includes('--commentary')) {
      await cmdCommentary();
    } else if (args.includes('--thread')) {
      await cmdThread();
    } else {
      await cmdPostDeals(args);
    }
  } catch (err) {
    console.error('\n💥 Fatal error:', err.message);
    if (process.env.DEBUG === 'true') console.error(err.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  formatDealTweet,
  generateCommentary,
  generateWeeklyThread,
  getHashtags,
  DeduplicationTracker,
  CONFIG,
};
