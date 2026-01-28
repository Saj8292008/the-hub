/**
 * Referral API
 * 
 * Endpoints for referral program
 */

const express = require('express');
const router = express.Router();
const ReferralService = require('../services/growth/ReferralService');
const supabase = require('../db/supabase');

const referralService = new ReferralService(supabase.client);

/**
 * GET /api/referrals/code
 * Get or generate referral code for authenticated user
 */
router.get('/code', async (req, res) => {
  try {
    // For now, use a query param for user ID (in production, use auth)
    const userId = req.query.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const code = await referralService.generateCode(userId);
    
    res.json({
      code,
      referralLink: `https://thehub.deals/join?ref=${code}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/referrals/apply
 * Apply a referral code during signup
 */
router.post('/apply', async (req, res) => {
  try {
    const { referralCode, userId, email } = req.body;
    
    if (!referralCode || !userId) {
      return res.status(400).json({ error: 'Referral code and user ID required' });
    }
    
    const result = await referralService.processReferral(referralCode, userId, email);
    
    if (result.success) {
      res.json({ success: true, message: 'Referral applied successfully' });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/referrals/stats
 * Get referral stats for a user
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const stats = await referralService.getStats(userId);
    
    if (!stats) {
      return res.status(404).json({ error: 'Stats not found' });
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/referrals/leaderboard
 * Get referral leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await referralService.getLeaderboard(limit);
    
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/referrals/validate/:code
 * Validate a referral code
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const { data } = await supabase.client
      .from('referral_codes')
      .select('code, is_active')
      .eq('code', code.toUpperCase())
      .single();
    
    if (data && data.is_active) {
      res.json({ valid: true, code: data.code });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    res.json({ valid: false });
  }
});

module.exports = router;
