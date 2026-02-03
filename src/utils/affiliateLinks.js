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
  awin: {
    enabled: !!process.env.AWIN_AFFILIATE_ID,
    affiliateId: process.env.AWIN_AFFILIATE_ID || '',
    // Awin link format: https://www.awin1.com/cread.php?awinmid=MERCHANT&awinaffid=YOUR_ID&ued=ENCODED_URL
    merchants: {
      // Sneakers & Footwear
      'stockx.com': '89141',
      'footlocker.com': '2498',
      'finishline.com': '2627',
      'champssports.com': '2572',
      'eastbay.com': '2559',
      
      // Watches
      'fossil.com': '6435',
      'timex.com': '6779',
      'ashford.com': '4174',
      'citizenwatch.com': '7498',
      'mvmt.com': '8175',
      
      // Auto & Cars
      'autozone.com': '10082',
      'advanceautoparts.com': '10120',
      'tirerack.com': '4660',
      'carparts.com': '78498',
      'carid.com': '30498',
      'weathertech.com': '41898',
      
      // Fashion & Retail
      'nordstrom.com': '2767'
    }
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
 * Convert URL to Awin affiliate link (for supported merchants)
 */
function convertAwinLink(url) {
  if (!AFFILIATE_CONFIG.awin.enabled || !AFFILIATE_CONFIG.awin.affiliateId) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '');
    
    // Check if this merchant is supported
    const merchantId = AFFILIATE_CONFIG.awin.merchants[hostname];
    if (!merchantId) return url;

    // Build Awin tracking link
    const encodedUrl = encodeURIComponent(url);
    return `https://www.awin1.com/cread.php?awinmid=${merchantId}&awinaffid=${AFFILIATE_CONFIG.awin.affiliateId}&ued=${encodedUrl}`;
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

    // Try Awin for supported merchants (StockX, Fossil, Nordstrom, Foot Locker, etc.)
    const awinResult = convertAwinLink(url);
    if (awinResult !== url) {
      return awinResult;
    }

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
      awin: {
        name: 'Awin (ShareASale)',
        enabled: AFFILIATE_CONFIG.awin.enabled,
        configured: !!AFFILIATE_CONFIG.awin.affiliateId,
        merchants: Object.keys(AFFILIATE_CONFIG.awin.merchants || {})
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
  convertAwinLink,
  processTextForAffiliateLinks,
  getAffiliateStatus,
  setAffiliateEnabled,
  AFFILIATE_CONFIG
};
