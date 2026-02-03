/**
 * Affiliate Link Manager
 * Converts regular links to affiliate links for revenue
 */

// Affiliate program configs (auto-enables when keys are set)
const AFFILIATE_CONFIG = {
  ebay: {
    enabled: !!process.env.EBAY_CAMPAIGN_ID, // Auto-enable when configured
    campaignId: process.env.EBAY_CAMPAIGN_ID || process.env.EBAY_AFFILIATE_ID || '',
    // EPN link format: https://www.ebay.com/itm/123?mkcid=1&mkrid=711-53200-19255-0&campid=YOUR_CAMPAIGN&toolid=10001
    baseParams: {
      mkcid: '1',
      mkrid: '711-53200-19255-0',
      toolid: '10001'
    }
  },
  amazon: {
    enabled: !!process.env.AMAZON_AFFILIATE_TAG, // Auto-enable when tag is set
    tag: process.env.AMAZON_AFFILIATE_TAG || process.env.AMAZON_ASSOCIATE_TAG || '',
    // Amazon link format: https://www.amazon.com/dp/B0xxx?tag=YOUR_TAG
  },
  chrono24: {
    enabled: !!process.env.CHRONO24_REF_ID,
    refId: process.env.CHRONO24_REF_ID || ''
  }
};

/**
 * Convert eBay URL to affiliate link
 */
function convertEbayLink(url) {
  if (!AFFILIATE_CONFIG.ebay.enabled || !AFFILIATE_CONFIG.ebay.campaignId) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('ebay.com')) return url;

    // Add affiliate parameters
    const params = AFFILIATE_CONFIG.ebay.baseParams;
    urlObj.searchParams.set('mkcid', params.mkcid);
    urlObj.searchParams.set('mkrid', params.mkrid);
    urlObj.searchParams.set('campid', AFFILIATE_CONFIG.ebay.campaignId);
    urlObj.searchParams.set('toolid', params.toolid);

    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

/**
 * Convert Amazon URL to affiliate link
 */
function convertAmazonLink(url) {
  if (!AFFILIATE_CONFIG.amazon.enabled || !AFFILIATE_CONFIG.amazon.tag) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('amazon.com')) return url;

    urlObj.searchParams.set('tag', AFFILIATE_CONFIG.amazon.tag);
    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

/**
 * Convert any supported URL to affiliate link
 */
function convertToAffiliateLink(url) {
  if (!url) return url;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('ebay.com')) {
      return convertEbayLink(url);
    }

    if (hostname.includes('amazon.com')) {
      return convertAmazonLink(url);
    }

    // Add more converters as we add programs

    return url;
  } catch (e) {
    return url;
  }
}

/**
 * Process text and convert all URLs to affiliate links
 */
function processTextForAffiliateLinks(text) {
  if (!text) return text;

  // URL regex
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;

  return text.replace(urlRegex, (url) => {
    return convertToAffiliateLink(url);
  });
}

/**
 * Get affiliate status for dashboard
 */
function getAffiliateStatus() {
  return {
    programs: {
      ebay: {
        name: 'eBay Partner Network',
        enabled: AFFILIATE_CONFIG.ebay.enabled,
        configured: !!AFFILIATE_CONFIG.ebay.campaignId
      },
      amazon: {
        name: 'Amazon Associates',
        enabled: AFFILIATE_CONFIG.amazon.enabled,
        configured: !!AFFILIATE_CONFIG.amazon.tag
      },
      chrono24: {
        name: 'Chrono24',
        enabled: AFFILIATE_CONFIG.chrono24.enabled,
        configured: !!AFFILIATE_CONFIG.chrono24.refId
      }
    },
    totalEnabled: Object.values(AFFILIATE_CONFIG).filter(c => c.enabled).length
  };
}

/**
 * Enable/disable affiliate program
 */
function setAffiliateEnabled(program, enabled) {
  if (AFFILIATE_CONFIG[program]) {
    AFFILIATE_CONFIG[program].enabled = enabled;
    return true;
  }
  return false;
}

module.exports = {
  convertToAffiliateLink,
  convertEbayLink,
  convertAmazonLink,
  processTextForAffiliateLinks,
  getAffiliateStatus,
  setAffiliateEnabled,
  AFFILIATE_CONFIG
};
