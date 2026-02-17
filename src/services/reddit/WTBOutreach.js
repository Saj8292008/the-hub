const WTBMonitor = require('./WTBMonitor');
const RedditAPIClient = require('./RedditAPIClient');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * WTB Auto-Outreach System
 * Scans Reddit WTB threads, matches with inventory, posts personalized comments via Reddit API
 */
class WTBOutreach {
  constructor(config = {}) {
    this.wtbMonitor = new WTBMonitor();
    this.redditClient = new RedditAPIClient(config.reddit);
    
    // Initialize Supabase
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Tracking file to avoid duplicate posts
    this.trackingFile = path.join(__dirname, '../../../data/wtb-outreach-tracking.json');
    this.postedComments = new Set();
    
    // Comment templates for variety
    this.templates = [
      {
        id: 'helpful',
        text: (match) => `Hey! I noticed you're looking for a ${match.request.brand}${match.request.models.length > 0 ? ' ' + match.request.models[0] : ''}. We actually have ${match.deals.length > 1 ? 'a few options' : 'one'} that might interest you on thehubdeals.com${this.formatDeals(match.deals, 1)}. Feel free to check it out!`
      },
      {
        id: 'direct',
        text: (match) => `I see you're searching for a ${match.request.brand}. Found ${match.deals.length === 1 ? 'this listing' : 'these listings'} that match${this.formatDeals(match.deals, 2)}. More details at thehubdeals.com. Hope this helps!`
      },
      {
        id: 'casual',
        text: (match) => `Looking for a ${match.request.brand}${match.request.models.length > 0 ? ' ' + match.request.models[0] : ''}? We've got ${match.deals.length === 1 ? 'one' : 'some'} on thehubdeals.com right now${this.formatDeals(match.deals, 1)}. Worth a look!`
      },
      {
        id: 'detailed',
        text: (match) => {
          const deal = match.deals[0];
          const priceMatch = match.request.priceRange ? ` (${this.formatPriceMatch(deal, match.request.priceRange)})` : '';
          return `Hey! Just saw your WTB post. We have a ${deal.brand} ${deal.model} listed at $${deal.price}${priceMatch}. Check it out on thehubdeals.com${match.deals.length > 1 ? ` – we have ${match.deals.length - 1} other option${match.deals.length > 2 ? 's' : ''} too` : ''}. Good luck with your search!`;
        }
      }
    ];

    // Minimum transactions to target (more reliable buyers)
    this.minTransactions = config.minTransactions || 0;
    
    // Maximum comments per run (safety limit)
    this.maxCommentsPerRun = config.maxCommentsPerRun || 10;
    
    // Minimum deal score to include
    this.minDealScore = config.minDealScore || 50;
  }

  /**
   * Format deals for comment text
   */
  formatDeals(deals, limit = 2) {
    if (deals.length === 0) return '';
    if (deals.length === 1) {
      return ` – ${deals[0].brand} ${deals[0].model} at $${deals[0].price}`;
    }
    
    const shown = deals.slice(0, limit);
    const formatted = shown.map(d => `${d.brand} ${d.model} ($${d.price})`).join(', ');
    const more = deals.length > limit ? ` and ${deals.length - limit} more` : '';
    return ` – ${formatted}${more}`;
  }

  /**
   * Format price match info
   */
  formatPriceMatch(deal, priceRange) {
    if (!priceRange || !deal.price) return '';
    
    const percentage = ((priceRange.max - deal.price) / priceRange.max * 100).toFixed(0);
    if (deal.price <= priceRange.max * 0.9) {
      return `${percentage}% under your budget!`;
    }
    return 'within your budget';
  }

  /**
   * Load tracking data (previously posted comments)
   */
  async loadTracking() {
    try {
      const data = await fs.readFile(this.trackingFile, 'utf-8');
      const tracking = JSON.parse(data);
      this.postedComments = new Set(tracking.postedComments || []);
      logger.info(`📋 Loaded tracking: ${this.postedComments.size} previously posted comments`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('📋 No tracking file found, starting fresh');
        this.postedComments = new Set();
      } else {
        logger.error(`❌ Failed to load tracking: ${error.message}`);
        this.postedComments = new Set();
      }
    }
  }

