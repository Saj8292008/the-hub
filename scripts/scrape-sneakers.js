#!/usr/bin/env node
/**
 * Reddit Sneaker Scraper Automation
 * Scrapes r/sneakermarket for [WTS] posts, stores to Supabase
 * Run: node scripts/scrape-sneakers.js [limit]
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Reddit API config
const SUBREDDITS = ['sneakermarket'];
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
  const patterns = [
    // With commas and $ before: $1,234 or $12,345.00
    /\$\s*(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)/,
    // Without commas and $ before: $1234 or $12345 (3+ digits)
    /\$\s*(\d{3,6})(?:\.\d{2})?(?!\d)/,
    // Dollar sign AFTER number: 1234$ or 12,345$
    /(\d{1,3}(?:,\d{3})+|\d{3,6})\s*\$/,
    // With USD suffix
    /(\d{1,3}(?:,\d{3})*|\d{3,6})\s*USD/i,
    // Price label
    /price\s*[:\-]\s*\$?\s*(\d{1,3}(?:,\d{3})*|\d{3,6})\s*\$?/i,
    // Small amounts with $ before: $12 or $123
    /\$\s*(\d{1,3})(?:\.\d{2})?(?![,\d])/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      // Sanity check: reasonable sneaker price range ($20 - $10,000)
      if (price >= 20 && price <= 10000) {
        return price;
      }
    }
  }
  return null;
}

/**
 * Extract sneaker brand from title
 */
function extractBrand(title) {
  const brands = [
    // Nike family
    'Nike', 'Jordan', 'Air Jordan', 'Air Max', 'Dunk', 'SB',
    // Adidas family  
    'Adidas', 'Yeezy', 'Ultra Boost', 'NMD', 'Forum',
    // Premium
    'New Balance', 'ASICS', 'Puma', 'Reebok', 'Converse',
    // Luxury/Hype
    'Off-White', 'Travis Scott', 'Fear of God', 'Sacai', 'Union',
    // Others
    'Vans', 'Salomon', 'Hoka', 'On', 'Brooks', 'Saucony',
    'Balenciaga', 'Alexander McQueen', 'Common Projects', 'Maison Margiela'
  ];

  const upperTitle = title.toUpperCase();
  
  // Check for Yeezy (special case - appears with Adidas)
  if (upperTitle.includes('YEEZY')) return 'Yeezy';
  
  // Check for Jordan (special case)
  if (upperTitle.includes('JORDAN') || upperTitle.includes('AJ1') || 
      upperTitle.includes('AJ4') || upperTitle.includes('AJ3') ||
      upperTitle.includes('AJ11') || upperTitle.match(/AJ\d+/)) return 'Jordan';
  
  // Check for Dunk
  if (upperTitle.includes('DUNK')) return 'Nike Dunk';
  
  for (const brand of brands) {
    if (upperTitle.includes(brand.toUpperCase())) {
      return brand;
    }
  }
  return 'Unknown';
}

/**
 * Extract size from title
 * Returns integer (rounds half-sizes down for DB compatibility)
 */
function extractSize(title) {
  // Common patterns: Size 10, Size: 10, US 10, US10, sz 10, sz10, [10], (10)
  const patterns = [
    /size\s*[:\-]?\s*(\d+\.?\d*)/i,
    /US\s*(\d+\.?\d*)/i,
    /sz\s*[:\-]?\s*(\d+\.?\d*)/i,
    /\[(\d+\.?\d*)\]/,
    /\((\d+\.?\d*)\)/,
    /\bM\s*(\d+\.?\d*)/i,  // M10, M 10
    /\bW\s*(\d+\.?\d*)/i   // W7, W 7 (women's)
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      const size = parseFloat(match[1]);
      // Reasonable US sneaker size range
      if (size >= 3 && size <= 18) {
        // Return as integer (DB expects int)
        return Math.floor(size);
      }
    }
  }
  return null;
}

/**
 * Extract colorway from title
 */
function extractColorway(title) {
  const colorways = [
    'Bred', 'Chicago', 'Royal', 'Shadow', 'Pine Green', 'Mocha', 'Travis Scott',
    'Panda', 'Georgetown', 'Syracuse', 'Kentucky', 'UNC', 'Black Cat',
    'Triple White', 'Triple Black', 'Zebra', 'Beluga', 'Wave Runner',
    'Cream', 'Sesame', 'Static', 'Onyx', 'Bone', 'Slide', 'Foam Runner',
    'University Blue', 'Fire Red', 'Cement', 'Military Blue', 'Cool Grey',
    'Retro', 'OG', 'Low', 'High', 'Mid'
  ];

  for (const colorway of colorways) {
    if (title.toLowerCase().includes(colorway.toLowerCase())) {
      return colorway;
    }
  }
  return null;
}

/**
 * Extract condition from text
 */
