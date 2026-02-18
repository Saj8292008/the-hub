#!/usr/bin/env node
/**
 * auto-blog-writer.js — AI-powered SEO blog post generator
 * 
 * Queries Supabase for trending deals/brands from the last 7 days,
 * generates SEO-optimized blog posts using OpenRouter (free model),
 * and outputs markdown files to content/blog/
 * 
 * Topics rotate:
 * - "Best [Brand] Deals This Week"
 * - "Price Guide: [Model]"
 * - "Is [Watch] Worth It in 2026?"
 * 
 * Usage:
 *   node scripts/auto-blog-writer.js               # Auto-pick trending topic
 *   node scripts/auto-blog-writer.js --topic=brand # Force "Best Brand Deals"
 *   node scripts/auto-blog-writer.js --topic=price # Force "Price Guide"
 *   node scripts/auto-blog-writer.js --topic=worth # Force "Is It Worth It"
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const SITE_URL = 'https://thehubdeals.com';

// Free, fast model for blog generation
const MODEL = 'openai/gpt-4o-mini'; // Fast and cheap alternative

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'blog');
const TOPIC_TYPES = ['brand', 'price', 'worth'];

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getTrendingDeals(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from('watch_listings')
    .select('*')
    .gte('scraped_at', cutoffDate.toISOString())
    .order('deal_score', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Error fetching deals:', error.message);
    return [];
  }

  return data || [];
}

async function getTrendingBrands(days = 7) {
  const deals = await getTrendingDeals(days);
  
  const brandCounts = {};
  deals.forEach(deal => {
    const brand = deal.brand || extractBrandFromTitle(deal.title);
    if (brand) {
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    }
  });

  return Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([brand, count]) => ({ brand, count }));
}

function extractBrandFromTitle(title) {
  const brands = [
    'Rolex', 'Omega', 'Tudor', 'Seiko', 'Grand Seiko', 'Breitling',
    'Tag Heuer', 'Cartier', 'IWC', 'Panerai', 'Hamilton', 'Tissot',
    'Casio', 'Citizen', 'Orient', 'Longines', 'Oris', 'Nomos',
    'Zenith', 'Jaeger-LeCoultre', 'Vacheron Constantin', 'Audemars Piguet',
    'Patek Philippe', 'Hublot', 'Richard Mille', 'Apple Watch'
  ];

  for (const brand of brands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return null;
}

// ============================================================================
// TOPIC GENERATION
// ============================================================================

function pickRandomTopic() {
  return TOPIC_TYPES[Math.floor(Math.random() * TOPIC_TYPES.length)];
}

async function generateTopicData(topicType) {
  const deals = await getTrendingDeals(7);
  const trendingBrands = await getTrendingBrands(7);

  // Fallback if no deals found
  if (deals.length === 0) {
    console.warn('⚠️  No deals found, using fallback data');
    return {
      type: 'brand',
      brand: 'Rolex',
      deals: [],
      title: 'Best Rolex Deals This Week',
      meta: {
        description: 'Find the best Rolex watch deals this week. Updated daily with hand-picked deals from Reddit, eBay, WatchUSeek, and more.',
        keywords: 'Rolex, Rolex deals, Rolex watch, luxury watches, watch deals'
      }
    };
  }

  switch (topicType) {
    case 'brand': {
      const topBrand = trendingBrands[0]?.brand || deals[0]?.brand || 'Seiko';
      const brandDeals = deals.filter(d => 
        (d.brand || extractBrandFromTitle(d.title))?.toLowerCase() === topBrand.toLowerCase()
      ).slice(0, 10);
      
      return {
        type: 'brand',
        brand: topBrand,
        deals: brandDeals,
        title: `Best ${topBrand} Deals This Week`,
        meta: {
          description: `Find the best ${topBrand} watch deals this week. Updated daily with hand-picked deals from Reddit, eBay, WatchUSeek, and more.`,
          keywords: `${topBrand}, ${topBrand} deals, ${topBrand} watch, luxury watches, watch deals`
        }
      };
    }

    case 'price': {
      const topModel = deals[0];
      const model = topModel?.model || topModel?.title?.substring(0, 50) || 'Rolex Submariner';
      const similarDeals = deals
        .filter(d => d.model?.toLowerCase().includes(model.toLowerCase()) || 
                     d.title?.toLowerCase().includes(model.toLowerCase()))
        .slice(0, 10);

      return {
        type: 'price',
        model,
        deals: similarDeals,
        title: `Price Guide: ${model}`,
        meta: {
          description: `Complete price guide for ${model}. Compare prices across markets and find the best deals.`,
          keywords: `${model} price, ${model} value, watch pricing, luxury watch value`
        }
      };
    }

    case 'worth': {
      const featuredDeal = deals[0];
      const watchName = featuredDeal?.title?.replace(/^\[WTS\]\s*/i, '').substring(0, 60) || 'Omega Speedmaster';
      
      return {
        type: 'worth',
        watchName,
        deal: featuredDeal,
        deals: deals.slice(0, 5),
        title: `Is ${watchName} Worth It in 2026?`,
        meta: {
          description: `Detailed analysis: Is ${watchName} worth buying in 2026? Price trends, market analysis, and expert insights.`,
          keywords: `${watchName}, watch review, worth it, luxury watch buying guide`
        }
      };
    }

    default:
      throw new Error(`Unknown topic type: ${topicType}`);
  }
}

// ============================================================================
// AI BLOG GENERATION
// ============================================================================

