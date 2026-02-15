#!/usr/bin/env node
/**
 * Reddit Watch Scraper Automation
 * Scrapes r/Watchexchange and r/watch_swap, stores to Supabase
 * Run: node scripts/scrape-reddit.js [limit]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { scoreDeal } = require('../src/services/deal-scorer');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Reddit API config
const SUBREDDITS = ['Watchexchange', 'watch_swap'];
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Fetch posts from a subreddit with retry + fallback
 */
async function fetchSubreddit(subreddit, limit = 50) {
  const urls = [
    `https://old.reddit.com/r/${subreddit}/new.json?limit=${limit}`,
    `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}&raw_json=1`,
  ];

  for (const url of urls) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json, text/html',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(15000),
        });

        if (response.status === 429) {
          const wait = attempt * 5000;
          console.log(`   ⏳ Rate limited, waiting ${wait/1000}s (attempt ${attempt}/3)...`);
          await sleep(wait);
          continue;
        }

        if (!response.ok) {
          console.log(`   ⚠️ ${url.split('/r/')[0]} returned ${response.status}, trying fallback...`);
          break; // try next URL
        }

        const data = await response.json();
        return data.data.children.map(c => c.data);
      } catch (error) {
        if (attempt < 3) {
          await sleep(2000 * attempt);
          continue;
        }
      }
    }
  }
  
  throw new Error(`All Reddit endpoints failed for r/${subreddit}`);
}

/**
 * Extract price from text
 * Handles: $1,234 / $1234 / 1234$ / 1234 USD / Price: 1234
 * Fixed to properly capture 4-digit prices like $2100
 */
function extractPrice(text) {
  // Find ALL potential prices and return the most reasonable one
  const allPrices = [];
  
  // Pattern 1: $1,234 or $12,345.00 (with commas)
  const withCommas = text.matchAll(/\$\s*(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)/g);
  for (const match of withCommas) {
    allPrices.push(parseFloat(match[1].replace(/,/g, '')));
  }
  
  // Pattern 2: $1234 or $12345 (without commas, 3-6 digits)
  const withDollar = text.matchAll(/\$\s*(\d{3,6})(?:\s|$|[^\d,])/g);
  for (const match of withDollar) {
    allPrices.push(parseFloat(match[1]));
  }
  
  // Pattern 3: 1234$ or 12,345$
  const dollarAfter = text.matchAll(/(\d{1,3}(?:,\d{3})+|\d{3,6})\s*\$/g);
  for (const match of dollarAfter) {
    allPrices.push(parseFloat(match[1].replace(/,/g, '')));
  }
  
  // Pattern 4: 1234 USD
  const withUSD = text.matchAll(/(\d{1,3}(?:,\d{3})*|\d{3,6})\s*USD/gi);
  for (const match of withUSD) {
    allPrices.push(parseFloat(match[1].replace(/,/g, '')));
  }
  
  // Pattern 5: Price: 1234 or Price - 1234
  const withLabel = text.matchAll(/price\s*[:\-]\s*\$?\s*(\d{1,3}(?:,\d{3})*|\d{3,6})/gi);
  for (const match of withLabel) {
    allPrices.push(parseFloat(match[1].replace(/,/g, '')));
  }
  
  // Filter to reasonable watch prices
  const validPrices = allPrices.filter(p => p >= 25 && p <= 500000);
  
  if (validPrices.length === 0) return null;
  
  // If we have multiple prices, prefer:
  // 1. The most common price (mode)
  // 2. If all unique, the median price
  // 3. Avoid obvious outliers
  
  if (validPrices.length === 1) return validPrices[0];
  
  // Sort and return median (most reliable for multiple matches)
  validPrices.sort((a, b) => a - b);
  return validPrices[Math.floor(validPrices.length / 2)];
}

/**
 * Extract watch brand from title
 */
function extractBrand(title) {
  const brands = [
    'Rolex', 'Omega', 'Tudor', 'Seiko', 'Grand Seiko', 'Cartier', 'IWC',
    'Panerai', 'Breitling', 'Tag Heuer', 'Longines', 'Tissot', 'Hamilton',
    'Oris', 'Nomos', 'Sinn', 'Mido', 'Rado', 'Zenith', 'Jaeger-LeCoultre',
    'Audemars Piguet', 'Patek Philippe', 'Vacheron Constantin', 'A. Lange',
    'Blancpain', 'Glashutte', 'Ball', 'Christopher Ward', 'Casio', 'G-Shock',
    'Orient', 'Citizen', 'Bulova', 'Timex', 'Credor', 'Moser', 'MB&F'
  ];

  const upperTitle = title.toUpperCase();
  for (const brand of brands) {
    if (upperTitle.includes(brand.toUpperCase())) {
      return brand;
    }
  }
  return 'Unknown';
}

/**
 * Extract condition from text
 */
function extractCondition(text) {
  const lower = text.toLowerCase();
  if (lower.includes('bnib') || lower.includes('brand new')) return 'new';
  if (lower.includes('mint')) return 'mint';
  if (lower.includes('excellent')) return 'excellent';
  if (lower.includes('very good')) return 'very good';
  if (lower.includes('good')) return 'good';
  if (lower.includes('fair')) return 'fair';
  return 'used';
}

