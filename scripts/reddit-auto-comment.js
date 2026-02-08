/**
 * Automated Reddit Commenting
 * Finds good posts and posts helpful comments
 */

const RedditBot = require('./reddit-bot');
const fs = require('fs').promises;
const path = require('path');

// Load comment templates
const COMMENT_TEMPLATES = {
  identify: [
    "That's a nice piece! The dial design and case shape suggest it could be from a specific era. Check the caseback for reference numbers - that'll help confirm the exact model.\n\nTypically these go for anywhere from $100-400 depending on condition and service history. Great find!",
    
    "Based on the styling, this looks like a vintage piece. The specific features you're seeing are common markers for identification.\n\nI'd recommend checking watch forums or Chrono24 to compare similar models and get a better sense of market value."
  ],

  question: [
    "Great question! For that budget, here are some solid automatic options:\n\n• Orient Kamasu ($250-300) - In-house movement, sapphire crystal, 200m WR\n• Seiko Presage ($300-400) - Beautiful dials, reliable 4R35 movement\n• Hamilton Khaki Field Auto ($400) - 80-hour power reserve, Swiss made\n\nThe Orient Kamasu is probably the best value - you're getting features that cost $1000+ in other brands.\n\nWhat's your wrist size and style preference? That'll help narrow it down.",
    
    "Here's my take:\n\nFor entry-level automatics, you really can't go wrong with Seiko or Orient. They offer incredible value - in-house movements, sapphire crystals, and solid build quality at price points under $500.\n\nIf you want Swiss, Hamilton is the sweet spot. Their Khaki line offers 80-hour power reserves (most automatics are 40-50 hours) at reasonable prices.\n\nWhat features matter most to you? That'll help guide the recommendation."
  ],

  collection: [
    "Great collection! Really like the variety you've got here.\n\nHow do you like the daily wearability of that piece? I've been considering something similar. What's the accuracy been like for you?",
    
    "Beautiful collection! The way you've curated different styles really shows good taste.\n\nWhich one gets the most wrist time? Always curious what people actually reach for day-to-day."
  ]
};

// Keywords to look for in posts
const POST_FILTERS = {
  identify: ['identify', 'what watch', 'help find', 'help id', 'can you tell', 'id this', 'what is this'],
  question: ['recommendation', 'should i buy', 'which watch', 'help me choose', 'budget', 'looking for', 'advice'],
  collection: ['collection', 'new watch', 'just got', 'mail call', 'my first', 'picked up', 'lume shot', 'wrist check', '[']
};

class RedditAutoCommenter {
  constructor() {
    this.bot = new RedditBot();
    this.commented = new Set(); // Track what we've commented on
    this.logFile = path.join(__dirname, '../logs/reddit-comments.json');
  }

  /**
   * Load comment history
   */
  async loadHistory() {
    try {
      const data = await fs.readFile(this.logFile, 'utf8');
      const history = JSON.parse(data);
      this.commented = new Set(history.commented || []);
      console.log(`📜 Loaded ${this.commented.size} previous comments`);
    } catch (err) {
      console.log('📝 No comment history found, starting fresh');
    }
  }

  /**
   * Save comment history
   */
  async saveHistory() {
    const data = {
      commented: Array.from(this.commented),
      lastRun: new Date().toISOString()
    };
    await fs.writeFile(this.logFile, JSON.stringify(data, null, 2));
  }

  /**
   * Determine post type from title and flair
   */
  detectPostType(title, flair) {
    const text = (title + ' ' + flair).toLowerCase();
    
    for (const [type, keywords] of Object.entries(POST_FILTERS)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return type;
      }
    }
    
    return null;
  }

  /**
   * Generate a helpful comment
   */
  generateComment(postType, postDetails) {
    // This is a simple version - you'd make this smarter
    const templates = COMMENT_TEMPLATES[postType] || [];
    if (templates.length === 0) return null;

    // Pick a random template
    const template = templates[Math.floor(Math.random() * templates.length)];

    // For now, return template as-is
    // TODO: Fill in template variables with actual data
    return template;
  }

  /**
   * Run the auto-commenter
   */
  async run(subreddit = 'Watches', maxComments = 5, dryRun = false) {
    console.log('\n🤖 Reddit Auto-Commenter Starting...');
    console.log(`📍 Subreddit: r/${subreddit}`);
    console.log(`🎯 Target: ${maxComments} comments`);
    console.log(`🧪 Dry run: ${dryRun ? 'YES (no actual posting)' : 'NO (will post for real)'}\n`);

    await this.loadHistory();
    await this.bot.init({ headless: false });

    // Find posts
    const posts = await this.bot.findPosts(subreddit, 'new', 20);
    let commentsPosted = 0;

    for (const post of posts) {
      if (commentsPosted >= maxComments) break;
      if (this.commented.has(post.url)) {
        console.log(`⏭️  Skipping (already commented): ${post.title.substring(0, 60)}...`);
        continue;
      }

      // Get post details
      const details = await this.bot.getPostDetails(post.url);
      if (!details) continue;

      // Detect post type
      const postType = this.detectPostType(details.title, details.flair);
      if (!postType) {
        console.log(`⏭️  Skipping (no matching type): ${details.title.substring(0, 60)}...`);
        continue;
      }

      console.log(`\n✅ Found ${postType} post: ${details.title.substring(0, 60)}...`);

      // Generate comment
      const comment = this.generateComment(postType, details);
      if (!comment) {
        console.log('⚠️  Could not generate comment');
        continue;
      }

      console.log(`💬 Generated comment:\n${comment.substring(0, 200)}...\n`);

      if (!dryRun) {
        // Post comment
        try {
          await this.bot.postComment(post.url, comment);
          this.commented.add(post.url);
          commentsPosted++;

          // Random delay between comments (2-5 minutes to look human)
          const delay = (2 + Math.random() * 3) * 60 * 1000;
          console.log(`⏰ Waiting ${Math.round(delay / 1000 / 60)} minutes before next comment...`);
          await this.bot.sleep(delay);
        } catch (err) {
          console.error('❌ Failed to post comment:', err.message);
        }
      } else {
        console.log('🧪 DRY RUN - not actually posting');
        commentsPosted++;
      }
    }

    await this.saveHistory();
    console.log(`\n✅ Posted ${commentsPosted} comments`);
  }

  async close() {
    await this.bot.close();
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const maxComments = parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1]) || 5;
  const subreddit = args.find(a => !a.startsWith('--')) || 'Watches';

  const commenter = new RedditAutoCommenter();

  try {
    await commenter.run(subreddit, maxComments, dryRun);
    
    if (!dryRun) {
      console.log('\n✅ Done! Keeping browser open...');
      await new Promise(() => {});
    }
  } catch (err) {
    console.error('\n❌ Error:', err);
  } finally {
    if (dryRun) {
      await commenter.close();
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = RedditAutoCommenter;
