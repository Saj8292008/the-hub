/**
 * Instagram Poster Service
 * Official Graph API integration for automated deal posting
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const logger = require('../../utils/logger');

class InstagramPoster {
  constructor(supabase, config = {}) {
    this.supabase = supabase;
    this.accessToken = config.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
    this.accountId = config.accountId || process.env.INSTAGRAM_ACCOUNT_ID;
    this.imgbbApiKey = process.env.IMGBB_API_KEY;
    this.scoreThreshold = parseInt(config.scoreThreshold || process.env.INSTAGRAM_SCORE_THRESHOLD || '12');
    this.maxPostsPerRun = parseInt(config.maxPostsPerRun || '3');
    this.baseUrl = 'https://graph.facebook.com/v19.0';
    this.outputDir = path.join(__dirname, '../../../instagram-queue');
    
    // Stats
    this.stats = {
      totalPosted: 0,
      totalErrors: 0,
      lastRun: null,
      lastPost: null
    };
  }

  /**
   * Check if Instagram is configured
   */
  isConfigured() {
    return !!(this.accessToken && this.accountId && this.imgbbApiKey);
  }

  /**
   * Upload image to imgbb and get public URL
   */
  async uploadToImgbb(imagePath) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const imageBase64 = imageBuffer.toString('base64');
      
      const formData = new URLSearchParams();
      formData.append('image', imageBase64);
      
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${this.imgbbApiKey}`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      
      return response.data.data.url;
    } catch (error) {
      logger.error('Failed to upload to imgbb:', error.message);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Wait for Instagram media processing
   */
  async waitForProcessing(creationId, maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await axios.get(
        `${this.baseUrl}/${creationId}`,
        {
          params: {
            fields: 'status_code',
            access_token: this.accessToken
          }
        }
      );

      const status = response.data.status_code;
      
      if (status === 'FINISHED') {
        return true;
      } else if (status === 'ERROR') {
        throw new Error('Instagram media processing failed');
      }

      // Wait 3 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    throw new Error('Timeout waiting for media processing');
  }

  /**
   * Create and publish Instagram post
   */
  async createPost(imagePath, caption) {
    try {
      logger.info(`📸 Uploading image: ${imagePath}`);

      // Step 1: Upload to imgbb for public URL
      const imageUrl = await this.uploadToImgbb(imagePath);
      logger.info(`✅ Image hosted: ${imageUrl}`);
      
      // Step 2: Create Instagram media container
      const containerResponse = await axios.post(
        `${this.baseUrl}/${this.accountId}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: this.accessToken
        }
      );

      const creationId = containerResponse.data.id;
      logger.info(`📦 Container created: ${creationId}`);

      // Step 3: Wait for processing
      await this.waitForProcessing(creationId);

      // Step 4: Publish
      const publishResponse = await axios.post(
        `${this.baseUrl}/${this.accountId}/media_publish`,
        {
          creation_id: creationId,
          access_token: this.accessToken
        }
      );

      const postId = publishResponse.data.id;
      logger.info(`✅ Posted to Instagram: ${postId}`);

      return { success: true, postId, creationId };

    } catch (error) {
      logger.error('Instagram API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate caption for deal
   */
  generateCaption(deal) {
    const emoji = this.getCategoryEmoji(deal.category);
    const discount = deal.original_price 
      ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
      : null;

    let caption = `${emoji} ${deal.title}\n\n`;
    caption += `💰 $${deal.price}`;
    
    if (deal.original_price) {
      caption += ` (was $${deal.original_price})`;
    }
    
    if (discount) {
      caption += `\n📉 Save ${discount}% ($${deal.original_price - deal.price})`;
    }

    caption += `\n\n⚡️ Get deals 2hrs earlier: t.me/thehubdeals`;
    caption += `\n📧 Newsletter: thehub.deals`;
    
    // Hashtags
    const hashtags = this.getHashtags(deal.category);
    caption += `\n\n${hashtags}`;

    return caption;
  }

  /**
   * Get category emoji
   */
  getCategoryEmoji(category) {
    const emojis = {
      'watches': '⌚️',
      'sneakers': '👟',
      'cars': '🚗',
      'sports': '⚽️'
    };
    return emojis[category?.toLowerCase()] || '🔥';
  }

  /**
   * Get relevant hashtags
   */
  getHashtags(category) {
    const commonTags = '#TheHub #HotDeals #DealAlert';
    
    const categoryTags = {
      'watches': '#WatchDeals #LuxuryWatches #WatchCollector',
      'sneakers': '#SneakerDeals #Sneakerhead #SneakerCommunity',
      'cars': '#CarDeals #Cars #Automotive',
      'sports': '#SportsDeals #SportsGear #Athlete'
    };

    const catTag = categoryTags[category?.toLowerCase()] || '#Deals';
    return `${commonTags} ${catTag}`;
  }

  /**
   * Run posting cycle - posts hot deals
   */
  async runCycle(dryRun = false) {
    this.stats.lastRun = new Date().toISOString();
    
    if (!this.isConfigured()) {
      logger.warn('Instagram not configured - skipping');
      return { posted: 0, skipped: 0, errors: 0, message: 'Not configured' };
    }

    try {
      logger.info(`📸 Instagram cycle starting (threshold: ${this.scoreThreshold})`);

      // Get hot deals not yet posted to Instagram
      const { data: deals, error } = await this.supabase.client
        .from('deals')
        .select('*')
        .gte('score', this.scoreThreshold)
        .is('instagram_posted_at', null)
        .order('score', { ascending: false })
        .limit(this.maxPostsPerRun);

      if (error) {
        logger.error('Failed to fetch deals:', error);
        return { posted: 0, skipped: 0, errors: 1, message: error.message };
      }

      if (!deals || deals.length === 0) {
        logger.info('No new deals to post');
        return { posted: 0, skipped: 0, errors: 0, message: 'No deals found' };
      }

      logger.info(`Found ${deals.length} deals to post`);

      let posted = 0;
      let errors = 0;

      for (const deal of deals) {
        try {
          // Check if image exists in queue
          const imagePath = path.join(this.outputDir, `deal-${deal.id}.png`);
          
          try {
            await fs.access(imagePath);
          } catch {
            logger.warn(`Image not found for deal ${deal.id}, skipping`);
            continue;
          }

          if (dryRun) {
            logger.info(`[DRY RUN] Would post: ${deal.title}`);
            continue;
          }

          // Generate caption
          const caption = this.generateCaption(deal);

          // Post to Instagram
          const result = await this.createPost(imagePath, caption);

          // Mark as posted in database
          const { error: updateError } = await this.supabase.client
            .from('deals')
            .update({
              instagram_posted_at: new Date().toISOString(),
              instagram_post_id: result.postId
            })
            .eq('id', deal.id);

          if (updateError) {
            logger.error('Failed to update database:', updateError);
          }

          posted++;
          this.stats.totalPosted++;
          this.stats.lastPost = new Date().toISOString();
          
          logger.info(`✅ Posted deal: ${deal.title}`);

          // Rate limit: wait 60 seconds between posts
          if (posted < deals.length) {
            logger.info('Waiting 60s before next post...');
            await new Promise(resolve => setTimeout(resolve, 60000));
          }

        } catch (error) {
          logger.error(`Failed to post deal ${deal.id}:`, error.message);
          errors++;
          this.stats.totalErrors++;
        }
      }

      const message = dryRun 
        ? `Dry run complete: ${deals.length} deals ready`
        : `Posted ${posted} deals to Instagram`;

      logger.info(`📸 Instagram cycle complete: ${message}`);

      return { 
        posted, 
        skipped: deals.length - posted - errors, 
        errors,
        message 
      };

    } catch (error) {
      logger.error('Instagram cycle error:', error);
      return { posted: 0, skipped: 0, errors: 1, message: error.message };
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      accountId: this.accountId ? `${this.accountId.substring(0, 8)}...` : null,
      scoreThreshold: this.scoreThreshold,
      maxPostsPerRun: this.maxPostsPerRun,
      stats: this.stats
    };
  }
}

module.exports = InstagramPoster;