/**
 * Extract images from Reddit post
 */
function extractImages(post) {
  const images = [];
  
  // Preview images
  if (post.preview?.images) {
    for (const img of post.preview.images) {
      if (img.source?.url) {
        images.push(img.source.url.replace(/&amp;/g, '&'));
      }
    }
  }
  
  // Gallery posts
  if (post.media_metadata) {
    for (const media of Object.values(post.media_metadata)) {
      if (media.s?.u) {
        images.push(media.s.u.replace(/&amp;/g, '&'));
      }
    }
  }

  // Direct image URL
  if (post.url && /\.(jpg|png|jpeg)$/i.test(post.url)) {
    images.push(post.url);
  }

  return [...new Set(images)];
}

/**
 * Calculate deal score using v2 scorer (0-100 scale)
 * Returns null if scoring fails (will be scored later)
 */
async function calculateDealScore(listing) {
  try {
    const result = await scoreDeal(listing);
    return result.score;
  } catch (error) {
    console.warn(`Scoring failed for listing: ${error.message}`);
    return null; // Will be scored later by batch rescorer
  }
}

/**
 * Parse a Reddit post into a listing
 */
async function parsePost(post, subreddit) {
  const title = post.title || '';
  
  // Only [WTS] posts
  if (!title.toUpperCase().includes('[WTS]')) {
    return null;
  }

  const fullText = title + ' ' + (post.selftext || '');
  const price = extractPrice(fullText);
  
  // Skip if no price
  if (!price || price < 50 || price > 100000) {
    return null;
  }

  const brand = extractBrand(title);
  const condition = extractCondition(fullText);
  const images = extractImages(post);

  // Clean model from title
  let model = title
    .replace(/\[WTS\]/gi, '')
    .replace(/\$\d+.*$/, '')
    .replace(/\d+\s*USD.*$/i, '')
    .trim()
    .substring(0, 100);

  const listing = {
    source: 'reddit',
    title: title.substring(0, 500),
    price: price,
    currency: 'USD',
    brand: brand,
    model: model,
    condition: condition,
    location: '',
    url: `https://www.reddit.com${post.permalink}`,
    images: images,
    seller: post.author,
    timestamp: new Date(post.created_utc * 1000).toISOString(),
    reddit_id: post.id,
    reddit_score: post.score,
    reddit_comments: post.num_comments,
    subreddit: subreddit
  };

  // Score the listing using v2 scorer (0-100 scale)
  listing.deal_score = await calculateDealScore(listing);
  
  return listing;
}

/**
 * Store listings to Supabase
 */
async function storeListings(listings) {
  if (!listings.length) return { inserted: 0, errors: [] };
  
  const truncate = (str, len) => str ? String(str).substring(0, len) : str;
  
  const records = listings.map(l => ({
    source: truncate(l.source, 50),
    title: l.title,
    price: l.price,
    currency: truncate(l.currency, 10),
    brand: truncate(l.brand, 100),
    model: truncate(l.model, 100),
    condition: truncate(l.condition, 50),
    location: truncate(l.location, 100),
    url: l.url,
    images: l.images,
    timestamp: l.timestamp,
    deal_score: l.deal_score
  }));

  const { data, error } = await supabase
    .from('watch_listings')
    .upsert(records, { 
      onConflict: 'url', 
      ignoreDuplicates: true 
    })
    .select();

  if (error) {
    console.error('Supabase error:', error);
    return { inserted: 0, errors: [error] };
  }

  return { inserted: data?.length || 0, errors: [] };
}

/**
 * Main execution
 */
async function main() {
  const limit = parseInt(process.argv[2]) || 50;
  
  console.log(`🔴 Reddit Watch Scraper`);
  console.log(`Scraping ${SUBREDDITS.join(', ')} (${limit} posts each)\n`);

  const allListings = [];

  for (const subreddit of SUBREDDITS) {
    try {
      console.log(`📡 Fetching r/${subreddit}...`);
      const posts = await fetchSubreddit(subreddit, limit);
      console.log(`   Found ${posts.length} posts`);

      let valid = 0;
      for (const post of posts) {
        const listing = await parsePost(post, subreddit);
        if (listing) {
          allListings.push(listing);
          valid++;
        }
      }
      console.log(`   Parsed ${valid} valid [WTS] listings (with v2 scores)`);

      // Rate limit between subreddits
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(`❌ Error scraping r/${subreddit}: ${error.message}`);
    }
  }

  console.log(`\n📊 Total listings: ${allListings.length}`);

  if (allListings.length > 0) {
    console.log('💾 Storing to database...');
    const result = await storeListings(allListings);
    console.log(`✅ Inserted/updated: ${result.inserted} listings`);
    
    // Show sample
    if (allListings.length > 0) {
      console.log('\n📋 Sample listings:');
      allListings.slice(0, 3).forEach((l, i) => {
        console.log(`   ${i + 1}. ${l.brand} - $${l.price} (score: ${l.deal_score})`);
      });
    }
  }

  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
