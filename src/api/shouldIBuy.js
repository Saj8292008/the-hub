/**
 * Should I Buy? API Endpoint
 * POST /api/should-i-buy
 * Analyzes a listing URL and provides a buying recommendation
 */

const shouldIBuyAnalyzer = require('../services/ai/shouldIBuy');

class ShouldIBuyAPI {
  /**
   * Analyze a listing URL
   * POST /api/should-i-buy
   * Body: { url: string }
   */
  async analyze(req) {
    const { url } = req.body;

    if (!url) {
      return {
        error: 'URL is required',
        status: 400
      };
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return {
        error: 'Invalid URL format',
        status: 400
      };
    }

    try {
      const result = await shouldIBuyAnalyzer.analyze(url);
      
      return {
        success: true,
        analysis: result
      };
    } catch (error) {
      console.error('Should I Buy analysis error:', error);
      return {
        error: error.message || 'Analysis failed',
        status: 500
      };
    }
  }

  /**
   * Quick price check without full analysis
   * POST /api/should-i-buy/quick
   * Body: { brand: string, model: string, price: number, category?: string }
   */
  async quickCheck(req) {
    const { brand, model, price, category = 'watches' } = req.body;

    if (!brand || !model || !price) {
      return {
        error: 'Brand, model, and price are required',
        status: 400
      };
    }

    try {
      // Create a mock listing for analysis
      const mockListing = {
        title: `${brand} ${model}`,
        brand,
        model,
        price: parseFloat(price),
        condition: 'Unknown',
        seller: 'Manual entry',
        source: 'user-input'
      };

      const comparables = await shouldIBuyAnalyzer.findComparables(mockListing, category);
      const priceAnalysis = shouldIBuyAnalyzer.analyzePricing(mockListing, comparables);

      return {
        success: true,
        quickAnalysis: {
          brand,
          model,
          askingPrice: price,
          marketAverage: priceAnalysis.marketAverage,
          percentFromMarket: priceAnalysis.percentFromMarket,
          verdict: priceAnalysis.verdict,
          comparablesFound: comparables.length,
          recommendation: priceAnalysis.verdict === 'BELOW_MARKET' ? 'Good price!' : 
                          priceAnalysis.verdict === 'AT_MARKET' ? 'Fair price' : 
                          'Consider negotiating'
        }
      };
    } catch (error) {
      console.error('Quick check error:', error);
      return {
        error: error.message || 'Quick check failed',
        status: 500
      };
    }
  }
}

module.exports = new ShouldIBuyAPI();
