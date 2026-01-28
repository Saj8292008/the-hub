/**
 * Should I Buy? AI Service
 * Analyzes a listing URL and provides a verdict on whether it's a good deal
 */

const openaiClient = require('../openai/client');
const supabase = require('../../db/supabase');
const axios = require('axios');
const cheerio = require('cheerio');

class ShouldIBuyAnalyzer {
  constructor() {
    this.supportedDomains = [
      'chrono24.com',
      'watchuseek.com',
      'reddit.com',
      'ebay.com',
      'cargurus.com',
      'autotrader.com',
      'stockx.com',
      'goat.com',
      'grailed.com',
      'facebook.com/marketplace'
    ];
  }

  /**
   * Analyze a listing URL and provide buying recommendation
   * @param {string} url - The listing URL to analyze
   * @returns {Promise<Object>} Analysis result
   */
  async analyze(url) {
    if (!url) {
      throw new Error('URL is required');
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Determine category from URL
    const category = this.detectCategory(url);

    // Step 1: Scrape listing details
    const listingData = await this.scrapeListingDetails(url);
    
    // Step 2: Get comparable sales from our database
    const comparables = await this.findComparables(listingData, category);
    
    // Step 3: Detect red flags
    const redFlags = this.detectRedFlags(listingData, comparables);
    
    // Step 4: Calculate price analysis
    const priceAnalysis = this.analyzePricing(listingData, comparables);
    
    // Step 5: Get AI verdict
    const verdict = await this.getAIVerdict(listingData, comparables, redFlags, priceAnalysis);
    
    return {
      url,
      category,
      listing: {
        title: listingData.title,
        price: listingData.price,
        condition: listingData.condition,
        seller: listingData.seller,
        source: listingData.source
      },
      verdict: verdict.recommendation, // 'BUY', 'WAIT', 'PASS'
      confidence: verdict.confidence, // 0-100
      summary: verdict.summary,
      priceAnalysis: {
        askingPrice: listingData.price,
        marketAverage: priceAnalysis.marketAverage,
        percentFromMarket: priceAnalysis.percentFromMarket,
        priceVerdict: priceAnalysis.verdict // 'BELOW_MARKET', 'AT_MARKET', 'ABOVE_MARKET'
      },
      redFlags: redFlags,
      comparableSales: comparables.slice(0, 5).map(c => ({
        title: c.title,
        price: c.price,
        soldDate: c.sold_at || c.timestamp,
        source: c.source
      })),
      reasons: verdict.reasons
    };
  }

  /**
   * Detect the category from URL domain
   */
  detectCategory(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('chrono24') || urlLower.includes('watchuseek') || urlLower.includes('watch')) {
      return 'watches';
    }
    if (urlLower.includes('cargurus') || urlLower.includes('autotrader') || urlLower.includes('cars')) {
      return 'cars';
    }
    if (urlLower.includes('stockx') || urlLower.includes('goat') || urlLower.includes('sneaker')) {
      return 'sneakers';
    }
    
    // Default to watches (most common)
    return 'watches';
  }