function extractCondition(text) {
  const lower = text.toLowerCase();
  if (lower.includes('ds') || lower.includes('deadstock') || lower.includes('brand new')) return 'deadstock';
  if (lower.includes('vnds') || lower.includes('very near deadstock')) return 'vnds';
  if (lower.includes('9.5/10') || lower.includes('9/10')) return 'excellent';
  if (lower.includes('8/10') || lower.includes('8.5/10')) return 'good';
  if (lower.includes('worn') || lower.includes('used')) return 'used';
  return 'unknown';
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
 */
function calculateDealScore(listing) {
  let score = 5; // Base score
  
  // Brand value bonus
  const hypeBrands = ['Jordan', 'Yeezy', 'Nike Dunk', 'Off-White', 'Travis Scott'];
  const premiumBrands = ['New Balance', 'ASICS', 'Common Projects', 'Sacai'];
  
  if (hypeBrands.includes(listing.brand)) score += 1;
  if (premiumBrands.includes(listing.brand)) score += 0.5;
  
  // Condition bonus
  if (listing.condition === 'deadstock') score += 2;
  if (listing.condition === 'vnds') score += 1.5;
  if (listing.condition === 'excellent') score += 1;
  
  // Size bonus (common sizes worth more)
  const size = parseFloat(listing.size);
  if (size >= 9 && size <= 11) score += 0.5; // Most common sizes
  
  // Price-based scoring (lower relative to typical resale = better deal)
  // This is a placeholder - would need market data for accurate scoring
  if (listing.price && listing.price < 150) score += 1;
  if (listing.price && listing.price < 100) score += 0.5;
  
  // Penalize unknown info
  if (listing.brand === 'Unknown') score -= 1;
  if (!listing.size) score -= 0.5;
  
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Parse a Reddit post into a sneaker listing
 */
function parsePost(post, subreddit) {
  const title = post.title || '';
  const selftext = post.selftext || '';
  const fullText = `${title} ${selftext}`;

  // Only process [WTS] posts
  if (!title.toUpperCase().includes('[WTS]')) {
    return null;
  }

  const listing = {
    title: title.replace(/\[WTS\]/gi, '').trim(),
    url: `https://reddit.com${post.permalink}`,
    source: 'reddit',
    subreddit: subreddit,
    brand: extractBrand(title),
    model: null, // Could add model extraction
    colorway: extractColorway(title),
    size: extractSize(title),
    price: extractPrice(fullText),
    condition: extractCondition(fullText),
    images: extractImages(post),
    seller: post.author,
    timestamp: new Date(post.created_utc * 1000).toISOString(),
    deal_score: null, // Will be calculated after
    reddit_id: post.id
  };

  // Calculate deal score
  listing.deal_score = calculateDealScore(listing);

  return listing;
}

/**
 * Store listing to Supabase (with deduplication)
 */
async function storeListing(listing) {
  // Check if already exists by URL
  const { data: existing } = await supabase
    .from('sneaker_listings')
    .select('id')
    .eq('url', listing.url)
    .single();

  if (existing) {
    console.log(`  ⏭️  Skip (exists): ${listing.title.substring(0, 50)}...`);
    return { action: 'skipped' };
  }

  // Insert new listing
  // Convert size to string for VARCHAR column, handle null
  const sizeStr = listing.size !== null ? String(listing.size) : null;
  
  const { data, error } = await supabase
    .from('sneaker_listings')
    .insert([{
      title: listing.title,
      url: listing.url,
      source: listing.source,
      brand: listing.brand,
      model: listing.model,
      colorway: listing.colorway,
      size: sizeStr,
      price: listing.price,
      condition: listing.condition,
      images: listing.images,
      seller_name: listing.seller,
      timestamp: listing.timestamp,
      deal_score: listing.deal_score,
      description: listing.subreddit ? `From r/${listing.subreddit}` : null
    }])
    .select();

  if (error) {
    console.error(`  ❌ Error storing: ${error.message}`);
    return { action: 'error', error };
  }

  console.log(`  ✅ Stored: ${listing.brand} ${listing.colorway || ''} Size ${listing.size || '?'} - $${listing.price || '?'}`);
  return { action: 'inserted', data };
}

/**
 * Main scraper function
 */
async function main() {
  const limit = parseInt(process.argv[2]) || 50;
  
  console.log(`👟 Reddit Sneaker Scraper`);
  console.log(`📡 Scraping ${SUBREDDITS.join(', ')} (${limit} posts each)\n`);

  const stats = {
    total: 0,
    inserted: 0,
    skipped: 0,
    errors: 0
  };

  for (const subreddit of SUBREDDITS) {
    console.log(`\n📥 Fetching r/${subreddit}...`);
    
    try {
      const posts = await fetchSubreddit(subreddit, limit);
      console.log(`   Found ${posts.length} posts`);

      for (const post of posts) {
        const listing = parsePost(post, subreddit);
        
        if (!listing) continue; // Not a [WTS] post
        
        stats.total++;
        const result = await storeListing(listing);
        
        if (result.action === 'inserted') stats.inserted++;
        else if (result.action === 'skipped') stats.skipped++;
        else if (result.action === 'error') stats.errors++;

        // Rate limiting
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (error) {
      console.error(`❌ Error scraping r/${subreddit}:`, error.message);
      stats.errors++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   Total [WTS] posts: ${stats.total}`);
  console.log(`   New listings: ${stats.inserted}`);
  console.log(`   Skipped (existing): ${stats.skipped}`);
  console.log(`   Errors: ${stats.errors}`);
  
  return stats;
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { main, parsePost, extractBrand, extractSize, extractPrice };
