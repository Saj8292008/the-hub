const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Reddit WTB (Want To Buy) Monitor
 * Scrapes r/Watchexchange weekly WTB threads and extracts buyer requests
 * Matches against our deals database for outreach opportunities
 */
class WTBMonitor {
  constructor() {
    this.subreddit = 'Watchexchange';
    this.baseUrl = 'https://www.reddit.com';
    
    // Known watch brands for extraction
    this.knownBrands = [
      'Rolex', 'Omega', 'Tudor', 'Grand Seiko', 'Seiko', 'Casio', 'G-Shock',
      'Tissot', 'Hamilton', 'Longines', 'Oris', 'Breitling', 'TAG Heuer',
      'Cartier', 'IWC', 'Panerai', 'Zenith', 'Vacheron', 'Audemars Piguet',
      'Patek Philippe', 'Jaeger-LeCoultre', 'JLC', 'Sinn', 'Nomos', 'Junghans',
      'Orient', 'Citizen', 'Bulova', 'Timex', 'Lorier', 'Baltic', 'Christopher Ward',
      'Doxa', 'Monta', 'Zelos', 'Nivada', 'Fears', 'Erebus', 'Horage'
    ];
  }

  /**
   * Find the current weekly WTB thread
   * @returns {Object} Thread info with URL and ID
   */
  async findWTBThread() {
    logger.info('🔍 Searching for weekly WTB thread...');
    
    try {
      const url = `${this.baseUrl}/r/${this.subreddit}/search.json`;
      const params = new URLSearchParams({
        q: '[WTB] Weekly Want To Buy',
        restrict_sr: 'on',
        sort: 'new',
        t: 'week',
        limit: 5
      });

      const response = await axios.get(`${url}?${params}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TheHubBot/1.0; watch deal aggregator)'
        },
        timeout: 10000
      });

      const posts = response.data?.data?.children || [];
      
      // Find the official weekly thread (posted by AutoModerator)
      const wtbThread = posts.find(p => 
        p.data.title.includes('[WTB]') && 
        p.data.title.includes('Weekly') &&
        p.data.author === 'AutoModerator'
      );

      if (!wtbThread) {
        // Fallback: just get the most recent WTB thread
        const fallback = posts.find(p => p.data.title.includes('[WTB]'));
        if (fallback) {
          return {
            id: fallback.data.id,
            title: fallback.data.title,
            url: `${this.baseUrl}${fallback.data.permalink}`,
            created: new Date(fallback.data.created_utc * 1000),
            numComments: fallback.data.num_comments
          };
        }
        throw new Error('No WTB thread found');
      }

      return {
        id: wtbThread.data.id,
        title: wtbThread.data.title,
        url: `${this.baseUrl}${wtbThread.data.permalink}`,
        created: new Date(wtbThread.data.created_utc * 1000),
        numComments: wtbThread.data.num_comments
      };
    } catch (error) {
      logger.error(`❌ Failed to find WTB thread: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scrape all comments from a WTB thread
   * @param {string} threadId - Reddit post ID
   * @returns {Array} Parsed WTB requests
   */
  async scrapeWTBThread(threadId) {
    logger.info(`📥 Scraping WTB thread: ${threadId}`);

    try {
      const url = `${this.baseUrl}/r/${this.subreddit}/comments/${threadId}.json`;
      const params = new URLSearchParams({
        limit: 500,
        depth: 1,  // Only top-level comments (the actual WTB requests)
        sort: 'new'
      });

      const response = await axios.get(`${url}?${params}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TheHubBot/1.0; watch deal aggregator)'
        },
        timeout: 15000
      });

      // Reddit returns [post, comments]
      const commentsData = response.data[1]?.data?.children || [];
      
      const requests = [];
      for (const comment of commentsData) {
        if (comment.kind !== 't1') continue; // Skip non-comments
        if (comment.data.author === 'AutoModerator') continue; // Skip bot
        if (comment.data.stickied) continue; // Skip stickied comments

        const parsed = this.parseWTBComment(comment.data);
        if (parsed) {
          requests.push(parsed);
        }
      }

      logger.info(`✅ Parsed ${requests.length} WTB requests from ${commentsData.length} comments`);
      return requests;
    } catch (error) {
      logger.error(`❌ Failed to scrape WTB thread: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse a single WTB comment into structured data
   * @param {Object} comment - Reddit comment data
   * @returns {Object|null} Parsed WTB request
   */
  parseWTBComment(comment) {
    const body = comment.body || '';
    if (!body || body.length < 10) return null;

    // Extract watch info
    const brand = this.extractBrand(body);
    const models = this.extractModels(body);
    const priceRange = this.extractPriceRange(body);
    const conditions = this.extractConditions(body);
    const location = this.extractLocation(body);

    // Skip if we couldn't identify any watch info
    if (brand === 'Unknown' && models.length === 0) {
      return null;
    }

    return {
      id: comment.id,
      author: comment.author,
      authorFlair: comment.author_flair_text || null,
      transactions: this.extractTransactionCount(comment.author_flair_text),
      body: body,
      brand: brand,
      models: models,
      searchTerms: this.generateSearchTerms(brand, models, body),
      priceRange: priceRange,
      conditions: conditions,
      location: location,
      url: `https://www.reddit.com/r/${this.subreddit}/comments/${comment.link_id?.replace('t3_', '')}/comment/${comment.id}/`,
      timestamp: new Date(comment.created_utc * 1000),
      score: comment.score
    };
  }

  /**
   * Extract brand from text
   */
  extractBrand(text) {
    if (!text) return 'Unknown';
    const upperText = text.toUpperCase();
    
    for (const brand of this.knownBrands) {
      if (upperText.includes(brand.toUpperCase())) {
        return brand;
      }
    }
    
    // Check for common abbreviations
    const abbrevs = {
      'GS': 'Grand Seiko',
      'JLC': 'Jaeger-LeCoultre',
      'AP': 'Audemars Piguet',
      'PP': 'Patek Philippe',
      'CW': 'Christopher Ward',
      'SKX': 'Seiko',
      'SARB': 'Seiko',
      'SBGW': 'Grand Seiko',
      'SBGP': 'Grand Seiko',
      'SPB': 'Seiko'
    };

    for (const [abbrev, brand] of Object.entries(abbrevs)) {
      if (upperText.includes(abbrev)) {
        return brand;
      }
    }

    return 'Unknown';
  }

  /**
   * Extract model numbers/names from text
   */
  extractModels(text) {
    if (!text) return [];
    const models = [];
    
    // Common model patterns
    const patterns = [
      /\b(SKX\d{3}[A-Z]?)\b/gi,           // SKX007, SKX011J
      /\b(SARB\d{3})\b/gi,                 // SARB033
      /\b(SPB\d{3}[A-Z]?)\b/gi,            // SPB143
      /\b(SBGW\d{3})\b/gi,                 // SBGW293
      /\b(SBGP\d{3})\b/gi,                 // SBGP017
      /\b(GA-?\d{4}[A-Z0-9-]*)\b/gi,       // GA-2100, GA2110ET-8A
      /\b(ref\.?\s*\d{5,6}[A-Z]*)\b/gi,    // ref. 126300
      /\b(\d{4}\.\d{2})\b/g,               // 3502.73 (Omega)
      /\b(\d{6}[A-Z]{2,})\b/g,             // 126500LN
      /\b(Seamaster|Speedmaster|Submariner|Datejust|Explorer|GMT.?Master)/gi,
      /\b(Black Bay|Pelagos|Royal Oak|Nautilus|Aquanaut)/gi
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        models.push(...matches.map(m => m.trim()));
      }
    }

    return [...new Set(models)]; // Dedupe
  }

  /**
   * Extract price range from text
   */
  extractPriceRange(text) {
    if (!text) return null;
    // Look for patterns like: <$200, under $500, $1000-$1500, max $800
    const patterns = [
      /<\s*\$?\s*(\d{1,3}(?:,\d{3})*)/i,           // <$1000
      /under\s*\$?\s*(\d{1,3}(?:,\d{3})*)/i,       // under $1000
      /max\.?\s*\$?\s*(\d{1,3}(?:,\d{3})*)/i,      // max $1000
      /\$?\s*(\d{1,3}(?:,\d{3})*)\s*-\s*\$?\s*(\d{1,3}(?:,\d{3})*)/, // $1000-$1500
      /budget[:\s]+\$?\s*(\d{1,3}(?:,\d{3})*)/i    // budget: $1000
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[2]) {
          // Range
          return {
            min: this.parsePrice(match[1]),
            max: this.parsePrice(match[2])
          };
        } else {
          // Max only
          return {
            min: 0,
            max: this.parsePrice(match[1])
          };
        }
      }
    }

    return null;
  }

  /**
   * Parse price string to number
   */
  parsePrice(priceStr) {
    return parseInt(priceStr.replace(/[,$]/g, ''), 10) || 0;
  }

  /**
   * Extract desired conditions
   */
  extractConditions(text) {
    if (!text) return [];
    const conditions = [];
    const lower = text.toLowerCase();
    
    if (lower.includes('mint') || lower.includes('like new')) conditions.push('mint');
    if (lower.includes('excellent')) conditions.push('excellent');
    if (lower.includes('good condition') || lower.includes('good/excellent')) conditions.push('good');
    if (lower.includes('full kit') || lower.includes('box and papers') || lower.includes('box & papers')) conditions.push('full kit');
    if (lower.includes('watch only')) conditions.push('watch only');
    
    return conditions;
  }

  /**
   * Extract location preference
   */
  extractLocation(text) {
    if (!text) return null;
    
    // Note: No 'g' flag - we need capture groups to work
    const patterns = [
      /\b(US|USA|CONUS)\s*(?:only|seller|shipping)?/i,
      /\b(EU|Europe)\s*(?:only|seller|shipping)?/i,
      /\b(UK)\s*(?:only|seller|shipping)?/i,
      /\b(CAN|Canada)\s*(?:only|seller|shipping)?/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }

    return null;
  }

  /**
   * Extract transaction count from flair
   */
  extractTransactionCount(flair) {
    if (!flair) return 0;
    const match = flair.match(/(\d+)\s*Transaction/i);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Generate search terms for matching against our database
   */
  generateSearchTerms(brand, models, body) {
    const terms = [];
    if (!body) body = '';
    
    if (brand && brand !== 'Unknown') {
      terms.push(brand.toLowerCase());
    }
    
    for (const model of models) {
      terms.push(model.toLowerCase());
    }

    // Add some common keywords from the body
    const keywords = body.match(/\b(diver|chrono|chronograph|gmt|field|pilot|dress|vintage)\b/gi);
    if (keywords) {
      terms.push(...keywords.map(k => k.toLowerCase()));
    }

    return [...new Set(terms)];
  }

  /**
   * Match WTB requests against our deals database
   * @param {Array} wtbRequests - Parsed WTB requests
   * @param {Array} deals - Our available deals
   * @returns {Array} Matched opportunities
   */
  matchWithDeals(wtbRequests, deals) {
    const matches = [];

    for (const request of wtbRequests) {
      const matchedDeals = deals.filter(deal => {
        // Brand match
        if (request.brand !== 'Unknown') {
          const dealBrand = (deal.brand || '').toLowerCase();
          if (!dealBrand.includes(request.brand.toLowerCase())) {
            return false;
          }
        }

        // Model match (any of the models)
        if (request.models.length > 0) {
          const dealModel = (deal.model || deal.title || '').toLowerCase();
          const hasModelMatch = request.models.some(m => 
            dealModel.includes(m.toLowerCase())
          );
          if (!hasModelMatch) return false;
        }

        // Price match (if buyer specified a range)
        if (request.priceRange && deal.price) {
          if (deal.price > request.priceRange.max) {
            return false;
          }
        }

        return true;
      });

      if (matchedDeals.length > 0) {
        matches.push({
          request,
          deals: matchedDeals,
          score: this.calculateMatchScore(request, matchedDeals[0])
        });
      }
    }

    // Sort by match score
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  /**
   * Calculate match quality score
   */
  calculateMatchScore(request, deal) {
    let score = 0;

    // Brand match
    if (request.brand !== 'Unknown') score += 30;

    // Model match
    if (request.models.length > 0) score += 40;

    // Price in range
    if (request.priceRange && deal.price) {
      if (deal.price <= request.priceRange.max * 0.9) {
        score += 20; // Good deal - under budget
      } else if (deal.price <= request.priceRange.max) {
        score += 10; // Within budget
      }
    }

    // Buyer has transaction history (more reliable)
    if (request.transactions > 10) score += 10;
    else if (request.transactions > 0) score += 5;

    return score;
  }

  /**
   * Full scan: Find WTB thread, scrape, and return parsed requests
   * @returns {Object} Thread info and parsed requests
   */
  async scan() {
    const thread = await this.findWTBThread();
    const requests = await this.scrapeWTBThread(thread.id);
    
    return {
      thread,
      requests,
      scannedAt: new Date()
    };
  }
}

module.exports = WTBMonitor;
