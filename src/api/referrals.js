/**
 * Referral API
 * 
 * Endpoints for referral program
 * - Get/generate referral code
 * - Track referral stats
 * - View progress towards free months
 * - Leaderboard
 */

const express = require('express');
const router = express.Router();
const ReferralService = require('../services/growth/ReferralService');
const supabase = require('../db/supabase');
const { authenticateToken } = require('../middleware/auth');

const referralService = new ReferralService(supabase.client);

/**
 * GET /api/referrals/code
 * Get or generate referral code for authenticated user
 */
router.get('/code', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const code = await referralService.generateCode(userId);
    
    res.json({
      code,
      referralLink: `https://thehub.deals/signup?ref=${code}`,
      shortLink: `thehub.deals/r/${code}`
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
 * Get comprehensive referral stats for authenticated user
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
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
 * GET /api/referrals/progress
 * Get progress towards next free month
 */
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await referralService.getStats(userId);
    
    if (!stats) {
      return res.status(404).json({ error: 'Stats not found' });
    }
    
    res.json({
      paidReferrals: stats.paidReferrals,
      progressToNextMonth: stats.progressToNextMonth,
      referralsNeeded: stats.referralsNeededForNextMonth,
      requiredForReward: stats.requiredPaidReferrals,
      freeMonthsEarned: stats.freeMonthsEarned,
      totalDaysEarned: stats.totalDaysEarned,
      progressPercentage: Math.round((stats.progressToNextMonth / stats.requiredPaidReferrals) * 100)
    });
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
 * Validate a referral code (public - used during signup)
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await referralService.validateCode(code);
    res.json(result);
  } catch (error) {
    res.json({ valid: false });
  }
});

/**
 * GET /api/referrals/history
 * Get referral history for authenticated user
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 50;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await referralService.getStats(userId);
    
    if (!stats) {
      return res.status(404).json({ error: 'Stats not found' });
    }
    
    res.json({
      referrals: stats.referrals.slice(0, limit),
      total: stats.totalReferrals,
      paid: stats.paidReferrals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/referrals/rewards
 * Get reward history for authenticated user
 */
router.get('/rewards', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const stats = await referralService.getStats(userId);
    
    if (!stats) {
      return res.status(404).json({ error: 'Stats not found' });
    }
    
    res.json({
      freeMonthsEarned: stats.freeMonthsEarned,
      totalDaysEarned: stats.totalDaysEarned,
      rewardHistory: stats.rewardHistory,
      milestonesAchieved: stats.milestonesAchieved,
      nextMilestone: stats.nextMilestone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
