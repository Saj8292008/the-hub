/**
 * Affiliate Link Service
 * Converts outbound links to affiliate links where possible
 * Tracks clicks for analytics
 */

class AffiliateLinker {
  constructor() {
    // Affiliate program configs
    this.programs = {
      ebay: {
        enabled: process.env.EBAY_AFFILIATE_ID ? true : false,
        campaignId: process.env.EBAY_AFFILIATE_ID || '',
        // eBay Partner Network format
        transform: (url) => {
          if (!this.programs.ebay.campaignId) return url;
          const encoded = encodeURIComponent(url);
          return `https://rover.ebay.com/rover/1/${this.programs.ebay.campaignId}/1?mpre=${encoded}`;
        }
      },
      chrono24: {
        enabled: process.env.CHRONO24_AFFILIATE_ID ? true : false,
        affiliateId: process.env.CHRONO24_AFFILIATE_ID || '',
        // Chrono24 affiliate format
        transform: (url) => {
          if (!this.programs.chrono24.affiliateId) return url;
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}ref=${this.programs.chrono24.affiliateId}`;
        }
      },
      amazon: {
        enabled: process.env.AMAZON_AFFILIATE_TAG ? true : false,
        tag: process.env.AMAZON_AFFILIATE_TAG || '',
        transform: (url) => {
          if (!this.programs.amazon.tag) return url;
          const separator = url.includes('?') ? '&' : '?';
          return `${url}${separator}tag=${this.programs.amazon.tag}`;
        }
      }
    };

    // Click tracking (in-memory for now, could be DB)
    this.clickCounts = {};
  }

  /**
   * Detect which platform a URL is from
   */
  detectPlatform(url) {
    if (!url) return null;
    const lower = url.toLowerCase();
    
    if (lower.includes('ebay.com')) return 'ebay';
    if (lower.includes('chrono24.com')) return 'chrono24';
    if (lower.includes('amazon.com') || lower.includes('amzn.')) return 'amazon';
    if (lower.includes('reddit.com')) return 'reddit';
    if (lower.includes('watchuseek.com')) return 'watchuseek';
    
    return 'other';
  }

  /**
   * Convert a URL to affiliate link if possible
   */
  convert(url) {
    if (!url) return url;
    
    const platform = this.detectPlatform(url);
    
    if (platform && this.programs[platform]?.enabled) {
      return this.programs[platform].transform(url);
    }
    
    return url;
  }

  /**
   * Process a deal and convert its URL
   */
  processDeal(deal) {
    if (!deal?.url) return deal;
    
    return {
      ...deal,
      originalUrl: deal.url,
      url: this.convert(deal.url),
      affiliateEnabled: this.detectPlatform(deal.url) !== 'other'
    };
  }

  /**
   * Track a click (for analytics)
   */
  trackClick(dealId, platform) {
    const key = `${platform || 'unknown'}`;
    this.clickCounts[key] = (this.clickCounts[key] || 0) + 1;
    
    // Could log to DB here for real tracking
    console.log(`[Affiliate] Click tracked: ${key} (total: ${this.clickCounts[key]})`);
  }

  /**
   * Get click stats
   */
  getStats() {
    return {
      clicks: this.clickCounts,
      programs: Object.entries(this.programs).map(([name, config]) => ({
        name,
        enabled: config.enabled
      }))
    };
  }

  /**
   * Generate redirect URL for tracking
   * Use this in posts to track clicks
   */
  generateTrackingUrl(dealId, originalUrl) {
    // For now, return direct URL
    // TODO: Build /go/:dealId endpoint for tracking
    return this.convert(originalUrl);
  }
}

module.exports = AffiliateLinker;