async function generateBlogPost(topicData) {
  const prompt = buildPrompt(topicData);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': SITE_URL,
      'X-Title': 'The Hub Deals Blog'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert watch journalist and SEO content writer. Write engaging, informative blog posts optimized for search engines. Use natural language, include relevant keywords, and structure content with clear headings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

function buildPrompt(topicData) {
  const dealsList = topicData.deals?.slice(0, 5).map(d => {
    const price = d.price ? `$${d.price}` : 'See listing';
    const source = d.source || 'The Hub';
    const condition = d.condition || 'Used';
    return `- ${d.title} — ${price} (${condition}, via ${source})`;
  }).join('\n') || '';

  switch (topicData.type) {
    case 'brand':
      return `Write a 600-800 word blog post titled "${topicData.title}".

**Target audience:** Watch enthusiasts looking for ${topicData.brand} deals

**Content requirements:**
- Brief introduction to ${topicData.brand} and why it's a great brand
- Highlight current market trends for ${topicData.brand}
- Feature these deals (add context, explain why they're good):
${dealsList}
- Include tips for buying ${topicData.brand} watches
- End with a call-to-action encouraging readers to browse more deals

**SEO keywords to include naturally:**
${topicData.meta.keywords}

**Internal links to include:**
- Link to "deals" page: [Browse all ${topicData.brand} deals](${SITE_URL}/deals?brand=${slugify(topicData.brand)})
- Link to homepage: [The Hub Deals](${SITE_URL})

**Tone:** Friendly, informative, helpful. Write like an experienced watch collector sharing tips with a friend.`;

    case 'price':
      return `Write a 600-800 word blog post titled "${topicData.title}".

**Target audience:** Buyers researching ${topicData.model} pricing

**Content requirements:**
- Explain what affects ${topicData.model} pricing (condition, year, box/papers, etc.)
- Current market price ranges (reference these deals as examples):
${dealsList}
- Price trends: Is it going up or down? Why?
- Best times/places to buy
- Red flags to watch out for
- End with actionable advice

**SEO keywords:**
${topicData.meta.keywords}

**Internal links:**
- [Compare ${topicData.model} prices](${SITE_URL}/deals?search=${slugify(topicData.model)})
- [The Hub Deals homepage](${SITE_URL})

**Tone:** Expert but accessible. Think "helpful buyer's guide".`;

    case 'worth':
      return `Write a 600-800 word blog post titled "${topicData.title}".

**Target audience:** Someone considering buying this watch

**Content requirements:**
- Quick overview of the watch and its appeal
- Pros: What makes it great?
- Cons: Any downsides or concerns?
- Current market value and price trends
- Compare to alternatives
- Final verdict: Who is it best for?
- Feature this deal as an example:
${dealsList}

**SEO keywords:**
${topicData.meta.keywords}

**Internal links:**
- [Browse similar watches](${SITE_URL}/deals)
- [The Hub Deals](${SITE_URL})

**Tone:** Balanced, honest review. Help the reader make an informed decision.`;

    default:
      throw new Error(`Unknown topic type: ${topicData.type}`);
  }
}

// ============================================================================
// MARKDOWN GENERATION
// ============================================================================

function createMarkdownFile(topicData, content) {
  const slug = slugify(topicData.title);
  const date = getTodayDateString();
  const filename = `${date}-${slug}.md`;
  const filepath = path.join(CONTENT_DIR, filename);

  const markdown = `---
title: "${topicData.title}"
date: ${date}
author: The Hub Team
description: "${topicData.meta.description}"
keywords: "${topicData.meta.keywords}"
category: ${topicData.type}
featured: true
---

${content}

---

*This post was automatically generated based on real market data from The Hub Deals. Prices and availability are subject to change.*

**Related Links:**
- [Browse all deals](${SITE_URL}/deals)
- [Sign up for deal alerts](${SITE_URL}/signup)
`;

  fs.writeFileSync(filepath, markdown, 'utf8');
  console.log(`✅ Blog post saved: ${filename}`);
  return { filename, filepath };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 Auto-SEO Blog Writer starting...\n');

  // Check for required environment variables
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in .env');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Supabase credentials not found in .env');
    process.exit(1);
  }

  // Ensure content directory exists
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    console.log('📁 Created content/blog/ directory');
  }

  // Pick topic (or use CLI argument)
  const args = process.argv.slice(2);
  const topicArg = args.find(arg => arg.startsWith('--topic='));
  let topicType = topicArg ? topicArg.split('=')[1] : pickRandomTopic();

  if (!TOPIC_TYPES.includes(topicType)) {
    console.log(`⚠️  Unknown topic type "${topicType}", using random`);
    topicType = pickRandomTopic();
  }

  console.log(`📝 Generating topic type: ${topicType}\n`);

  // Generate topic data
  console.log('📊 Fetching trending deals from Supabase...');
  const topicData = await generateTopicData(topicType);
  console.log(`✅ Topic: "${topicData.title}"`);
  console.log(`   Deals found: ${topicData.deals?.length || 0}\n`);

  // Generate blog post with AI
  console.log('🤖 Generating blog post with OpenRouter AI...');
  const content = await generateBlogPost(topicData);
  console.log('✅ Blog post generated\n');

  // Save markdown file
  console.log('💾 Saving markdown file...');
  const result = createMarkdownFile(topicData, content);

  console.log('\n✨ Done!');
  console.log(`📄 File: ${result.filename}`);
  console.log(`📂 Path: ${result.filepath}`);
  console.log('\nNext step: Run `node scripts/publish-blog.js ${result.filename}` to publish');
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { generateBlogPost, generateTopicData, getTrendingDeals };
