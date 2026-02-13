/**
 * Price History API
 * 
 * Endpoints for querying price snapshots over time, aggregate stats,
 * and trend analysis per brand/model.
 */

const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const logger = require('../utils/logger');

// ============================================================================
// GET /api/price-history/stats
// 
// Returns aggregate stats: average price by brand, trend direction, top movers.
// NOTE: Must be defined BEFORE /:brand/:model to avoid "stats" matching as brand.
//
// Query params:
//   ?days=30    — how far back to look (default 30)
//   ?limit=20   — max brands returned (default 20)
// ============================================================================
router.get('/stats', async (req, res) => {
  try {
    if (!supabase.isAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const days = parseInt(req.query.days) || 30;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase.client
      .from('price_snapshots')
      .select('brand, model, price, source, snapshot_date')
      .gte('snapshot_date', startDate)
      .not('price', 'is', null)
      .gt('price', 0)
      .order('snapshot_date', { ascending: true });

    if (error) {
      logger.error('Error fetching price stats:', error);
      return res.status(500).json({ error: error.message });
    }

    const snapshots = data || [];

    if (snapshots.length === 0) {
      return res.json({
        days,
        totalSnapshots: 0,
        brandStats: [],
        topModels: [],
        sourceBreakdown: {},
      });
    }

    // --- Aggregate by brand ---
    const brandMap = {};
    for (const snap of snapshots) {
      const b = (snap.brand || 'Unknown').toLowerCase();
      if (!brandMap[b]) {
        brandMap[b] = { brand: snap.brand || 'Unknown', prices: [], earliest: [], latest: [] };
      }
      brandMap[b].prices.push(Number(snap.price));

      // Split into first-half / second-half for trend detection
      const midDate = new Date(Date.now() - (days / 2) * 24 * 60 * 60 * 1000);
      if (new Date(snap.snapshot_date) < midDate) {
        brandMap[b].earliest.push(Number(snap.price));
      } else {
        brandMap[b].latest.push(Number(snap.price));
      }
    }

    const brandStats = Object.values(brandMap)
      .map(b => {
        const avgPrice = Math.round(b.prices.reduce((a, c) => a + c, 0) / b.prices.length);
        const earlyAvg = b.earliest.length > 0
          ? b.earliest.reduce((a, c) => a + c, 0) / b.earliest.length
          : avgPrice;
        const lateAvg = b.latest.length > 0
          ? b.latest.reduce((a, c) => a + c, 0) / b.latest.length
          : avgPrice;
        const trendPct = earlyAvg > 0
          ? Math.round(((lateAvg - earlyAvg) / earlyAvg) * 100 * 100) / 100
          : 0;

        return {
          brand: b.brand,
          avgPrice,
          minPrice: Math.min(...b.prices),
          maxPrice: Math.max(...b.prices),
          snapshotCount: b.prices.length,
          trend: trendPct > 1 ? 'up' : trendPct < -1 ? 'down' : 'stable',
          trendPercent: trendPct,
        };
      })
      .sort((a, b) => b.snapshotCount - a.snapshotCount)
      .slice(0, limit);

    // --- Top models by snapshot count ---
    const modelMap = {};
    for (const snap of snapshots) {
      const key = `${(snap.brand || '').toLowerCase()}|${(snap.model || '').toLowerCase()}`;
      if (!modelMap[key]) {
        modelMap[key] = { brand: snap.brand, model: snap.model, prices: [] };
      }
      modelMap[key].prices.push(Number(snap.price));
    }

    const topModels = Object.values(modelMap)
      .map(m => ({
        brand: m.brand,
        model: m.model,
        avgPrice: Math.round(m.prices.reduce((a, c) => a + c, 0) / m.prices.length),
        snapshotCount: m.prices.length,
      }))
      .sort((a, b) => b.snapshotCount - a.snapshotCount)
      .slice(0, 10);

    // --- Source breakdown ---
    const sourceMap = {};
    for (const snap of snapshots) {
      const src = snap.source || 'unknown';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    }

    res.json({
      days,
      totalSnapshots: snapshots.length,
      brandStats,
      topModels,
      sourceBreakdown: sourceMap,
    });
  } catch (error) {
    logger.error('Price stats endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/price-history/:brand/:model
//
// Returns price snapshots over time for a given brand + model.
//
// Query params:
//   ?days=30       — how far back to look (default 30)
//   ?source=reddit — filter by source
//   ?limit=500     — max rows returned (default 500)
// ============================================================================
router.get('/:brand/:model', async (req, res) => {
  try {
    if (!supabase.isAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { brand, model } = req.params;
    const days = parseInt(req.query.days) || 30;
    const source = req.query.source || null;
    const limit = Math.min(parseInt(req.query.limit) || 500, 2000);

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase.client
      .from('price_snapshots')
      .select('id, listing_id, brand, model, reference_number, price, source, snapshot_date')
      .ilike('brand', `%${brand}%`)
      .ilike('model', `%${model}%`)
      .gte('snapshot_date', startDate)
      .order('snapshot_date', { ascending: true })
      .limit(limit);

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching price history:', error);
      return res.status(500).json({ error: error.message });
    }

    const snapshots = data || [];

    // Calculate summary stats
    const prices = snapshots.map(s => Number(s.price)).filter(p => p > 0);
    const stats = prices.length > 0 ? {
      count: prices.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      latest: prices[prices.length - 1],
      oldest: prices[0],
      change: prices[prices.length - 1] - prices[0],
      changePercent: prices[0] > 0
        ? Math.round(((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 * 100) / 100
        : 0,
      trend: prices[prices.length - 1] > prices[0] ? 'up'
        : prices[prices.length - 1] < prices[0] ? 'down'
        : 'stable',
    } : null;

    // Group by source for cross-platform comparison
    const bySource = {};
    for (const snap of snapshots) {
      if (!bySource[snap.source]) bySource[snap.source] = [];
      bySource[snap.source].push(snap);
    }

    res.json({
      brand,
      model,
      days,
      snapshots,
      stats,
      bySource,
    });
  } catch (error) {
    logger.error('Price history endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
