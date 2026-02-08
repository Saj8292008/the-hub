#!/usr/bin/env node
/**
 * Instagram Auto-Poster using Official Graph API
 * Posts hot deals to Instagram Business account
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { generateDealCard } = require('./generate-deal-card');

// Config
const HOT_DEAL_THRESHOLD = parseInt(process.env.INSTAGRAM_SCORE_THRESHOLD) || 12;
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const DRY_RUN = process.env.DRY_RUN === 'true';
const OUTPUT_DIR = path.join(__dirname, '../instagram-queue');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Instagram Graph API Client
 */
class InstagramPoster {
  constructor(accessToken, accountId) {
    this.accessToken = accessToken;
    this.accountId = accountId;
    this.baseUrl = 'https://graph.facebook.com/v19.0';
  }

  /**
   * Upload image to imgbb and get URL
   */
  async uploadToImgbb(imagePath) {
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    const formData = new URLSearchParams();
    formData.append('image', imageBase64);
    
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    
    return response.data.data.url;
  }

  /**
   * Upload image and create post
   */
  async createPost(imagePath, caption) {
    try {
      console.log(`📸 Uploading image to imgbb: ${imagePath}`);

      // Step 1: Upload to imgbb and get public URL
      const imageUrl = await this.uploadToImgbb(imagePath);
      console.log(`✅ Image uploaded: ${imageUrl}`);
      
      // Step 2: Upload to Instagram (container creation)
      const containerResponse = await axios.post(
        `${this.baseUrl}/${this.accountId}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: this.accessToken
        }
      );

      const creationId = containerResponse.data.id;
      console.log(`📦 Created container: ${creationId}`);

      // Step 3: Wait for media processing (Instagram requirement)
      await this.waitForProcessing(creationId);

      // Step 4: Publish the post
      const publishResponse = await axios.post(
        `${this.baseUrl}/${this.accountId}/media_publish`,
        {
          creation_id: creationId,
          access_token: this.accessToken
        }
      );

      const postId = publishResponse.data.id;
      console.log(`✅ Published to Instagram: ${postId}`);

      return { success: true, postId, creationId };

    } catch (error) {
      console.error('❌ Instagram API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Wait for Instagram media processing
   */
  async waitForProcessing(creationId, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s

      try {
        const response = await axios.get(
          `${this.baseUrl}/${creationId}`,
          {
            params: {
              fields: 'status_code',
              access_token: this.accessToken
            }
          }
        );

        const statusCode = response.data.status_code;
        
        if (statusCode === 'FINISHED') {
          console.log('✅ Media processing complete');
          return;
        } else if (statusCode === 'ERROR') {
          throw new Error('Media processing failed');
        }
        
        console.log(`⏳ Processing... (${i + 1}/${maxAttempts})`);
      } catch (error) {
        console.log(`⏳ Checking status... (${i + 1}/${maxAttempts})`);
      }
    }

    throw new Error('Media processing timeout');
  }

  /**
   * Get account info (for testing)
   */
  async getAccountInfo() {
    const response = await axios.get(
      `${this.baseUrl}/${this.accountId}`,
      {
        params: {
          fields: 'id,username,name,biography',
          access_token: this.accessToken
        }
      }
    );
    return response.data;
  }
}

/**
 * Generate caption for deal
 */
function generateCaption(deal) {
  const emoji = getCategoryEmoji(deal.category);
  const discountPercent = deal.original_price && deal.price
    ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
    : null;

  let caption = `${emoji} ${deal.title}\n\n`;
  caption += `💰 Price: $${deal.price}`;
  
  if (deal.original_price) {
    caption += ` (was $${deal.original_price})`;
  }
  
  if (discountPercent) {
    caption += `\n🔥 ${discountPercent}% OFF!`;
  }
  
  caption += `\n⭐ Deal Score: ${deal.deal_score}/20\n\n`;
  caption += `📍 Source: ${deal.source}\n\n`;
  
  // Add relevant hashtags
  const hashtags = generateHashtags(deal);
  caption += hashtags;
  
  return caption;
}

/**
 * Generate hashtags based on deal
 */
function generateHashtags(deal) {
  const baseHashtags = ['#thehubdeals', '#dealoftheday'];
  const categoryHashtags = {
    'watches': ['#watchdeals', '#watchfam', '#horology', '#watchcollector'],
    'sneakers': ['#sneakerdeals', '#sneakerhead', '#kicks', '#sneakernews'],
    'cars': ['#cardeals', '#automotive', '#carsofinstagram'],
    'sports': ['#sportsdeals', '#sportsgear']
  };

  const tags = [...baseHashtags];
  const categoryTags = categoryHashtags[deal.category?.toLowerCase()] || [];
  tags.push(...categoryTags.slice(0, 3));

  return tags.join(' ');
}

/**
 * Get emoji for category
 */
function getCategoryEmoji(category) {
  const map = {
    'watches': '⌚',
    'sneakers': '👟',
    'cars': '🚗',
    'sports': '⚽'
  };
  return map[category?.toLowerCase()] || '🔥';
}

/**
 * Fetch hot deals from database
 */
async function getHotDeals() {
  // Query all category tables and combine
  const categories = ['watch', 'sneaker', 'car'];
  let allDeals = [];
  
  for (const category of categories) {
    const { data, error } = await supabase
      .from(`${category}_listings`)
      .select('*')
      .gte('deal_score', HOT_DEAL_THRESHOLD)
      // Note: instagram_posted_at column doesn't exist yet, so we'll get all hot deals
      // TODO: Add instagram_posted_at column to prevent re-posting
      .order('deal_score', { ascending: false })
      .limit(3);
    
    if (error) {
      console.error(`Error querying ${category}_listings:`, error);
      continue;
    }
    
    if (data) {
      allDeals = allDeals.concat(data.map(d => ({ ...d, category })));
    }
  }
  
  // Sort by score and return top 5
  return allDeals
    .sort((a, b) => b.deal_score - a.deal_score)
    .slice(0, 5);
}

/**
 * Mark deal as posted
 */
async function markAsPosted(dealId, postId, category) {
  const { error} = await supabase
    .from(`${category}_listings`)
    .update({ 
      instagram_posted_at: new Date().toISOString(),
      instagram_post_id: postId
    })
    .eq('id', dealId);

  if (error) throw error;
}

/**
 * Main execution
 */
async function main() {
  console.log('📷 Instagram Auto-Poster');
  console.log(`🔥 Looking for deals with score >= ${HOT_DEAL_THRESHOLD}...\n`);

  // Validate config
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    console.error('❌ Missing Instagram credentials!');
    console.error('Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID in .env');
    process.exit(1);
  }

  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Initialize Instagram API
  const instagram = new InstagramPoster(INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID);

  // Test connection (optional)
  try {
    const accountInfo = await instagram.getAccountInfo();
    console.log(`✅ Connected to Instagram: @${accountInfo.username}\n`);
  } catch (error) {
    console.error('❌ Failed to connect to Instagram API');
    console.error('Check your access token and account ID');
    process.exit(1);
  }

  // Fetch hot deals
  const deals = await getHotDeals();
  console.log(`Found ${deals.length} hot deal(s) to post\n`);

  if (deals.length === 0) {
    console.log('✅ No new deals to post');
    return;
  }

  // Post deals (one at a time to avoid rate limits)
  const results = [];
  for (const deal of deals) {
    try {
      console.log(`\n📌 ${deal.title}`);
      console.log(`   Score: ${deal.deal_score} | Price: $${deal.price}`);

      // Generate image
      const imagePath = path.join(OUTPUT_DIR, `deal-${deal.id}.png`);
      await generateDealCard(deal, imagePath);

      // Generate caption
      const caption = generateCaption(deal);

      if (DRY_RUN) {
        console.log('🔍 DRY RUN - Would post:');
        console.log(`   Image: ${imagePath}`);
        console.log(`   Caption:\n${caption}`);
        results.push({ deal: deal.id, status: 'dry-run', imagePath });
        continue;
      }

      // Post to Instagram
      const result = await instagram.createPost(imagePath, caption);
      
      // Mark as posted
      await markAsPosted(deal.id, result.postId, deal.category);

      console.log(`   ✅ Posted successfully!`);
      results.push({ deal: deal.id, status: 'success', postId: result.postId });

      // Rate limit: wait 60 seconds between posts
      if (deals.indexOf(deal) < deals.length - 1) {
        console.log('   ⏳ Waiting 60s before next post...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      }

    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.push({ deal: deal.id, status: 'error', error: error.message });
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Total: ${results.length}`);
  console.log(`   Success: ${results.filter(r => r.status === 'success').length}`);
  console.log(`   Failed: ${results.filter(r => r.status === 'error').length}`);
  console.log(`   Dry run: ${results.filter(r => r.status === 'dry-run').length}`);
  console.log('\n✅ Done!');
}

// Run
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { InstagramPoster, generateCaption };
