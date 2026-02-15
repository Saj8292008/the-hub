#!/usr/bin/env node
/**
 * auto-content-pipeline.js — Daily content generation pipeline
 * 
 * Pulls latest listings from The Hub API, generates formatted content,
 * and outputs a daily digest for Discord/Telegram posting.
 * 
 * Usage:
 *   node scripts/auto-content-pipeline.js all       # Full pipeline
 *   node scripts/auto-content-pipeline.js digest     # Just the digest
 *   node scripts/auto-content-pipeline.js social     # Just social posts
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const HUB_API = process.env.HUB_API_URL || 'http://localhost:4003';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'daily');

async function getLatestListings(limit = 20) {
  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('watch_listings')
      .select('title, price, source, url, brand, score, condition, scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(limit);
    
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    // Fall through to API
  }

  // Fallback: Hub API dashboard
  try {
    const res = await fetch(`${HUB_API}/api/dashboard/status`);
    const dashboard = await res.json();
    return dashboard.activity || [];
  } catch (e) {
    console.error('❌ Could not fetch listings from Supabase or API');
    return [];
  }
}

function generateDigest(listings) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const topDeals = listings
    .filter(l => l.price && l.price > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  const priceRanges = {
    under200: listings.filter(l => l.price > 0 && l.price < 200).length,
    under1000: listings.filter(l => l.price >= 200 && l.price < 1000).length,
    under5000: listings.filter(l => l.price >= 1000 && l.price < 5000).length,
    over5000: listings.filter(l => l.price >= 5000).length,
  };

  const brands = {};
  listings.forEach(l => {
    const brand = l.brand || extractBrand(l.title);
    if (brand) brands[brand] = (brands[brand] || 0) + 1;
  });
  const topBrands = Object.entries(brands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Discord format (markdown)
  let discord = `💎 **Daily Market Digest** 💎\n📅 ${dateStr}\n\n`;
  discord += `**📊 Market Snapshot**\n`;
  discord += `- Total new listings: ${listings.length}\n`;
  discord += `- Under $200: ${priceRanges.under200} | $200-$1K: ${priceRanges.under1000}\n`;
  discord += `- $1K-$5K: ${priceRanges.under5000} | $5K+: ${priceRanges.over5000}\n\n`;

  if (topBrands.length > 0) {
    discord += `**🏷️ Trending Brands**\n`;
    topBrands.forEach(([brand, count]) => {
      discord += `- ${brand}: ${count} listings\n`;
    });
    discord += '\n';
  }

  discord += `**🔥 Top Deals**\n`;
  topDeals.forEach((deal, i) => {
    const title = deal.title.replace(/^\[WTS\]\s*/i, '').substring(0, 80);
    const price = deal.price ? `$${deal.price.toLocaleString()}` : 'See listing';
    discord += `${i + 1}. **${title}** — ${price}\n`;
  });

  discord += `\n🌐 **thehubdeals.com** | Powered by The Hub 🚀`;

  // Telegram format (plain text + HTML)
  let telegram = `📊 Daily Watch Market Update\n\n`;
  telegram += `${listings.length} new listings today\n`;
  topDeals.slice(0, 3).forEach(deal => {
    const title = deal.title.replace(/^\[WTS\]\s*/i, '').substring(0, 60);
    const price = deal.price ? `$${deal.price.toLocaleString()}` : '?';
    telegram += `\n⌚ ${title}\n💰 ${price}\n`;
  });
  telegram += `\n🔗 thehubdeals.com\n#watches #deals`;

  return { discord, telegram, topDeals, priceRanges, topBrands, dateStr };
}

function extractBrand(title) {
  const brands = ['Omega', 'Rolex', 'Seiko', 'Tudor', 'Longines', 'Breitling', 
    'Tag Heuer', 'Cartier', 'IWC', 'Panerai', 'Grand Seiko', 'Oris', 
    'Hamilton', 'Tissot', 'Sinn', 'Nomos', 'Zenith', 'Casio', 'G-Shock'];
  
  const upper = (title || '').toLowerCase();
  for (const b of brands) {
    if (upper.includes(b.toLowerCase())) return b;
  }
  return null;
}

async function run(mode) {
  console.log(`📝 Content Pipeline — Mode: ${mode}`);
  console.log(`📅 ${new Date().toISOString()}`);

  // Ensure output directory exists
  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  const listings = await getLatestListings(30);
  console.log(`📦 Fetched ${listings.length} listings`);

  if (listings.length === 0) {
    console.log('⚠️ No listings found. Skipping content generation.');
    process.exit(0);
  }

  const content = generateDigest(listings);

  // Write output files
  const dateSlug = new Date().toISOString().split('T')[0];
  
  if (mode === 'all' || mode === 'digest') {
    const digestPath = path.join(CONTENT_DIR, `${dateSlug}-digest.md`);
    fs.writeFileSync(digestPath, content.discord);
    console.log(`✅ Discord digest → ${digestPath}`);
  }

  if (mode === 'all' || mode === 'social') {
    const socialPath = path.join(CONTENT_DIR, `${dateSlug}-social.md`);
    fs.writeFileSync(socialPath, content.telegram);
    console.log(`✅ Social post → ${socialPath}`);
  }

  // Write combined JSON for other tools
  const jsonPath = path.join(CONTENT_DIR, `${dateSlug}-data.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({
    date: dateSlug,
    listings: listings.length,
    topDeals: content.topDeals.map(d => ({ title: d.title, price: d.price, source: d.source })),
    priceRanges: content.priceRanges,
    topBrands: content.topBrands,
  }, null, 2));
  console.log(`✅ Data JSON → ${jsonPath}`);

  console.log('\n--- Discord Digest Preview ---');
  console.log(content.discord.substring(0, 300) + '...');
  console.log('\n--- Telegram Post Preview ---');
  console.log(content.telegram);
  console.log('\n✅ Pipeline complete!');
}

const mode = process.argv[2] || 'all';
run(mode).catch(err => {
  console.error('❌ Pipeline error:', err.message);
  process.exit(1);
});
