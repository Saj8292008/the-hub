#!/usr/bin/env node
/**
 * Post deals to Discord via webhook
 * Usage: node scripts/post-to-discord.js [count]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function postToDiscord(content, embed = null) {
  const body = { content };
  if (embed) {
    body.embeds = [embed];
    body.content = null;
  }

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status}`);
  }
  return true;
}

function formatDealEmbed(deal) {
  const categoryEmoji = {
    watches: '⌚',
    sneakers: '👟',
    cars: '🚗'
  };

  const emoji = categoryEmoji[deal.category] || '🔥';
  
  return {
    title: `${emoji} ${deal.title || deal.brand || 'Deal Alert'}`,
    description: deal.description || `${deal.brand || ''} ${deal.model || ''}`.trim(),
    color: 0x00ff88, // Green
    fields: [
      {
        name: '💰 Price',
        value: `$${deal.price}`,
        inline: true
      },
      {
        name: '📍 Source',
        value: deal.source || 'Unknown',
        inline: true
      },
      ...(deal.score ? [{
        name: '🎯 Score',
        value: `${deal.score}/10`,
        inline: true
      }] : [])
    ],
    url: deal.url,
    timestamp: new Date().toISOString(),
    footer: {
      text: '🔔 The Hub Deals | t.me/thehubdeals'
    }
  };
}

async function getTopDeals(count = 3) {
  // Query watch listings - get recent deals with good scores
  const { data: watches, error: watchErr } = await supabase
    .from('watch_listings')
    .select('*')
    .gte('price', 100)
    .lte('price', 15000)
    .order('deal_score', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(count * 2);

  if (watchErr) {
    console.error('Watch query error:', watchErr.message);
  }

  // Add category to watches
  const allDeals = (watches || []).map(d => ({ 
    ...d, 
    category: 'watches',
    score: d.deal_score // Normalize score field
  }));

  // Sort by score/date
  allDeals.sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Filter to unique deals
  const seen = new Set();
  const unique = [];
  for (const deal of allDeals) {
    const key = `${deal.brand}-${deal.price}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(deal);
    }
    if (unique.length >= count) break;
  }

  return unique;
}

async function main() {
  if (!WEBHOOK_URL) {
    console.error('❌ DISCORD_WEBHOOK_URL not set in .env');
    process.exit(1);
  }

  const count = parseInt(process.argv[2]) || 2;
  console.log(`🎮 Posting ${count} deals to Discord...`);

  const deals = await getTopDeals(count);
  
  if (deals.length === 0) {
    console.log('No deals found to post');
    return;
  }

  for (const deal of deals) {
    try {
      const embed = formatDealEmbed(deal);
      await postToDiscord(null, embed);
      console.log(`✅ Posted: ${deal.title || deal.brand} - $${deal.price}`);
      
      // Rate limit: wait 1 second between posts
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`❌ Failed to post deal:`, err.message);
    }
  }

  console.log(`\n✅ Done! Posted ${deals.length} deals to Discord`);
}

main().catch(console.error);
