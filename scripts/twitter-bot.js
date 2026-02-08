/**
 * Twitter Bot for The Hub
 * Auto-posts hot deals to Twitter
 */

const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs').promises;
const path = require('path');

// Check for required env vars
const requiredEnvVars = [
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET',
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing ${envVar} in .env file`);
    console.error('\nGet these from: https://developer.twitter.com/en/portal/dashboard');
    console.error('See TWITTER-SETUP.md for instructions\n');
    process.exit(1);
  }
}

// Initialize Twitter client
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = client.readWrite;

class TwitterBot {
  constructor() {
    this.postedDeals = new Set();
    this.historyFile = path.join(__dirname, '../data/twitter-posted.json');
  }

  /**
   * Load posting history
   */
  async loadHistory() {
    try {
      const data = await fs.readFile(this.historyFile, 'utf8');
      const history = JSON.parse(data);
      this.postedDeals = new Set(history.posted || []);
      console.log(`📜 Loaded ${this.postedDeals.size} previously posted deals`);
    } catch (err) {
      console.log('📝 No posting history found, starting fresh');
    }
  }

  /**
   * Save posting history
   */
  async saveHistory() {
    const data = {
      posted: Array.from(this.postedDeals),
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(this.historyFile, JSON.stringify(data, null, 2));
  }

  /**
   * Format deal as tweet
   */
  formatDealTweet(deal) {
    const { title, price, brand, model, source, url, deal_score } = deal;
    
    // Clean title (remove extra spaces, brackets)
    const cleanTitle = title.replace(/\[|\]/g, '').trim();
    
    // Build tweet
    let tweet = `🔥 ${cleanTitle}\n\n`;
    tweet += `💰 $${price.toLocaleString()}\n`;
    
    if (deal_score) {
      tweet += `⭐ Deal Score: ${deal_score}/100\n`;
    }
    
    tweet += `\n${url}\n\n`;
    
    // Add hashtags
    const hashtags = this.generateHashtags(brand, model);
    tweet += hashtags.join(' ');
    
    // Twitter limit is 280 chars
    if (tweet.length > 280) {
      // Truncate title if needed
      const maxTitleLength = 100;
      const shortTitle = cleanTitle.length > maxTitleLength 
        ? cleanTitle.substring(0, maxTitleLength) + '...'
        : cleanTitle;
      
      tweet = `🔥 ${shortTitle}\n\n`;
      tweet += `💰 $${price.toLocaleString()}\n`;
      tweet += `\n${url}\n\n`;
      tweet += hashtags.slice(0, 3).join(' '); // Fewer hashtags if space is tight
    }
    
    return tweet;
  }

  /**
   * Generate relevant hashtags
   */
  generateHashtags(brand, model) {
    const hashtags = ['#WatchDeals'];
    
    // Add brand hashtag if available
    if (brand) {
      const brandTag = brand.replace(/\s+/g, '');
      hashtags.push(`#${brandTag}`);
    }
    
    // Common watch hashtags
    hashtags.push('#Watches', '#WatchCollector');
    
    return hashtags;
  }

  /**
   * Post a deal to Twitter
   */
  async postDeal(deal) {
    const tweet = this.formatDealTweet(deal);
    
    console.log(`\n📤 Posting to Twitter:`);
    console.log(tweet);
    console.log(`\nCharacters: ${tweet.length}/280`);
    
    try {
      const result = await rwClient.v2.tweet(tweet);
      console.log(`✅ Posted! Tweet ID: ${result.data.id}`);
      
      // Mark as posted
      this.postedDeals.add(deal.id);
      await this.saveHistory();
      
      return result;
    } catch (error) {
      console.error('❌ Failed to post tweet:', error.message);
      throw error;
    }
  }

  /**
   * Get hot deals from The Hub API
   */
  async getHotDeals(minScore = 12) {
    try {
      const response = await fetch(`http://localhost:3000/api/listings/hot-deals?minScore=${minScore}`);
      const data = await response.json();
      return data.deals || [];
    } catch (error) {
      console.error('❌ Failed to fetch deals:', error.message);
      return [];
    }
  }

  /**
   * Post hot deals that haven't been posted yet
   */
  async postHotDeals(minScore = 12, maxPosts = 3) {
    console.log(`\n🔍 Looking for hot deals (score >= ${minScore})...`);
    
    await this.loadHistory();
    const deals = await this.getHotDeals(minScore);
    
    console.log(`✅ Found ${deals.length} hot deals`);
    
    // Filter out already posted
    const newDeals = deals.filter(deal => !this.postedDeals.has(deal.id));
    console.log(`📝 ${newDeals.length} not yet posted`);
    
    if (newDeals.length === 0) {
      console.log('ℹ️  No new deals to post');
      return;
    }
    
    // Post up to maxPosts
    const toPost = newDeals.slice(0, maxPosts);
    console.log(`📤 Posting ${toPost.length} deals...`);
    
    for (const deal of toPost) {
      try {
        await this.postDeal(deal);
        
        // Wait between posts (avoid rate limits)
        if (toPost.indexOf(deal) < toPost.length - 1) {
          console.log('⏰ Waiting 30 seconds before next post...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      } catch (error) {
        console.error(`Failed to post deal ${deal.id}:`, error.message);
      }
    }
    
    console.log(`\n✅ Posted ${toPost.length} deals to Twitter`);
  }

  /**
   * Test tweet (doesn't actually post)
   */
  async testTweet(dealIndex = 0) {
    const deals = await this.getHotDeals(10);
    
    if (deals.length === 0) {
      console.log('❌ No deals found to test with');
      return;
    }
    
    const deal = deals[dealIndex];
    const tweet = this.formatDealTweet(deal);
    
    console.log('\n📝 Test Tweet Preview:');
    console.log('─'.repeat(50));
    console.log(tweet);
    console.log('─'.repeat(50));
    console.log(`\nCharacters: ${tweet.length}/280`);
    console.log('✅ Looks good? Run with --post to actually tweet');
  }
}

// CLI
async function main() {
  const bot = new TwitterBot();
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    console.log('🧪 TEST MODE - Not actually posting\n');
    await bot.testTweet();
  } else if (args.includes('--post')) {
    const minScore = parseInt(args.find(a => a.startsWith('--score='))?.split('=')[1]) || 12;
    const maxPosts = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1]) || 3;
    
    await bot.postHotDeals(minScore, maxPosts);
  } else {
    console.log('Twitter Bot for The Hub\n');
    console.log('Usage:');
    console.log('  node twitter-bot.js --test              Test tweet formatting');
    console.log('  node twitter-bot.js --post              Post hot deals');
    console.log('  node twitter-bot.js --post --score=15   Post deals with score >= 15');
    console.log('  node twitter-bot.js --post --max=5      Post up to 5 deals');
    console.log('');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TwitterBot;
