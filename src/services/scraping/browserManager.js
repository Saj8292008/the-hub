const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');
const logger = require('../../utils/logger');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Browser Manager with Anti-Detection
 * Manages browser instances, user agents, and anti-bot measures
 */
class BrowserManager {
  constructor() {
    this.browser = null;
    this.browserConfig = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    };
  }

  /**
   * Initialize browser instance
   */
  async init() {
    if (this.browser) {
      return this.browser;
    }

    try {
      logger.info('Initializing browser with anti-detection...');

      this.browser = await puppeteer.launch(this.browserConfig);

      logger.info('Browser initialized successfully');
      return this.browser;
    } catch (error) {
      logger.error(`Failed to initialize browser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new page with anti-detection measures
   */
  async createPage() {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser.newPage();

    // Random user agent
    const userAgent = new UserAgent({ deviceCategory: 'desktop' });
    await page.setUserAgent(userAgent.toString());

    // Set additional headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    });

    // Override navigator.webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
    });

    // Override permissions
    await page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    // Mock plugins and mimeTypes
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
      Object.defineProperty(navigator, 'mimeTypes', {
        get: () => [1, 2, 3, 4]
      });
    });

    logger.debug('Created new page with anti-detection measures');
    return page;
  }

  /**
   * Navigate to URL with retry logic
   */
  async navigateWithRetry(page, url, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Navigating to ${url} (attempt ${attempt}/${maxRetries})`);

        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });

        // Wait a random amount of time to appear human-like
        await this.randomDelay(1000, 3000);

        return true;
      } catch (error) {
        lastError = error;
        logger.warn(`Navigation attempt ${attempt} failed: ${error.message}`);

        if (attempt < maxRetries) {
          await this.randomDelay(2000, 5000);
        }
      }
    }

    throw new Error(`Failed to navigate after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Random delay to mimic human behavior
   */
  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Take screenshot for debugging
   */
  async screenshot(page, filename) {
    try {
      const screenshotPath = `/tmp/${filename}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      logger.info(`Screenshot saved: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      logger.error(`Failed to take screenshot: ${error.message}`);
    }
  }

  /**
   * Check if page was blocked
   */
  async isBlocked(page) {
    const content = await page.content();
    const blocked = content.includes('Access Denied') ||
                   content.includes('blocked') ||
                   content.includes('captcha') ||
                   content.includes('Please verify you are a human');

    if (blocked) {
      logger.warn('Page appears to be blocked or showing CAPTCHA');
    }

    return blocked;
  }

  /**
   * Extract text safely
   */
  async extractText(page, selector, timeout = 5000) {
    try {
      await page.waitForSelector(selector, { timeout });
      return await page.$eval(selector, el => el.textContent.trim());
    } catch (error) {
      logger.debug(`Failed to extract text from ${selector}: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract attribute safely
   */
  async extractAttribute(page, selector, attribute, timeout = 5000) {
    try {
      await page.waitForSelector(selector, { timeout });
      return await page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);
    } catch (error) {
      logger.debug(`Failed to extract ${attribute} from ${selector}: ${error.message}`);
      return null;
    }
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      logger.info('Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Get current browser status
   */
  isActive() {
    return this.browser !== null;
  }
}

// Singleton instance
const browserManager = new BrowserManager();

// Cleanup on process exit
process.on('exit', () => {
  if (browserManager.isActive()) {
    browserManager.close();
  }
});

process.on('SIGINT', async () => {
  if (browserManager.isActive()) {
    await browserManager.close();
  }
  process.exit(0);
});

module.exports = browserManager;
