/**
 * Referral Service
 * 
 * Handles user referrals for growth
 * - Generate referral codes
 * - Track referrals
 * - Reward referrers with FREE MONTHS (3 paid signups = 1 free month)
 */

const crypto = require('crypto');
const logger = require('../../utils/logger');

class ReferralService {
  constructor(supabase) {
    this.supabase = supabase;
    
    // Reward configuration
    this.PAID_REFERRALS_FOR_FREE_MONTH = 3; // 3 paid signups = 1 free month
    this.FREE_MONTH_DAYS = 30;
    
    this.rewardTypes = {
      SIGNUP: 'signup',              // Someone signs up with your code
      PAID_SUBSCRIPTION: 'paid_subscription', // Referral subscribes to premium
      FREE_MONTH: 'free_month',       // Earned a free month of Pro
      MILESTONE: 'milestone'          // Hit referral milestones
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

      // Insert into referral_codes table
      await this.supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code,
          created_at: new Date().toISOString()
        });
      
      // Also update user's referral_code column for quick access
      await this.supabase
        .from('users')
        .update({ referral_code: code })
        .eq('id', userId);

      return code;

    } catch (error) {
      logger.error('Error generating referral code:', error);
      throw error;
    }
  }

  /**
   * Create a unique referral code
   * Format: HUB-XXXX-XXXX
   */
  createCode() {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `HUB-${part1}-${part2}`;
  }

  /**
   * Process a referral signup
   * Called when a new user signs up with a referral code
   */
  async processReferral(referralCode, newUserId, newUserEmail) {
    try {
      // Find the referrer by code
      const { data: referralData } = await this.supabase
        .from('referral_codes')
        .select('user_id')
        .eq('code', referralCode.toUpperCase())
        .eq('is_active', true)
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

      // Check if user was already referred
      const { data: existingReferral } = await this.supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', newUserId)
        .single();

      if (existingReferral) {
        return { success: false, error: 'User already has a referrer' };
      }

      // Record the referral
      await this.supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: newUserId,
          referral_code: referralCode.toUpperCase(),
          status: 'completed',
          converted_to_paid: false,
          created_at: new Date().toISOString()
        });

      // Update the referred user's referred_by column
      await this.supabase
        .from('users')
        .update({ referred_by: referrerId })
        .eq('id', newUserId);

      // Update referrer stats
      await this.updateReferrerStats(referrerId);

      logger.info(`✅ Referral processed: ${referralCode} -> ${newUserEmail}`);
      return { success: true, referrerId };

    } catch (error) {
      logger.error('Error processing referral:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process a paid subscription from a referred user
   * This is called from the Stripe webhook when a referred user pays
   */
  async processPaidReferral(userId) {
    try {
      // Find the referral record for this user
      const { data: referral } = await this.supabase
        .from('referrals')
        .select('id, referrer_id, converted_to_paid')
        .eq('referred_id', userId)
        .single();

      if (!referral) {
        logger.info(`User ${userId} was not referred`);
        return { success: false, notReferred: true };
      }

      if (referral.converted_to_paid) {
        logger.info(`Referral for user ${userId} already marked as paid`);
        return { success: false, alreadyPaid: true };
      }

      // Mark the referral as paid
      await this.supabase
        .from('referrals')
        .update({
          converted_to_paid: true,
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', referral.id);

      // Update referrer's paid referral count
      await this.updatePaidReferralCount(referral.referrer_id);

      // Check if referrer qualifies for a free month reward
      await this.checkAndAwardFreeMonth(referral.referrer_id);

      logger.info(`💰 Paid referral processed for referrer ${referral.referrer_id}`);
      return { success: true, referrerId: referral.referrer_id };

    } catch (error) {
      logger.error('Error processing paid referral:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update referrer's paid referral count
   */
  async updatePaidReferralCount(userId) {
    try {
      // Count total paid referrals
      const { count } = await this.supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userId)
        .eq('converted_to_paid', true);

      // Upsert user profile with paid count
      await this.supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          paid_referral_count: count || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    } catch (error) {
      logger.error('Error updating paid referral count:', error);
    }
  }

  /**
   * Check if user qualifies for free month and award it
   * Awards 1 free month for every 3 paid referrals
   */
  async checkAndAwardFreeMonth(userId) {
    try {
      // Get paid referral count
      const { count: paidCount } = await this.supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userId)
        .eq('converted_to_paid', true);

      // Get already rewarded months
      const { data: rewards } = await this.supabase
        .from('referral_rewards')
        .select('trigger_referral_count')
        .eq('user_id', userId)
        .eq('reward_type', 'free_month');

      const rewardedCount = rewards?.reduce((sum, r) => sum + (r.trigger_referral_count || 0), 0) || 0;

      // Calculate how many rewards they've earned vs received
      const earnedRewards = Math.floor(paidCount / this.PAID_REFERRALS_FOR_FREE_MONTH);
      const receivedRewards = Math.floor(rewardedCount / this.PAID_REFERRALS_FOR_FREE_MONTH);
      const pendingRewards = earnedRewards - receivedRewards;

      if (pendingRewards > 0) {
        // Award each pending free month
        for (let i = 0; i < pendingRewards; i++) {
          await this.awardFreeMonth(userId, (receivedRewards + i + 1) * this.PAID_REFERRALS_FOR_FREE_MONTH);
        }
      }

      return { paidCount, earnedRewards, pendingRewards };

    } catch (error) {
      logger.error('Error checking free month eligibility:', error);
      return { error: error.message };
    }
  }

  /**
   * Award a free month of Pro to a user
   */
  async awardFreeMonth(userId, triggerCount) {
    try {
      // Record the reward
      await this.supabase
        .from('referral_rewards')
        .insert({
          user_id: userId,
          reward_type: 'free_month',
          reward_value: this.FREE_MONTH_DAYS,
          trigger_referral_count: triggerCount,
          applied: false,
          created_at: new Date().toISOString()
        });

      // Get current user subscription status
      const { data: user } = await this.supabase
        .from('users')
        .select('tier, subscription_ends_at, bonus_days')
        .eq('id', userId)
        .single();

      // Calculate new subscription end date
      let newEndDate;
      const now = new Date();
      
      if (user?.subscription_ends_at && new Date(user.subscription_ends_at) > now) {
        // Extend existing subscription
        newEndDate = new Date(user.subscription_ends_at);
        newEndDate.setDate(newEndDate.getDate() + this.FREE_MONTH_DAYS);
      } else {
        // Start new subscription period from now
        newEndDate = new Date(now);
        newEndDate.setDate(newEndDate.getDate() + this.FREE_MONTH_DAYS);
      }

      // Update user to premium with extended date
      await this.supabase
        .from('users')
        .update({
          tier: 'premium',
          subscription_ends_at: newEndDate.toISOString(),
          bonus_days: (user?.bonus_days || 0) + this.FREE_MONTH_DAYS
        })
        .eq('id', userId);

      // Mark reward as applied
      await this.supabase
        .from('referral_rewards')
        .update({
          applied: true,
          applied_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('trigger_referral_count', triggerCount)
        .eq('reward_type', 'free_month');

      // Update profile with total free months earned
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('total_free_months_earned')
        .eq('user_id', userId)
        .single();

      await this.supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          total_free_months_earned: (profile?.total_free_months_earned || 0) + 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      logger.info(`🎉 Free month awarded to user ${userId}! (Trigger: ${triggerCount} paid referrals)`);

      return { success: true, newEndDate };

    } catch (error) {
      logger.error('Error awarding free month:', error);
      throw error;
    }
  }

  /**
   * Update referrer statistics (total referral count)
   */
  async updateReferrerStats(userId) {
    try {
      // Count total referrals
      const { count: totalCount } = await this.supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userId);

      // Count paid referrals
      const { count: paidCount } = await this.supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userId)
        .eq('converted_to_paid', true);

      // Update user's referral count in profile
      await this.supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          referral_count: totalCount || 0,
          paid_referral_count: paidCount || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      // Check milestones
      await this.checkMilestones(userId, totalCount);

    } catch (error) {
      logger.error('Error updating referrer stats:', error);
    }
  }

  /**
   * Check and award milestone badges
   */
  async checkMilestones(userId, totalReferrals) {
    try {
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('milestones_achieved')
        .eq('user_id', userId)
        .single();

      const achieved = profile?.milestones_achieved || [];

      for (const milestone of this.milestones) {
        if (totalReferrals >= milestone && !achieved.includes(milestone)) {
          achieved.push(milestone);
          
          // Record milestone reward
          await this.supabase
            .from('rewards')
            .insert({
              user_id: userId,
              reward_type: 'milestone',
              reward_data: { milestone, badge: `referral_${milestone}` },
              metadata: { total_referrals: totalReferrals },
              awarded_at: new Date().toISOString()
            });

          logger.info(`🏆 Milestone achieved: User ${userId} hit ${milestone} referrals`);
        }
      }

      // Update milestones in profile
      await this.supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          milestones_achieved: achieved,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    } catch (error) {
      logger.error('Error checking milestones:', error);
    }
  }

  /**
   * Get comprehensive referral stats for a user
   */
  async getStats(userId) {
    try {
      // Get or generate referral code
      let code;
      const { data: codeData } = await this.supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .single();

      if (codeData) {
        code = codeData.code;
      } else {
        code = await this.generateCode(userId);
      }

      // Get all referrals for this user
      const { data: referrals } = await this.supabase
        .from('referrals')
        .select(`
          id,
          status,
          converted_to_paid,
          paid_at,
          created_at,
          referred:referred_id (
            email,
            first_name,
            created_at
          )
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      // Get profile stats
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('referral_count, paid_referral_count, total_free_months_earned, milestones_achieved')
        .eq('user_id', userId)
        .single();

      // Get rewards history
      const { data: freeMonthRewards } = await this.supabase
        .from('referral_rewards')
        .select('*')
        .eq('user_id', userId)
        .eq('reward_type', 'free_month')
        .order('created_at', { ascending: false });

      // Calculate progress towards next free month
      const totalReferrals = referrals?.length || 0;
      const paidReferrals = referrals?.filter(r => r.converted_to_paid).length || 0;
      const freeMonthsEarned = Math.floor(paidReferrals / this.PAID_REFERRALS_FOR_FREE_MONTH);
      const progressToNextMonth = paidReferrals % this.PAID_REFERRALS_FOR_FREE_MONTH;
      const referralsNeededForNextMonth = this.PAID_REFERRALS_FOR_FREE_MONTH - progressToNextMonth;

      // Get next milestone
      const nextMilestone = this.milestones.find(m => m > totalReferrals);

      // Format referral list for display (hide email for privacy)
      const referralsList = (referrals || []).map(r => ({
        id: r.id,
        status: r.status,
        isPaid: r.converted_to_paid,
        paidAt: r.paid_at,
        joinedAt: r.created_at,
        referredUser: r.referred ? {
          firstName: r.referred.first_name || 'Anonymous',
          email: r.referred.email ? `${r.referred.email.substring(0, 3)}***` : null,
          joinedAt: r.referred.created_at
        } : null
      }));

      return {
        code,
        referralLink: `https://thehub.deals/signup?ref=${code}`,
        
        // Counts
        totalReferrals,
        paidReferrals,
        pendingReferrals: totalReferrals - paidReferrals,
        
        // Free month progress
        freeMonthsEarned,
        progressToNextMonth,
        referralsNeededForNextMonth,
        requiredPaidReferrals: this.PAID_REFERRALS_FOR_FREE_MONTH,
        
        // Milestones
        milestonesAchieved: profile?.milestones_achieved || [],
        nextMilestone,
        
        // History
        referrals: referralsList,
        rewardHistory: freeMonthRewards || [],
        
        // Totals
        totalFreeMonthsEarned: profile?.total_free_months_earned || 0,
        totalDaysEarned: (profile?.total_free_months_earned || 0) * this.FREE_MONTH_DAYS
      };

    } catch (error) {
      logger.error('Error getting referral stats:', error);
      return null;
    }
  }

  /**
   * Get referral leaderboard
   */
  async getLeaderboard(limit = 10) {
    try {
      const { data } = await this.supabase
        .from('user_profiles')
        .select(`
          user_id,
          referral_count,
          paid_referral_count,
          total_free_months_earned,
          user:user_id (
            first_name,
            last_name
          )
        `)
        .gt('referral_count', 0)
        .order('paid_referral_count', { ascending: false })
        .limit(limit);

      return (data || []).map((entry, index) => ({
        rank: index + 1,
        userId: entry.user_id,
        name: entry.user?.first_name || 'Anonymous',
        totalReferrals: entry.referral_count,
        paidReferrals: entry.paid_referral_count,
        freeMonthsEarned: entry.total_free_months_earned
      }));

    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Validate a referral code
   */
  async validateCode(code) {
    try {
      const { data } = await this.supabase
        .from('referral_codes')
        .select('code, is_active, user_id')
        .eq('code', code.toUpperCase())
        .single();

      if (data && data.is_active) {
        // Get referrer info (limited)
        const { data: user } = await this.supabase
          .from('users')
          .select('first_name')
          .eq('id', data.user_id)
          .single();

        return {
          valid: true,
          code: data.code,
          referrerName: user?.first_name || 'A Hub member'
        };
      }

      return { valid: false };

    } catch (error) {
      logger.error('Error validating referral code:', error);
      return { valid: false };
    }
  }
}

module.exports = ReferralService;
