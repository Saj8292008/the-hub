/**
 * Stripe API Routes
 * Handles subscription checkout, billing portal, and status
 * 
 * Supports multiple tiers: Pro ($9/mo), Premium ($19/mo)
 */

const express = require('express');
const router = express.Router();
const stripe = require('../lib/stripe');
const { pool } = require('../db/supabase');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { 
  TIERS, 
  getTierFromPriceId, 
  getStripePrices, 
  validatePriceId,
  getTierConfig 
} = require('../services/tiers/tierConfig');

// Check if Stripe is configured
const checkStripeConfigured = (req, res, next) => {
  if (!stripe) {
    return res.status(503).json({
      error: 'Payment system not configured',
      message: 'Stripe is not configured. Please contact support.'
    });
  }
  next();
};

/**
 * POST /api/stripe/create-checkout-session
 * Create a Stripe Checkout session for subscription
 * 
 * Supports: Pro and Premium tiers (monthly/yearly)
 */
router.post('/create-checkout-session', authenticateToken, checkStripeConfigured, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Validate price ID belongs to a valid tier
    const validation = validatePriceId(priceId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const targetTier = validation.tier;
    logger.info(`User ${req.userId} requesting checkout for tier: ${targetTier}`);

    // Get user
    const userResult = await pool.query(
      'SELECT id, email, stripe_customer_id, tier FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if user already has an active subscription
    if (user.stripe_customer_id && (user.tier === 'pro' || user.tier === 'premium')) {
      // User already subscribed - redirect to billing portal instead
      return res.status(400).json({
        error: 'Already subscribed',
        message: 'Use the billing portal to change your plan',
        usePortal: true
      });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id.toString()
        }
      });

      customerId = customer.id;

      // Save customer ID
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, user.id]
      );

      logger.info(`Created Stripe customer ${customerId} for user ${user.id}`);
    }

    // Create checkout session with tier metadata
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.FRONTEND_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}&tier=${targetTier}`,
      cancel_url: `${process.env.FRONTEND_URL}/premium?canceled=true`,
      metadata: {
        userId: user.id.toString(),
        tier: targetTier
      },
      subscription_data: {
        metadata: {
          userId: user.id.toString(),
          tier: targetTier
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto'
    });

    logger.info(`Created checkout session ${session.id} for user ${user.id} (tier: ${targetTier})`);

    return res.json({
      sessionId: session.id,
      url: session.url,
      tier: targetTier
    });

  } catch (error) {
    logger.error('Checkout session creation failed:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
});

/**
 * POST /api/stripe/create-portal-session
 * Create a Stripe billing portal session for subscription management
 */
router.post('/create-portal-session', authenticateToken, checkStripeConfigured, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.stripe_customer_id) {
      return res.status(400).json({
        error: 'No subscription found',
        message: 'You do not have an active subscription'
      });
    }

    // Create portal session (for managing subscription)
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/settings?tab=subscription`
    });

    logger.info(`Created portal session for user ${req.userId}`);

    return res.json({ url: session.url });

  } catch (error) {
    logger.error('Portal session creation failed:', error);
    return res.status(500).json({
      error: 'Failed to create portal session',
      message: error.message
    });
  }
});

/**
 * GET /api/stripe/subscription-status
 * Get current subscription status from Stripe
 */
router.get('/subscription-status', authenticateToken, checkStripeConfigured, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT tier, subscription_ends_at, stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.stripe_customer_id) {
      return res.json({
        tier: 'free',
        status: 'none',
        subscriptionEndsAt: null,
        cancelAtPeriodEnd: false
      });
    }

    // Get subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.json({
        tier: user.tier,
        status: 'none',
        subscriptionEndsAt: user.subscription_ends_at,
        cancelAtPeriodEnd: false
      });
    }

    const subscription = subscriptions.data[0];

    return res.json({
      tier: user.tier,
      status: subscription.status,
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId: subscription.items.data[0]?.price?.id,
      interval: subscription.items.data[0]?.price?.recurring?.interval
    });

  } catch (error) {
    logger.error('Failed to get subscription status:', error);
    return res.status(500).json({
      error: 'Failed to get subscription status',
      message: error.message
    });
  }
});

/**
 * GET /api/stripe/prices
 * Get available subscription prices for all tiers
 */
router.get('/prices', async (req, res) => {
  try {
    // Get prices from tier config (includes both Pro and Premium)
    const prices = getStripePrices();
    
    // Also return full tier information for the pricing page
    const tiers = Object.entries(TIERS)
      .filter(([key]) => key !== 'enterprise') // Enterprise is contact-sales only
      .map(([key, config]) => ({
        id: key,
        name: config.displayName,
        description: config.description,
        priceMonthly: config.priceMonthly,
        priceYearly: config.priceYearly,
        stripePriceIdMonthly: config.stripePriceIdMonthly || null,
        stripePriceIdYearly: config.stripePriceIdYearly || null,
        features: config.features,
        limits: {
          tracks: config.limits.tracks === Infinity ? 'Unlimited' : config.limits.tracks,
          alertsPerDay: config.limits.alertsPerDay === Infinity ? 'Unlimited' : config.limits.alertsPerDay,
          priceHistory: config.limits.priceHistory,
          realTimeAlerts: config.limits.realTimeAlerts,
          prioritySupport: config.limits.prioritySupport,
          aiFeatures: config.limits.aiFeatures,
          exportData: config.limits.exportData,
          earlyAccess: config.limits.earlyAccess
        },
        badge: config.badge || null
      }));

    return res.json({ 
      prices,
      tiers,
      stripeConfigured: !!stripe
    });

  } catch (error) {
    logger.error('Failed to get prices:', error);
    return res.status(500).json({
      error: 'Failed to get prices',
      message: error.message
    });
  }
});

/**
 * POST /api/stripe/change-plan
 * Change subscription plan (upgrade/downgrade)
 * Uses Stripe billing portal for simplicity
 */
router.post('/change-plan', authenticateToken, checkStripeConfigured, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT stripe_customer_id, tier FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.stripe_customer_id) {
      return res.status(400).json({
        error: 'No subscription found',
        message: 'You do not have an active subscription to change'
      });
    }

    // Create billing portal session for plan management
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/settings?tab=subscription`,
      flow_data: {
        type: 'subscription_update',
        after_completion: {
          type: 'redirect',
          redirect: {
            return_url: `${process.env.FRONTEND_URL}/settings?tab=subscription&changed=true`
          }
        }
      }
    });

    logger.info(`Created plan change portal session for user ${req.userId}`);

    return res.json({ url: session.url });

  } catch (error) {
    logger.error('Plan change portal creation failed:', error);
    return res.status(500).json({
      error: 'Failed to create plan change session',
      message: error.message
    });
  }
});

module.exports = router;
