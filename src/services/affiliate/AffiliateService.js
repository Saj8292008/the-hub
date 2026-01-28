/**
 * Affiliate Link Service
 * 
 * Transforms regular product URLs into affiliate links
 * Supports: eBay Partner Network, Amazon Associates, StockX, etc.
 */

const logger = require('../../utils/logger');

class AffiliateService {
  constructor() {
    // Load affiliate IDs from environment
    this.ebayAffiliateId = process.env.EBAY_AFFILIATE_ID || null;
    this.amazonAffiliateTag = process.env.AMAZON_AFFILIATE_TAG || null;
    this.stockxAffiliateId = process.env.STOCKX_AFFILIATE_ID || null;
    
    // Track conversions
    this.stats = {
      linksGenerated: 0,
      bySource: {}
    };
  }

  /**
   * Transform a URL into an affiliate link if possible
   */
  transformUrl(url, source = null) {
    if (!url) return url;

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // eBay
      if (hostname.includes('ebay.com') && this.ebayAffiliateId) {
        return this.createEbayAffiliateLink(url);
      }

      // Amazon
      if ((hostname.includes('amazon.com') || hostname.includes('amzn.to')) && this.amazonAffiliateTag) {
        return this.createAmazonAffiliateLink(url);
      }

      // StockX
      if (hostname.includes('stockx.com') && this.stockxAffiliateId) {
        return this.createStockXAffiliateLink(url);
      }

      // No affiliate support for this URL
      return url;
    } catch (error) {
      logger.error('Error transforming URL:', error);
      return url;
    }
  }

  /**
   * Create eBay Partner Network affiliate link
   * https://developer.ebay.com/api-docs/buy/static/ref-ebay-partner-network.html
   */
  createEbayAffiliateLink(url) {
    if (!this.ebayAffiliateId) return url;

    try {
      // eBay ROVer tracking URL format
      const encodedUrl = encodeURIComponent(url);
      const affiliateUrl = `https://rover.ebay.com/rover/1/${this.ebayAffiliateId}/1?mpre=${encodedUrl}&toolid=10001&campid=${this.ebayAffiliateId}`;
      
      this.trackLink('ebay');
      return affiliateUrl;
    } catch (error) {
      logger.error('Error creating eBay affiliate link:', error);
      return url;
    }
  }

  /**
   * Create Amazon Associates affiliate link
   */
  createAmazonAffiliateLink(url) {
    if (!this.amazonAffiliateTag) return url;

    try {
      const urlObj = new URL(url);
      
      // Add or replace the tag parameter
      urlObj.searchParams.set('tag', this.amazonAffiliateTag);
      
      this.trackLink('amazon');
      return urlObj.toString();
    } catch (error) {
      logger.error('Error creating Amazon affiliate link:', error);
      return url;
    }
  }

  /**
   * Create StockX affiliate link
   */
  createStockXAffiliateLink(url) {
    if (!this.stockxAffiliateId) return url;

    try {
      const urlObj = new URL(url);
      
      // StockX uses utm parameters for affiliate tracking
      urlObj.searchParams.set('utm_source', 'affiliate');
      urlObj.searchParams.set('utm_medium', 'referral');
      urlObj.searchParams.set('utm_campaign', this.stockxAffiliateId);
      
      this.trackLink('stockx');
      return urlObj.toString();
    } catch (error) {
      logger.error('Error creating StockX affiliate link:', error);
      return url;
    }
  }

  /**
   * Track link generation for stats
   */
  trackLink(source) {
    this.stats.linksGenerated++;
    this.stats.bySource[source] = (this.stats.bySource[source] || 0) + 1;
  }

  /**
   * Get affiliate stats
   */
  getStats() {
    return {
      ...this.stats,
      configured: {
        ebay: !!this.ebayAffiliateId,
        amazon: !!this.amazonAffiliateTag,
        stockx: !!this.stockxAffiliateId
      }
    };
  }

  /**
   * Process a listing and add affiliate links
   */
  processListing(listing) {
    if (!listing || !listing.url) return listing;

    return {
      ...listing,
      affiliate_url: this.transformUrl(listing.url, listing.source),
      has_affiliate: this.transformUrl(listing.url, listing.source) !== listing.url
    };
  }

  /**
   * Process multiple listings
   */
  processListings(listings) {
    return listings.map(l => this.processListing(l));
  }

  /**
   * Check if any affiliate programs are configured
   */
  isConfigured() {
    return !!(this.ebayAffiliateId || this.amazonAffiliateTag || this.stockxAffiliateId);
  }
}

// Singleton instance
let instance = null;

function getAffiliateService() {
  if (!instance) {
    instance = new AffiliateService();
  }
  return instance;
}

module.exports = {
  AffiliateService,
  getAffiliateService
};
