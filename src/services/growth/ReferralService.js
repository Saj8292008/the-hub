/**
 * Referral Service
 * 
 * Handles user referrals for growth
 * - Generate referral codes
 * - Track referrals
 * - Reward referrers
 */

const crypto = require('crypto');
const logger = require('../../utils/logger');

class ReferralService {
  constructor(supabase) {
    this.supabase = supabase;
    this.rewardTypes = {
      SIGNUP: 'signup',           // Someone signs up with your code
      SUBSCRIPTION: 'subscription', // Referral subscribes to premium
      MILESTONE: 'milestone'       // Hit referral milestones (5, 10, 25, etc.)
    };
    this.milestones = [5, 10, 25, 50, 100];
  }

  /**
   * Generate a unique referral code for a user
   */
  async generateCode(userId) {
    try {
      // Check if user already has a code
      const { data: existing } = await this.supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .single();

      if (existing) {
        return existing.code;
      }

      // Generate new code
      const code = this.createCode();

      await this.supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code,
          created_at: new Date().toISOString()
        });

      return code;

    } catch (error) {
      logger.error('Error generating referral code:', error);
      throw error;
    }
  }

  /**
   * Create a unique referral code
   */
  createCode() {
    // Format: HUB-XXXX-XXXX
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `HUB-${part1}-${part2}`;
  }

  /**
   * Process a referral signup
   */
  async processReferral(referralCode, newUserId, newUserEmail) {
    try {
      // Find the referrer
      const { data: referralData } = await this.supabase
        .from('referral_codes')
        .select('user_id')
        .eq('code', referralCode.toUpperCase())
        .single();

      if (!referralData) {
        logger.warn(`Invalid referral code: ${referralCode}`);
        return { success: false, error: 'Invalid referral code' };
      }

      const referrerId = referralData.user_id;

      // Prevent self-referral
      if (referrerId === newUserId) {
        return { success: false, error: 'Cannot refer yourself' };
      }

      // Record the referral
      await this.supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: newUserId,
          referral_code: referralCode.toUpperCase(),
          status: 'completed',
          created_at: new Date().toISOString()
        });

      // Update referrer stats
      await this.updateReferrerStats(referrerId);

      // Check for milestone rewards
      await this.checkMilestones(referrerId);

      // Award signup reward
      await this.awardReward(referrerId, this.rewardTypes.SIGNUP, {
        referred_email: newUserEmail
      });

      logger.info(`Referral processed: ${referralCode} -> ${newUserEmail}`);
      return { success: true, referrerId };

    } catch (error) {
      logger.error('Error processing referral:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update referrer statistics
   */
  async updateReferrerStats(userId) {
    try {
      // Count total referrals
      const { count } = await this.supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userId)
        .eq('status', 'completed');

      // Update user's referral count
      await this.supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          referral_count: count,
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      logger.error('Error updating referrer stats:', error);
    }
  }

  /**
   * Check and award milestone rewards
   */
  async checkMilestones(userId) {
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('referral_count, milestones_achieved')
        .eq('user_id', userId)
        .single();

      if (!profile) return;

      const achieved = profile.milestones_achieved || [];
      const count = profile.referral_count || 0;

      for (const milestone of this.milestones) {
        if (count >= milestone && !achieved.includes(milestone)) {
          // Award milestone reward
          await this.awardReward(userId, this.rewardTypes.MILESTONE, {
            milestone,
            total_referrals: count
          });

          // Update achieved milestones
          achieved.push(milestone);
          await this.supabase
            .from('user_profiles')
            .update({ milestones_achieved: achieved })
            .eq('user_id', userId);

          logger.info(`Milestone achieved: User ${userId} hit ${milestone} referrals`);
        }
      }
    } catch (error) {
      logger.error('Error checking milestones:', error);
    }
  }

  /**
   * Award a reward to a user
   */
  async awardReward(userId, rewardType, metadata = {}) {
    try {
      // Define rewards
      const rewards = {
        [this.rewardTypes.SIGNUP]: {
          type: 'credit',
          amount: 100, // $1 credit
          description: 'Referral signup bonus'
        },
        [this.rewardTypes.SUBSCRIPTION]: {
          type: 'credit',
          amount: 500, // $5 credit
          description: 'Referral subscription bonus'
        },
        [this.rewardTypes.MILESTONE]: {
          type: 'badge',
          badge: `referral_${metadata.milestone}`,
          description: `Reached ${metadata.milestone} referrals!`
        }
      };

      const reward = rewards[rewardType];
      if (!reward) return;

      // Record the reward
      await this.supabase
        .from('rewards')
        .insert({
          user_id: userId,
          reward_type: rewardType,
          reward_data: reward,
          metadata,
          awarded_at: new Date().toISOString()
        });

      // If credit reward, update user balance
      if (reward.type === 'credit') {
        const { data: currentBalance } = await this.supabase
          .from('user_profiles')
          .select('credit_balance')
          .eq('user_id', userId)
          .single();

        const newBalance = (currentBalance?.credit_balance || 0) + reward.amount;

        await this.supabase
          .from('user_profiles')
          .upsert({
            user_id: userId,
            credit_balance: newBalance,
            updated_at: new Date().toISOString()
          });
      }

      logger.info(`Reward awarded to ${userId}: ${rewardType}`);

    } catch (error) {
      logger.error('Error awarding reward:', error);
    }
  }

  /**
   * Get referral stats for a user
   */
  async getStats(userId) {
    try {
      // Get referral code
      const { data: codeData } = await this.supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .single();

      // Get referral count
      const { data: referrals } = await this.supabase
        .from('referrals')
        .select('created_at, status')
        .eq('referrer_id', userId);

      // Get rewards
      const { data: rewards } = await this.supabase
        .from('rewards')
        .select('*')
        .eq('user_id', userId);

      // Get profile
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('referral_count, credit_balance, milestones_achieved')
        .eq('user_id', userId)
        .single();

      const totalEarned = (rewards || [])
        .filter(r => r.reward_data?.type === 'credit')
        .reduce((sum, r) => sum + (r.reward_data?.amount || 0), 0);

      return {
        code: codeData?.code || await this.generateCode(userId),
        referralLink: `https://thehub.deals/join?ref=${codeData?.code}`,
        totalReferrals: referrals?.length || 0,
        completedReferrals: referrals?.filter(r => r.status === 'completed').length || 0,
        creditBalance: profile?.credit_balance || 0,
        totalEarned,
        milestonesAchieved: profile?.milestones_achieved || [],
        nextMilestone: this.milestones.find(m => m > (profile?.referral_count || 0)),
        rewardsHistory: rewards || []
      };

    } catch (error) {
      logger.error('Error getting referral stats:', error);
      return null;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 10) {
    try {
      const { data } = await this.supabase
        .from('user_profiles')
        .select('user_id, referral_count')
        .gt('referral_count', 0)
        .order('referral_count', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      return [];
    }
  }
}

module.exports = ReferralService;