  /**
   * Save tracking data
   */
  async saveTracking() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.trackingFile);
      await fs.mkdir(dataDir, { recursive: true });
      
      const tracking = {
        postedComments: Array.from(this.postedComments),
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(this.trackingFile, JSON.stringify(tracking, null, 2));
      logger.info(`💾 Saved tracking: ${this.postedComments.size} total posted comments`);
    } catch (error) {
      logger.error(`❌ Failed to save tracking: ${error.message}`);
    }
  }

  /**
   * Scan WTB thread and match with inventory
   * @returns {Object} Scan results with matches
   */
  async scanAndMatch() {
    logger.info('🔍 Starting WTB scan and match...');
    
    // Scan WTB thread
    const wtbResult = await this.wtbMonitor.scan();
    logger.info(`📋 Found ${wtbResult.requests.length} WTB requests`);

    // Fetch our current inventory from Supabase
    const { data: deals, error } = await this.supabase
      .from('watch_listings')
      .select('*')
      .gte('deal_score', this.minDealScore)
      .order('deal_score', { ascending: false })
      .limit(500); // Get top deals only

    if (error) {
      logger.error(`❌ Failed to fetch inventory: ${error.message}`);
      throw new Error(`Supabase error: ${error.message}`);
    }

    logger.info(`📦 Loaded ${deals.length} deals from inventory (score >= ${this.minDealScore})`);

    // Match WTB requests with our inventory
    const matches = this.wtbMonitor.matchWithDeals(wtbResult.requests, deals);
    
    // Filter by transaction count
    const qualifiedMatches = matches.filter(m => m.request.transactions >= this.minTransactions);
    
    logger.info(`✅ Found ${matches.length} total matches (${qualifiedMatches.length} qualified with ${this.minTransactions}+ transactions)`);

    return {
      thread: wtbResult.thread,
      totalRequests: wtbResult.requests.length,
      totalMatches: matches.length,
      qualifiedMatches: qualifiedMatches.length,
      matches: qualifiedMatches,
      scannedAt: wtbResult.scannedAt
    };
  }

  /**
   * Generate a personalized comment for a match
   * @param {Object} match - WTB request + matching deals
   * @param {number} templateIndex - Optional specific template to use
   * @returns {string} Comment text
   */
  generateComment(match, templateIndex = null) {
    // Pick a random template if not specified
    const index = templateIndex !== null ? templateIndex : Math.floor(Math.random() * this.templates.length);
    const template = this.templates[index];
    
    return template.text(match);
  }

  /**
   * Post a comment to a WTB request
   * @param {Object} match - WTB request + matching deals
   * @param {Object} options - Posting options
   * @returns {Object} Result
   */
  async postComment(match, options = {}) {
    const { dryRun = false, templateIndex = null } = options;
    
    const commentText = this.generateComment(match, templateIndex);
    const parentId = `t1_${match.request.id}`; // t1_ prefix for comment replies
    
    if (dryRun) {
      logger.info(`[DRY RUN] Would post to ${match.request.author}:`);
      logger.info(`  ${commentText}`);
      return {
        success: true,
        dryRun: true,
        author: match.request.author,
        comment: commentText
      };
    }

    try {
      // Check if we've already replied to this comment
      if (this.postedComments.has(match.request.id)) {
        logger.warn(`⚠️ Already replied to ${match.request.id}, skipping`);
        return {
          success: false,
          skipped: true,
          reason: 'already_replied'
        };
      }

      // Double-check via Reddit API
      const hasReplied = await this.redditClient.hasRepliedTo(match.request.id);
      if (hasReplied) {
        logger.warn(`⚠️ Reddit API confirms we already replied to ${match.request.id}, updating tracking`);
        this.postedComments.add(match.request.id);
        await this.saveTracking();
        return {
          success: false,
          skipped: true,
          reason: 'already_replied_confirmed'
        };
      }

      // Post the comment
      const result = await this.redditClient.postComment(parentId, commentText);
      
      // Track this comment
      this.postedComments.add(match.request.id);
      await this.saveTracking();
      
      logger.info(`✅ Posted comment to u/${match.request.author} (${match.request.id})`);
      
      return {
        success: true,
        author: match.request.author,
        commentId: result.id,
        permalink: result.permalink,
        comment: commentText
      };
    } catch (error) {
      logger.error(`❌ Failed to post comment: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run full outreach pipeline
   * @param {Object} options - Run options
   * @returns {Object} Results
   */
  async runOutreach(options = {}) {
    const {
      dryRun = false,
      limit = this.maxCommentsPerRun,
      delay = 120000, // 2 minutes between posts (Reddit's rule)
      minScore = this.minDealScore
    } = options;

    logger.info('🚀 Starting WTB outreach pipeline...');
    logger.info(`   Dry run: ${dryRun}`);
    logger.info(`   Max comments: ${limit}`);
    logger.info(`   Delay between posts: ${delay / 1000}s`);
    logger.info(`   Min deal score: ${minScore}`);

    // Load tracking data
    await this.loadTracking();

    // Scan and match
    const scanResult = await this.scanAndMatch();
    
    if (scanResult.qualifiedMatches === 0) {
      logger.info('ℹ️ No qualified matches found');
      return {
        success: true,
        thread: scanResult.thread,
        totalMatches: scanResult.totalMatches,
        qualifiedMatches: 0,
        posted: 0,
        skipped: 0,
        errors: 0,
        results: []
      };
    }

    // Post comments to top matches (up to limit)
    const matches = scanResult.matches.slice(0, limit);
    const results = [];
    let posted = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      logger.info(`\n[${i + 1}/${matches.length}] Processing match:`);
      logger.info(`   Author: u/${match.request.author} (${match.request.transactions} transactions)`);
      logger.info(`   Looking for: ${match.request.brand}${match.request.models.length > 0 ? ' ' + match.request.models.join(', ') : ''}`);
      logger.info(`   Matches: ${match.deals.length} deal(s)`);
      logger.info(`   Match score: ${match.score}`);

      const result = await this.postComment(match, { dryRun });
      
      if (result.success && !result.dryRun) {
        posted++;
      } else if (result.skipped) {
        skipped++;
      } else if (result.error) {
        errors++;
      }

      results.push({
        author: match.request.author,
        brand: match.request.brand,
        models: match.request.models,
        dealCount: match.deals.length,
        matchScore: match.score,
        ...result
      });

      // Wait between posts (except for dry run or last iteration)
      if (!dryRun && i < matches.length - 1 && result.success && !result.skipped) {
        logger.info(`⏳ Waiting ${delay / 1000}s before next post...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const summary = {
      success: true,
      thread: scanResult.thread,
      totalMatches: scanResult.totalMatches,
      qualifiedMatches: scanResult.qualifiedMatches,
      posted: posted,
      skipped: skipped,
      errors: errors,
      results: results
    };

    logger.info('\n📊 Outreach Summary:');
    logger.info(`   Total WTB requests: ${scanResult.totalRequests}`);
    logger.info(`   Qualified matches: ${scanResult.qualifiedMatches}`);
    logger.info(`   Comments posted: ${posted}`);
    logger.info(`   Skipped (already replied): ${skipped}`);
    logger.info(`   Errors: ${errors}`);

    return summary;
  }
}

module.exports = WTBOutreach;
