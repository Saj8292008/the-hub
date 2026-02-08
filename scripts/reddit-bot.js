/**
 * Reddit Browser Automation Bot
 * Uses Playwright to post comments like a human
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  reddit: {
    username: process.env.REDDIT_USERNAME || '',
    password: process.env.REDDIT_PASSWORD || '',
    cookiesFile: path.join(__dirname, '../data/reddit-cookies.json')
  },
  delays: {
    typing: 100, // ms between keystrokes
    betweenActions: 2000, // ms between major actions
    pageLoad: 3000 // ms to wait for pages
  }
};

class RedditBot {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize browser and login to Reddit
   */
  async init(options = {}) {
    const { headless = false } = options;
    console.log('🚀 Launching browser...');
    this.browser = await chromium.launch({ 
      headless: headless,
      slowMo: 50 // Makes it look more human
    });
    
    // Load cookies if they exist
    let cookies = [];
    try {
      const cookiesData = await fs.readFile(CONFIG.reddit.cookiesFile, 'utf8');
      cookies = JSON.parse(cookiesData);
      console.log('✅ Loaded saved cookies');
    } catch (err) {
      console.log('ℹ️  No saved cookies found, will login fresh');
    }

    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });

    if (cookies.length > 0) {
      await this.context.addCookies(cookies);
    }

    this.page = await this.context.newPage();
    
    // Check if we're logged in
    await this.page.goto('https://www.reddit.com');
    await this.sleep(2000);
    
    const isLoggedIn = await this.checkIfLoggedIn();
    
    if (!isLoggedIn) {
      console.log('🔐 Not logged in, attempting login...');
      await this.login();
    } else {
      console.log('✅ Already logged in!');
    }
  }

  /**
   * Check if currently logged in
   */
  async checkIfLoggedIn() {
    try {
      // Look for user menu or login button
      const loginButton = await this.page.$('a[href*="login"]');
      return loginButton === null; // If no login button, we're logged in
    } catch (err) {
      return false;
    }
  }

  /**
   * Login to Reddit
   */
  async login() {
    if (!CONFIG.reddit.username || !CONFIG.reddit.password) {
      throw new Error('❌ REDDIT_USERNAME and REDDIT_PASSWORD must be set');
    }

    console.log('📝 Navigating to login page...');
    await this.page.goto('https://www.reddit.com/login');
    await this.sleep(CONFIG.delays.pageLoad);

    // Fill username
    console.log('👤 Entering username...');
    await this.typeHuman('input[name="username"]', CONFIG.reddit.username);
    await this.sleep(500);

    // Fill password
    console.log('🔑 Entering password...');
    await this.typeHuman('input[name="password"]', CONFIG.reddit.password);
    await this.sleep(500);

    // Click login
    console.log('🔓 Clicking login...');
    await this.page.click('button[type="submit"]');
    await this.sleep(5000); // Wait for login to complete

    // Check if login was successful
    const success = await this.checkIfLoggedIn();
    if (!success) {
      throw new Error('❌ Login failed - check credentials or CAPTCHA');
    }

    console.log('✅ Login successful!');

    // Save cookies for next time
    await this.saveCookies();
  }

  /**
   * Save cookies to file
   */
  async saveCookies() {
    const cookies = await this.context.cookies();
    await fs.writeFile(CONFIG.reddit.cookiesFile, JSON.stringify(cookies, null, 2));
    console.log('💾 Saved cookies for future sessions');
  }

  /**
   * Type text like a human (with delays)
   */
  async typeHuman(selector, text) {
    await this.page.click(selector);
    for (const char of text) {
      await this.page.type(selector, char, { delay: CONFIG.delays.typing });
    }
  }

  /**
   * Post a comment on a Reddit post
   */
  async postComment(postUrl, commentText) {
    console.log(`\n📝 Posting comment to: ${postUrl}`);
    
    // Navigate to post
    await this.page.goto(postUrl);
    await this.sleep(CONFIG.delays.pageLoad);

    // Try multiple selectors for comment box
    let commentBox = null;
    const selectors = [
      'textarea[placeholder*="Add a comment"]',
      'textarea[placeholder*="What are your thoughts"]',
      'div[contenteditable="true"]',
      'textarea.public-DraftEditor-content',
      'div[data-testid="comment-submission-form-richtext"] textarea'
    ];

    for (const selector of selectors) {
      commentBox = await this.page.$(selector);
      if (commentBox) {
        console.log(`✅ Found comment box with selector: ${selector}`);
        break;
      }
    }
    
    if (!commentBox) {
      // Try clicking a "Reply" or comment area to reveal the text box
      console.log('⚠️  Trying to reveal comment box...');
      const triggerSelectors = [
        'button:has-text("Add a Comment")',
        'div[data-click-id="text"]',
        'div[role="textbox"]'
      ];
      
      for (const selector of triggerSelectors) {
        try {
          const trigger = await this.page.$(selector);
          if (trigger) {
            await trigger.click();
            await this.sleep(1000);
            
            // Try finding comment box again
            for (const s of selectors) {
              commentBox = await this.page.$(s);
              if (commentBox) break;
            }
            if (commentBox) break;
          }
        } catch (e) {
          // Continue trying
        }
      }
    }

    if (!commentBox) {
      throw new Error('❌ Could not find comment box with any selector');
    }

    // Click comment box
    await commentBox.click();
    await this.sleep(1000);

    // Type comment - try the selector that worked
    console.log('⌨️  Typing comment...');
    try {
      // Type directly into the element
      await commentBox.type(commentText, { delay: CONFIG.delays.typing });
    } catch (e) {
      // Fallback: use keyboard
      await this.page.keyboard.type(commentText, { delay: CONFIG.delays.typing });
    }
    await this.sleep(1500);

    // Find and click Comment button
    console.log('📤 Looking for Comment button...');
    const buttonSelectors = [
      'button:has-text("Comment")',
      'button[type="submit"]:has-text("Comment")',
      'button:has-text("Reply")',
      'button[data-testid="comment-submission-form-submit"]'
    ];

    let commentButton = null;
    for (const selector of buttonSelectors) {
      try {
        commentButton = await this.page.$(selector);
        if (commentButton) {
          console.log(`✅ Found button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!commentButton) {
      throw new Error('❌ Could not find Comment button');
    }

    await commentButton.click();
    await this.sleep(3000);

    console.log('✅ Comment posted successfully!');
    return true;
  }

  /**
   * Find posts to comment on
   */
  async findPosts(subreddit, postType = 'hot', limit = 5) {
    console.log(`\n🔍 Finding ${limit} posts in r/${subreddit}...`);
    
    const url = `https://www.reddit.com/r/${subreddit}/${postType}`;
    await this.page.goto(url);
    await this.sleep(CONFIG.delays.pageLoad);

    // Try multiple selectors for Reddit's various layouts
    const posts = await this.page.evaluate((limit) => {
      const results = [];
      
      // Try new Reddit selectors
      const postElements = document.querySelectorAll('a[data-click-id="body"], a[slot="full-post-link"], article a[href*="/comments/"]');
      
      for (const el of postElements) {
        if (results.length >= limit) break;
        
        const href = el.href;
        if (!href || !href.includes('/comments/')) continue;
        if (results.some(p => p.url === href)) continue; // Skip duplicates
        
        // Get title from nearby h3 or the element itself
        let title = '';
        const h3 = el.querySelector('h3') || el.closest('article')?.querySelector('h3');
        if (h3) {
          title = h3.innerText;
        } else {
          title = el.innerText || 'Untitled';
        }
        
        results.push({ title, url: href });
      }
      
      return results;
    }, limit);

    console.log(`✅ Found ${posts.length} posts`);
    posts.forEach((post, i) => {
      console.log(`  ${i + 1}. ${post.title.substring(0, 80)}...`);
    });

    return posts;
  }

  /**
   * Get post details (useful for deciding if you should comment)
   */
  async getPostDetails(postUrl) {
    await this.page.goto(postUrl);
    await this.sleep(2000);

    try {
      const details = await this.page.evaluate(() => {
        const titleEl = document.querySelector('h1');
        const flairEl = document.querySelector('[data-testid="post-flair"]');
        const bodyEl = document.querySelector('[data-test-id="post-content"]');
        
        return {
          title: titleEl?.innerText || '',
          flair: flairEl?.innerText || '',
          body: bodyEl?.innerText?.substring(0, 500) || '',
          commentCount: document.querySelectorAll('[data-testid="comment"]').length
        };
      });

      return details;
    } catch (err) {
      console.error('⚠️  Error getting post details:', err.message);
      return null;
    }
  }

  /**
   * Sleep for ms milliseconds
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('👋 Browser closed');
    }
  }
}

// CLI Usage
async function main() {
  const bot = new RedditBot();

  try {
    // Initialize (set headless: true to hide browser)
    await bot.init({ headless: false });

    // Example 1: Find posts to comment on
    const posts = await bot.findPosts('Watches', 'new', 5);

    // Example 2: Get details of first post
    if (posts.length > 0) {
      console.log('\n📋 Getting details of first post...');
      const details = await bot.getPostDetails(posts[0].url);
      console.log('Post details:', details);
    }

    // Example 3: Post a comment (UNCOMMENT TO USE)
    /*
    await bot.postComment(
      'https://www.reddit.com/r/Watches/comments/XXXXX/example-post',
      'Great watch! The dial on that model is really underrated. How do you like the bracelet comfort?'
    );
    */

    console.log('\n✅ Done! Keeping browser open for inspection...');
    console.log('Press Ctrl+C to close');

    // Keep browser open
    await new Promise(() => {});

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    throw err;
  } finally {
    // await bot.close(); // Uncomment to auto-close
  }
}

// Export for use in other scripts
module.exports = RedditBot;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