  /**
   * Scrape basic listing details from URL
   */
  async scrapeListingDetails(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      
      // Extract common data points
      const title = this.extractTitle($);
      const price = this.extractPrice($);
      const condition = this.extractCondition($);
      const description = this.extractDescription($);
      const seller = this.extractSeller($);
      const images = this.extractImages($);
      
      // Parse brand/model from title
      const { brand, model } = this.parseBrandModel(title);

      return {
        url,
        title,
        price,
        condition,
        description,
        seller,
        images,
        brand,
        model,
        source: new URL(url).hostname.replace('www.', '')
      };
    } catch (error) {
      console.error('Error scraping listing:', error);
      // Return minimal data on error
      return {
        url,
        title: 'Unable to scrape - manual entry needed',
        price: null,
        condition: 'Unknown',
        description: '',
        seller: 'Unknown',
        images: [],
        brand: '',
        model: '',
        source: new URL(url).hostname.replace('www.', ''),
        scrapeError: error.message
      };
    }
  }

  extractTitle($) {
    // Try common title selectors
    const selectors = [
      'h1',
      '[data-testid="listing-title"]',
      '.listing-title',
      '.product-title',
      'meta[property="og:title"]'
    ];
    
    for (const selector of selectors) {
      const el = $(selector).first();
      if (el.length) {
        const text = selector.includes('meta') ? el.attr('content') : el.text();
        if (text && text.trim().length > 5) {
          return text.trim().substring(0, 200);
        }
      }
    }
    
    return $('title').text().trim().substring(0, 200) || 'Unknown Title';
  }

  extractPrice($) {
    // Try to find price patterns
    const pricePatterns = [
      /\$[\d,]+(?:\.\d{2})?/,
      /USD\s*[\d,]+(?:\.\d{2})?/,
      /Price:\s*\$?([\d,]+)/i
    ];
    
    const text = $('body').text();
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        const priceStr = match[0].replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr);
        if (price > 0 && price < 10000000) { // Sanity check
          return price;
        }
      }
    }
    
    return null;
  }

  extractCondition($) {
    const conditionKeywords = [
      'new', 'unworn', 'mint', 'excellent', 'very good', 'good', 'fair', 'poor', 'used'
    ];
    
    const text = $('body').text().toLowerCase();
    
    for (const keyword of conditionKeywords) {
      if (text.includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }
    
    return 'Unknown';
  }

  extractDescription($) {
    const selectors = [
      '.description',
      '.listing-description',
      '[data-testid="description"]',
      '.product-description'
    ];
    
    for (const selector of selectors) {
      const text = $(selector).text().trim();
      if (text && text.length > 20) {
        return text.substring(0, 1000);
      }
    }
    
    return '';
  }

  extractSeller($) {
    const selectors = [
      '.seller-name',
      '.dealer-name',
      '[data-testid="seller"]',
      '.username'
    ];
    
    for (const selector of selectors) {
      const text = $(selector).text().trim();
      if (text && text.length > 0) {
        return text.substring(0, 100);
      }
    }
    
    return 'Unknown';
  }

  extractImages($) {
    const images = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
        images.push(src);
      }
    });
    return images.slice(0, 10);
  }

  parseBrandModel(title) {
    // Common watch brands
    const watchBrands = [
      'Rolex', 'Omega', 'Patek Philippe', 'Audemars Piguet', 'Tudor', 'Cartier',
      'IWC', 'Panerai', 'Breitling', 'TAG Heuer', 'Seiko', 'Grand Seiko', 'Citizen'
    ];
    
    // Common car brands
    const carBrands = [
      'Porsche', 'BMW', 'Mercedes', 'Audi', 'Toyota', 'Honda', 'Ford', 'Chevrolet'
    ];
    
    // Common sneaker brands
    const sneakerBrands = [
      'Nike', 'Jordan', 'Adidas', 'New Balance', 'Yeezy', 'Puma', 'Converse'
    ];
    
    const allBrands = [...watchBrands, ...carBrands, ...sneakerBrands];
    
    let brand = '';
    let model = title;
    
    for (const b of allBrands) {
      if (title.toLowerCase().includes(b.toLowerCase())) {
        brand = b;
        model = title.replace(new RegExp(b, 'i'), '').trim();
        break;
      }
    }
    
    return { brand, model };
  }

  /**
   * Find comparable sales from our database
   */
  async findComparables(listing, category) {
    if (!supabase.isAvailable()) {
      return [];
    }

    try {
      const tableName = `${category.replace(/s$/, '')}_listings`;
      
      let query = supabase.client
        .from(tableName)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      // Filter by brand if available
      if (listing.brand) {
        query = query.ilike('brand', `%${listing.brand}%`);
      }
      
      // Filter by model if available
      if (listing.model && listing.model.length > 3) {
        query = query.ilike('model', `%${listing.model.split(' ')[0]}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching comparables:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in findComparables:', error);
      return [];
    }
  }

  /**
   * Detect potential red flags in the listing
   */
  detectRedFlags(listing, comparables) {
    const flags = [];
    
    // Price too low (more than 40% below market)
    if (listing.price && comparables.length > 0) {
      const avgPrice = comparables.reduce((sum, c) => sum + (c.price || 0), 0) / comparables.length;
      if (avgPrice > 0 && listing.price < avgPrice * 0.6) {
        flags.push({
          severity: 'high',
          flag: 'Price significantly below market',
          detail: `Asking $${listing.price.toLocaleString()} is ${Math.round((1 - listing.price / avgPrice) * 100)}% below average ($${Math.round(avgPrice).toLocaleString()}). Could indicate counterfeit or scam.`
        });
      }
    }
    
    // Unknown seller
    if (!listing.seller || listing.seller === 'Unknown') {
      flags.push({
        severity: 'medium',
        flag: 'Unknown seller',
        detail: 'Unable to verify seller reputation. Exercise caution.'
      });
    }
    
    // No images or very few
    if (!listing.images || listing.images.length < 3) {
      flags.push({
        severity: 'medium',
        flag: 'Limited photos',
        detail: 'Listing has few photos. Request additional images before purchasing.'
      });
    }
    
    // Vague description
    if (!listing.description || listing.description.length < 50) {
      flags.push({
        severity: 'low',
        flag: 'Minimal description',
        detail: 'Listing lacks detailed description. Ask seller for more information.'
      });
    }
    
    // Condition mismatch keywords
    const description = (listing.description || '').toLowerCase();
    const suspiciousTerms = ['as-is', 'no returns', 'final sale', 'needs work', 'project'];
    for (const term of suspiciousTerms) {
      if (description.includes(term)) {
        flags.push({
          severity: 'medium',
          flag: `Listing mentions "${term}"`,
          detail: 'This term may indicate issues with the item. Clarify with seller.'
        });
      }
    }
    
    return flags;
  }

  /**
   * Analyze pricing compared to market
   */
  analyzePricing(listing, comparables) {
    if (!listing.price || comparables.length === 0) {
      return {
        marketAverage: null,
        percentFromMarket: null,
        verdict: 'UNKNOWN'
      };
    }
    
    // Calculate average from comparables
    const prices = comparables.map(c => c.price).filter(p => p > 0);
    if (prices.length === 0) {
      return {
        marketAverage: null,
        percentFromMarket: null,
        verdict: 'UNKNOWN'
      };
    }
    
    const marketAverage = prices.reduce((a, b) => a + b, 0) / prices.length;
    const percentFromMarket = Math.round(((listing.price - marketAverage) / marketAverage) * 100);
    
    let verdict;
    if (percentFromMarket <= -15) {
      verdict = 'BELOW_MARKET';
    } else if (percentFromMarket <= 10) {
      verdict = 'AT_MARKET';
    } else {
      verdict = 'ABOVE_MARKET';
    }
    
    return {
      marketAverage: Math.round(marketAverage),
      percentFromMarket,
      verdict
    };
  }

  /**
   * Get AI-powered verdict on the listing
   */
  async getAIVerdict(listing, comparables, redFlags, priceAnalysis) {
    // Build context for AI
    const context = {
      listing: {
        title: listing.title,
        price: listing.price,
        condition: listing.condition,
        seller: listing.seller,
        source: listing.source
      },
      comparables: comparables.slice(0, 5).map(c => ({
        title: c.title || c.model,
        price: c.price,
        source: c.source
      })),
      redFlags: redFlags.map(f => f.flag),
      priceAnalysis: priceAnalysis
    };
    
    // If AI is not available, use rule-based verdict
    if (!openaiClient.isAvailable()) {
      return this.getRuleBasedVerdict(context, redFlags, priceAnalysis);
    }
    
    try {
      const prompt = `You are an expert deal analyst. Analyze this listing and provide a buying recommendation.

LISTING:
- Title: ${listing.title}
- Price: $${listing.price?.toLocaleString() || 'Unknown'}
- Condition: ${listing.condition}
- Seller: ${listing.seller}
- Source: ${listing.source}

COMPARABLE SALES (last 90 days):
${comparables.slice(0, 5).map(c => `- ${c.title || c.model}: $${c.price?.toLocaleString()}`).join('\n') || 'No comparables found'}

RED FLAGS DETECTED:
${redFlags.map(f => `- [${f.severity}] ${f.flag}: ${f.detail}`).join('\n') || 'None'}

PRICE ANALYSIS:
- Market Average: $${priceAnalysis.marketAverage?.toLocaleString() || 'Unknown'}
- This listing is ${priceAnalysis.percentFromMarket > 0 ? priceAnalysis.percentFromMarket + '% above' : Math.abs(priceAnalysis.percentFromMarket) + '% below'} market average

Provide your analysis in this JSON format:
{
  "recommendation": "BUY" | "WAIT" | "PASS",
  "confidence": 0-100,
  "summary": "2-3 sentence summary",
  "reasons": ["reason 1", "reason 2", "reason 3"]
}`;

      const response = await openaiClient.chat({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert deal analyst. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      });
      
      const content = response.choices[0].message.content.trim();
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid AI response format');
    } catch (error) {
      console.error('AI verdict error:', error);
      return this.getRuleBasedVerdict(context, redFlags, priceAnalysis);
    }
  }

  /**
   * Fallback rule-based verdict when AI is unavailable
   */
  getRuleBasedVerdict(context, redFlags, priceAnalysis) {
    const highSeverityFlags = redFlags.filter(f => f.severity === 'high').length;
    const mediumSeverityFlags = redFlags.filter(f => f.severity === 'medium').length;
    
    let recommendation = 'WAIT';
    let confidence = 50;
    const reasons = [];
    
    // Price-based decision
    if (priceAnalysis.verdict === 'BELOW_MARKET') {
      recommendation = 'BUY';
      confidence += 20;
      reasons.push(`Price is ${Math.abs(priceAnalysis.percentFromMarket)}% below market average`);
    } else if (priceAnalysis.verdict === 'ABOVE_MARKET') {
      recommendation = 'PASS';
      confidence += 10;
      reasons.push(`Price is ${priceAnalysis.percentFromMarket}% above market average`);
    }
    
    // Red flag adjustments
    if (highSeverityFlags > 0) {
      recommendation = 'PASS';
      confidence = Math.max(70, confidence);
      reasons.push(`${highSeverityFlags} high-severity red flag(s) detected`);
    } else if (mediumSeverityFlags >= 2) {
      if (recommendation === 'BUY') recommendation = 'WAIT';
      reasons.push(`${mediumSeverityFlags} medium-severity concerns found`);
    }
    
    // No comparables
    if (context.comparables.length === 0) {
      confidence -= 20;
      reasons.push('Limited market data available for comparison');
    }
    
    // Generate summary
    let summary;
    switch (recommendation) {
      case 'BUY':
        summary = `This looks like a good deal. The price is competitive and no major red flags were found.`;
        break;
      case 'PASS':
        summary = `We recommend passing on this listing. ${highSeverityFlags > 0 ? 'Significant red flags were detected.' : 'The price is above market average.'}`;
        break;
      default:
        summary = `This listing needs more research. Consider negotiating or waiting for a better deal.`;
    }
    
    return {
      recommendation,
      confidence: Math.min(100, Math.max(0, confidence)),
      summary,
      reasons
    };
  }
}

module.exports = new ShouldIBuyAnalyzer();
