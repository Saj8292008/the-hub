#!/usr/bin/env node
/**
 * 🎯 Reddit Lead Scanner
 * Finds [WTB] posts and matches them with Hub listings
 * Run: node scripts/reddit-lead-scanner.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function fetchReddit(subreddit, limit = 50) {
  const urls = [
    `https://old.reddit.com/r/${subreddit}/new.json?limit=${limit}`,
    `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}&raw_json=1`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      return data.data.children.map(c => c.data);
    } catch (e) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return [];
}

function extractBrand(text) {
  const brands = [
    'Rolex', 'Omega', 'Tudor', 'Seiko', 'Grand Seiko', 'Cartier', 'IWC',
    'Panerai', 'Breitling', 'Tag Heuer', 'Longines', 'Tissot', 'Hamilton',
    'Oris', 'Nomos', 'Sinn', 'Casio', 'G-Shock', 'Orient', 'Citizen',
    'Audemars Piguet', 'Patek Philippe', 'Vacheron Constantin'
  ];
  const upper = text.toUpperCase();
  for (const b of brands) {
    if (upper.includes(b.toUpperCase())) return b;
  }
  return null;
}

function extractBudget(text) {
  const match = text.match(/\$\s*([\d,]+)/);
  if (match) return parseFloat(match[1].replace(/,/g, ''));
  const usd = text.match(/([\d,]+)\s*USD/i);
  if (usd) return parseFloat(usd[1].replace(/,/g, ''));
  return null;
}

function scoreLead(post, matchCount) {
  let score = 30; // base
  if (post.title.toUpperCase().includes('[WTB]')) score += 20;
  if (extractBrand(post.title)) score += 15;
  if (extractBudget(post.title + ' ' + (post.selftext || ''))) score += 10;
  if (matchCount > 0) score += 25;
  if (post.num_comments < 3) score += 5; // less competition
  const ageHours = (Date.now() / 1000 - post.created_utc) / 3600;
  if (ageHours < 6) score += 10;
  else if (ageHours < 24) score += 5;
  return Math.min(score, 100);
}

async function findMatches(brand, budget) {
  let query = supabase.from('watch_listings').select('title, price, url, deal_score').limit(5);
  if (brand) query = query.ilike('brand', `%${brand}%`);
  if (budget) {
    query = query.gte('price', budget * 0.7).lte('price', budget * 1.3);
  }
  const { data } = await query;
  return data || [];
}

async function main() {
  console.log('🎯 Reddit Lead Scanner\n');

  const subreddits = ['Watchexchange', 'watch_swap'];
  const leads = [];

  for (const sub of subreddits) {
    console.log(`📡 Scanning r/${sub}...`);
    const posts = await fetchReddit(sub, 50);
    
    const wtbPosts = posts.filter(p => {
      const t = (p.title || '').toUpperCase();
      return t.includes('[WTB]') || t.includes('[WANT TO BUY]') || t.includes('LOOKING FOR');
    });

    console.log(`   Found ${wtbPosts.length} [WTB] posts`);

    for (const post of wtbPosts) {
      const brand = extractBrand(post.title + ' ' + (post.selftext || ''));
      const budget = extractBudget(post.title + ' ' + (post.selftext || ''));
      const matches = await findMatches(brand, budget);
      const score = scoreLead(post, matches.length);

      leads.push({
        title: post.title,
        author: post.author,
        brand,
        budget,
        score,
        matches: matches.length,
        url: `https://www.reddit.com${post.permalink}`,
        age: Math.round((Date.now() / 1000 - post.created_utc) / 3600) + 'h',
        topMatch: matches[0] || null
      });
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  // Sort by score
  leads.sort((a, b) => b.score - a.score);

  console.log(`\n📊 Results: ${leads.length} WTB leads found\n`);

  const highQuality = leads.filter(l => l.score >= 70);
  const medium = leads.filter(l => l.score >= 50 && l.score < 70);

  if (highQuality.length > 0) {
    console.log(`🔥 HIGH QUALITY (${highQuality.length}):`);
    highQuality.forEach(l => {
      console.log(`   [${l.score}] ${l.title}`);
      console.log(`      Brand: ${l.brand || '?'} | Budget: ${l.budget ? '$' + l.budget : '?'} | Matches: ${l.matches} | Age: ${l.age}`);
      if (l.topMatch) console.log(`      💡 Match: ${l.topMatch.title} ($${l.topMatch.price})`);
    });
  }

  if (medium.length > 0) {
    console.log(`\n📋 MEDIUM (${medium.length}):`);
    medium.forEach(l => {
      console.log(`   [${l.score}] ${l.title} (${l.brand || '?'}, ${l.age})`);
    });
  }

  console.log(`\n✅ Done! ${highQuality.length} high-quality, ${medium.length} medium leads.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
