/**
 * Crawler Detection Middleware
 * Detects search engine crawlers and bots
 */

class CrawlerDetection {
  /**
   * List of known crawler user agents
   */
  static CRAWLER_USER_AGENTS = [
    'Googlebot',
    'Bingbot',
    'Slurp',              // Yahoo
    'DuckDuckBot',
    'Baiduspider',
    'YandexBot',
    'Sogou',
    'Exabot',
    'facebot',            // Facebook
    'ia_archiver',        // Alexa
    'Twitterbot',
    'LinkedInBot',
    'Pinterestbot',
    'WhatsApp',
    'TelegramBot',
    'Applebot',
    'Discordbot',
    'Slackbot',
    'Redditbot',
    'rogerbot',           // Moz
    'AhrefsBot',
    'SemrushBot',
    'MJ12bot',            // Majestic
    'DotBot',
    'Screaming Frog',
    'SEOkicks',
    'archive.org_bot',    // Internet Archive
    'curl',
    'wget'
  ];

  /**
   * Check if request is from a crawler
   * @param {string} userAgent - User-Agent header
   * @returns {boolean}
   */
  static isCrawler(userAgent) {
    if (!userAgent) return false;

    const lowerUA = userAgent.toLowerCase();

    // Check if any crawler identifier is in user agent
    return this.CRAWLER_USER_AGENTS.some(bot =>
      lowerUA.includes(bot.toLowerCase())
    );
  }

  /**
   * Middleware: Detect crawler and add to req object
   */
  static detect(req, res, next) {
    const userAgent = req.headers['user-agent'] || '';
    req.isCrawler = CrawlerDetection.isCrawler(userAgent);
    req.crawlerInfo = {
      isCrawler: req.isCrawler,
      userAgent,
      detectedBot: CrawlerDetection.getDetectedBot(userAgent)
    };
    next();
  }

  /**
   * Get the specific bot name if detected
   */
  static getDetectedBot(userAgent) {
    if (!userAgent) return null;

    const lowerUA = userAgent.toLowerCase();

    for (const bot of this.CRAWLER_USER_AGENTS) {
      if (lowerUA.includes(bot.toLowerCase())) {
        return bot;
      }
    }

    return null;
  }

  /**
   * Middleware: Require crawler (for testing SSR)
   */
  static requireCrawler(req, res, next) {
    if (!req.isCrawler) {
      return res.status(403).json({
        error: 'This endpoint is only accessible by crawlers'
      });
    }
    next();
  }

  /**
   * Middleware: Block crawlers (for admin/API routes)
   */
  static blockCrawlers(req, res, next) {
    if (req.isCrawler) {
      return res.status(403).send('Access denied for crawlers');
    }
    next();
  }
}

module.exports = CrawlerDetection;
