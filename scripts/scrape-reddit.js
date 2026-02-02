#!/usr/bin/env node
/**
 * Reddit Watch Scraper Automation
 * Scrapes r/Watchexchange and r/watch_swap, stores to Supabase
 * Run: node scripts/scrape-reddit.js [limit]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Reddit API config
const SUBREDDITS = ['Watchexchange', 'watch_swap'];
const USER_AGENT = 'Mozilla/5.0 (compatible; TheHubBot/1.0)';

/**
 * Fetch posts from a subreddit
 */
async function fetchSubreddit(subreddit, limit = 50) {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 15000
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data.children.map(c => c.data);
}

/**
 * Extract price from text
 * Handles: $1,234 / $1234 / 1234$ / 1234 USD / Price: 1234
 */
function extractPrice(text) {
  // Patterns ordered by specificity (most specific first)
  const patterns = [
    // With commas and $ before: $1,234 or $12,345.00
    /\$\s*(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)/,
    // Without commas and $ before: $1234 or $12345 (3+ digits)
    /\$\s*(\d{3,6})(?:\.\d{2})?(?!\d)/,
    // Dollar sign AFTER number: 1234$ or 12,345$
    /(\d{1,3}(?:,\d{3})+|\d{3,6})\s*\$/,
    // With USD suffix
    /(\d{1,3}(?:,\d{3})*|\d{3,6})\s*USD/i,
    // Price label (common in formatted posts)
    /price\s*[:\-]\s*\$?\s*(\d{1,3}(?:,\d{3})*|\d{3,6})\s*\$?/i,
    // Small amounts with $ before: $12 or $123
    /\$\s*(\d{1,3})(?:\.\d{2})?(?![,\d])/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      // Sanity check: reasonable watch price range
      if (price >= 25 && price <= 500000) {
        return price;
      }
    }
  }
  return null;
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
 * Calculate a simple deal score (1-10)
 * Higher is better deal
 */
function calculateDealScore(listing) {
  let score = 5; // Base score
  
  // Brand recognition bonus
  const premiumBrands = ['Rolex', 'Omega', 'Tudor', 'Grand Seiko', 'Cartier', 'IWC', 'Panerai'];
  const midBrands = ['Seiko', 'Hamilton', 'Oris', 'Tissot', 'Longines', 'Sinn', 'Ball'];
  
  if (premiumBrands.includes(listing.brand)) score += 1;
  else if (midBrands.includes(listing.brand)) score += 0.5;
  
  // Condition bonus
  if (listing.condition === 'new' || listing.condition === 'mint') score += 1;
  else if (listing.condition === 'excellent') score += 0.5;
  
  // Price range sweetspot ($500-$5000 is active market)
  if (listing.price >= 500 && listing.price <= 5000) score += 0.5;
  
  // Has images bonus
  if (listing.images && listing.images.length >= 3) score += 0.5;
  
  // Reddit engagement (if available)
  if (listing.reddit_score > 10) score += 0.5;
  if (listing.reddit_comments > 5) score += 0.5;
  
  // Cap at 10, round to integer for DB
  return Math.min(10, Math.round(score));
}

/**
 * Parse a Reddit post into a listing
 */
function parsePost(post, subreddit) {
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

  listing.deal_score = calculateDealScore(listing);
  
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
        const listing = parsePost(post, subreddit);
        if (listing) {
          allListings.push(listing);
          valid++;
        }
      }
      console.log(`   Parsed ${valid} valid [WTS] listings`);

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
