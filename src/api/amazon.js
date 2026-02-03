/**
 * Amazon Deals API
 * Endpoints for fetching and managing Amazon deals
 */

const express = require('express');
const router = express.Router();
const supabaseClient = require('../db/supabase');
const { getAffiliateService } = require('../services/affiliate/AffiliateService');

// Get the actual Supabase client
const supabase = supabaseClient.client;

/**
 * GET /api/amazon/deals
 * Fetch Amazon deals with optional filters
 * 
 * Query params:
 *   - category: watches|sneakers (optional)
 *   - limit: number (default 20, max 100)
 *   - minScore: minimum deal score (default 0)
 *   - brand: filter by brand (optional)
 *   - minDiscount: minimum discount % (optional)
 *   - prime: true|false (optional)
 */
router.get('/deals', async (req, res) => {
  try {
    const {
      category,
      limit = 20,
      minScore = 0,
      brand,
      minDiscount,
      prime
    } = req.query;

    let query = supabase
      .from('watch_listings')
      .select('*')
      .eq('source', 'amazon')
      .gte('deal_score', parseInt(minScore))
      .order('deal_score', { ascending: false })
      .order('timestamp', { ascending: false })
      .limit(Math.min(parseInt(limit), 100));

    // Category filter (check title/brand for keywords)
    if (category === 'watches') {
      query = query.or('brand.ilike.%seiko%,brand.ilike.%orient%,brand.ilike.%tissot%,brand.ilike.%hamilton%,brand.ilike.%citizen%,brand.ilike.%casio%,brand.ilike.%timex%,brand.ilike.%bulova%,brand.ilike.%fossil%');
    } else if (category === 'sneakers') {
      query = query.or('brand.ilike.%nike%,brand.ilike.%adidas%,brand.ilike.%jordan%,brand.ilike.%puma%,brand.ilike.%new balance%,brand.ilike.%reebok%,brand.ilike.%converse%,brand.ilike.%vans%');
    }

    // Brand filter
    if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }

    // Prime filter (stored in location field)
    if (prime === 'true') {
      query = query.ilike('location', '%Prime%');
    }

    const { data, error } = await query;

    if (error) throw error;

    // Add affiliate URLs if service is configured
    const affiliateService = getAffiliateService();
    const deals = data.map(d => ({
      ...d,
      affiliate_url: affiliateService.transformUrl(d.url),
      has_affiliate: affiliateService.isConfigured()
    }));

    res.json({
      success: true,
      deals,
      count: deals.length,
      filters: { category, minScore, brand, prime }
    });

  } catch (error) {
    console.error('Amazon deals error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/amazon/top
 * Get today's top Amazon deals
 */
router.get('/top', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    const { data, error } = await supabase
      .from('watch_listings')
      .select('*')
      .eq('source', 'amazon')
      .gte('deal_score', 7)
      .order('deal_score', { ascending: false })
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const affiliateService = getAffiliateService();
    const deals = data.map(d => ({
      id: d.id,
      title: d.title,
      brand: d.brand,
      price: d.price,
      deal_score: d.deal_score,
      url: affiliateService.transformUrl(d.url),
      image: d.images?.[0],
      prime: d.location?.includes('Prime')
    }));

    res.json({ deals });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/amazon/stats
 * Get Amazon scraper statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Count total Amazon listings
    const { count: totalCount, error: countError } = await supabase
      .from('watch_listings')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'amazon');

    // Count by score ranges
    const { data: scoreData } = await supabase
      .from('watch_listings')
      .select('deal_score')
      .eq('source', 'amazon');

    const scoreDist = {
      excellent: scoreData?.filter(d => d.deal_score >= 8).length || 0,
      good: scoreData?.filter(d => d.deal_score >= 6 && d.deal_score < 8).length || 0,
      average: scoreData?.filter(d => d.deal_score < 6).length || 0
    };

    // Get affiliate status
    const affiliateService = getAffiliateService();
    const affiliateStatus = affiliateService.getStats();

    res.json({
      totalDeals: totalCount || 0,
      scoreDistribution: scoreDist,
      affiliate: {
        configured: affiliateStatus.configured.amazon,
        linksGenerated: affiliateStatus.bySource?.amazon || 0
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/amazon/refresh
 * Trigger a refresh of Amazon deals (protected)
 */
router.post('/refresh', async (req, res) => {
  // This would trigger the scraper - for now just return info
  res.json({
    message: 'To refresh Amazon deals, run: node scripts/scrape-amazon.js',
    note: 'Automated scheduling coming soon'
  });
});

module.exports = router;
