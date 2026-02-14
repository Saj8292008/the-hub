/**
 * Subscriptions API Routes
 * Handles Pro tier subscription lifecycle via Stripe
 * 
 * Endpoints:
 *   POST /api/subscriptions/create-checkout — Create Stripe Checkout session
 *   POST /api/subscriptions/webhook        — Stripe webhook handler
 *   GET  /api/subscriptions/status/:userId — Check subscription status
 *   POST /api/subscriptions/portal         — Create Stripe Customer Portal session
 */

const express = require('express');
const router = express.Router();
const stripe = require('../lib/stripe');
const supabase = require('../db/supabase');
const { pool } = require('../db/supabase');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { TIERS, getTierFromPriceId, validatePriceId } = require('../services/tiers/tierConfig');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function checkStripeConfigured(req, res, next) {
  if (!stripe) {
    return res.status(503).json({
      error: 'Payment system not configured',
      message: 'Stripe is not configured. Set STRIPE_SECRET_KEY in .env'
    });
  }
  next();
}

/**
 * Upsert a row in the subscriptions table.
 * Works with both the Supabase JS client and raw pool queries.
 */
async function upsertSubscription({
  userId,
  email,
  stripeCustomerId,
  stripeSubscriptionId,
  plan,
  status,
  currentPeriodStart,
  currentPeriodEnd,
  cancelAtPeriodEnd
}) {
  try {
    // Try Supabase client first
    if (supabase.isAvailable()) {
      const { data, error } = await supabase.client
        .from('subscriptions')
        .upsert({
          user_id: userId || null,
          email: email,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          plan: plan || 'monthly',
          status: status || 'active',
          current_period_start: currentPeriodStart ? new Date(currentPeriodStart * 1000) : null,
          current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
          cancel_at_period_end: cancelAtPeriodEnd || false,
          updated_at: new Date()
        }, { onConflict: 'stripe_subscription_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Fallback: raw pool query
    const result = await pool.query(
      `INSERT INTO subscriptions 
        (user_id, email, stripe_customer_id, stripe_subscription_id, plan, status,
         current_period_start, current_period_end, cancel_at_period_end, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (stripe_subscription_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         plan = EXCLUDED.plan,
         current_period_start = EXCLUDED.current_period_start,
         current_period_end = EXCLUDED.current_period_end,
         cancel_at_period_end = EXCLUDED.cancel_at_period_end,
         updated_at = NOW()
       RETURNING *`,
      [
        userId || null,
        email,
        stripeCustomerId,
        stripeSubscriptionId,
        plan || 'monthly',
        status || 'active',
        currentPeriodStart ? new Date(currentPeriodStart * 1000) : null,
        currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
        cancelAtPeriodEnd || false
      ]
    );
    return result.rows[0];
  } catch (err) {
    logger.error('upsertSubscription failed:', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// POST /api/subscriptions/create-checkout
// Creates a Stripe Checkout session, returns { sessionId, url }
// ---------------------------------------------------------------------------
router.post('/create-checkout', authenticateToken, checkStripeConfigured, async (req, res) => {
  try {
    const { priceId, billingPeriod } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }

    // Validate price ID
    const validation = validatePriceId(priceId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const targetTier = validation.tier;
    logger.info(`[subscriptions] User ${req.userId} requesting checkout for ${targetTier} (${billingPeriod || 'unknown'})`);

    // Lookup user
    const userResult = await pool.query(
      'SELECT id, email, stripe_customer_id, tier FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // If already subscribed, nudge them to the billing portal
    if (user.tier === 'pro' && user.stripe_customer_id) {
      return res.status(400).json({
        error: 'Already subscribed',
        message: 'Use the billing portal to manage your subscription.',
        usePortal: true
      });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id.toString() }
      });
      customerId = customer.id;

      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, user.id]
      );
      logger.info(`[subscriptions] Created Stripe customer ${customerId} for user ${user.id}`);
    }

    // Build checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing?canceled=true`,
      metadata: { userId: user.id.toString(), tier: targetTier },
      subscription_data: {
        metadata: { userId: user.id.toString(), tier: targetTier }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto'
    });

    logger.info(`[subscriptions] Checkout session ${session.id} created for user ${user.id}`);

    return res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    logger.error('[subscriptions] create-checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session', message: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/subscriptions/webhook
// Handles Stripe webhook events
// IMPORTANT: Must be registered with express.raw() — see server.js
// ---------------------------------------------------------------------------
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('[subscriptions] Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // ----- Checkout completed (new subscription) -----
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const customerId = session.customer;

        if (!userId) { logger.error('[subscriptions] No userId in checkout metadata'); break; }

        // Retrieve the subscription to get period info
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        const interval = sub.items.data[0]?.price?.recurring?.interval; // 'month' | 'year'
        const plan = interval === 'year' ? 'yearly' : 'monthly';

        // Upgrade user
        await pool.query(
          `UPDATE users SET tier = 'pro', stripe_customer_id = $1,
           subscription_starts_at = NOW(),
           subscription_ends_at = to_timestamp($2)
           WHERE id = $3`,
          [customerId, sub.current_period_end, userId]
        );

        // Get user email for the subscriptions table
        const userRow = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        const email = userRow.rows[0]?.email || '';

        // Upsert subscriptions row
        await upsertSubscription({
          userId,
          email,
          stripeCustomerId: customerId,
          stripeSubscriptionId: session.subscription,
          plan,
          status: 'active',
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end
        });

        logger.info(`[subscriptions] ✅ User ${userId} upgraded to Pro (${plan})`);
        break;
      }

      // ----- Subscription updated (renewal, plan change) -----
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = sub.customer;

        const userResult = await pool.query(
          'SELECT id, email FROM users WHERE stripe_customer_id = $1',
          [customerId]
        );
        if (userResult.rows.length === 0) { logger.error(`[subscriptions] No user for customer ${customerId}`); break; }

        const user = userResult.rows[0];
        const interval = sub.items.data[0]?.price?.recurring?.interval;
        const plan = interval === 'year' ? 'yearly' : 'monthly';

        // Map Stripe status
        let status = sub.status; // active, past_due, canceled, incomplete, trialing
        if (!['active', 'canceled', 'past_due', 'incomplete', 'trialing'].includes(status)) {
          status = 'active';
        }

        // Update users table
        await pool.query(
          'UPDATE users SET subscription_ends_at = to_timestamp($1), tier = $2 WHERE id = $3',
          [sub.current_period_end, status === 'active' ? 'pro' : 'free', user.id]
        );

        // Upsert subscription row
        await upsertSubscription({
          userId: user.id,
          email: user.email,
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          plan,
          status,
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end
        });

        logger.info(`[subscriptions] ✅ Subscription updated for user ${user.id} — ${status} (${plan})`);
        break;
      }

      // ----- Subscription deleted (canceled + period ended) -----
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;

        const userResult = await pool.query(
          'SELECT id, email FROM users WHERE stripe_customer_id = $1',
          [customerId]
        );
        if (userResult.rows.length === 0) break;

        const user = userResult.rows[0];

        // Downgrade to free
        await pool.query(
          `UPDATE users SET tier = 'free', subscription_ends_at = NULL WHERE id = $1`,
          [user.id]
        );

        // Update subscription row
        await upsertSubscription({
          userId: user.id,
          email: user.email,
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          plan: 'monthly',
          status: 'canceled',
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: false
        });

        logger.info(`[subscriptions] ⬇️ User ${user.id} downgraded to free`);
        break;
      }

      // ----- Payment failed -----
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const userResult = await pool.query(
          'SELECT id, email FROM users WHERE stripe_customer_id = $1',
          [customerId]
        );
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];

          // Mark subscription as past_due
          if (invoice.subscription) {
            await upsertSubscription({
              userId: user.id,
              email: user.email,
              stripeCustomerId: customerId,
              stripeSubscriptionId: invoice.subscription,
              status: 'past_due'
            });
          }

          logger.warn(`[subscriptions] ⚠️ Payment failed for user ${user.id} (${user.email})`);
        }
        break;
      }

      default:
        logger.info(`[subscriptions] Unhandled event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('[subscriptions] Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/subscriptions/status/:userId
// Check if a user has an active subscription
// ---------------------------------------------------------------------------
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check subscriptions table first
    let subscription = null;
    if (supabase.isAvailable()) {
      const { data } = await supabase.client
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      subscription = data;
    } else {
      const result = await pool.query(
        'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      subscription = result.rows[0] || null;
    }

    // Fall back to users table if no subscriptions row
    if (!subscription) {
      const userResult = await pool.query(
        'SELECT tier, stripe_customer_id, subscription_ends_at FROM users WHERE id = $1',
        [userId]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const user = userResult.rows[0];
      return res.json({
        active: user.tier === 'pro',
        tier: user.tier || 'free',
        plan: null,
        status: user.tier === 'pro' ? 'active' : 'none',
        currentPeriodEnd: user.subscription_ends_at || null,
        cancelAtPeriodEnd: false
      });
    }

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    return res.json({
      active: isActive,
      tier: isActive ? 'pro' : 'free',
      plan: subscription.plan,
      status: subscription.status,
      stripeSubscriptionId: subscription.stripe_subscription_id,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      createdAt: subscription.created_at
    });
  } catch (error) {
    logger.error('[subscriptions] status error:', error);
    return res.status(500).json({ error: 'Failed to get subscription status', message: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/subscriptions/portal
// Creates a Stripe Customer Portal session for managing subscription
// ---------------------------------------------------------------------------
router.post('/portal', authenticateToken, checkStripeConfigured, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { stripe_customer_id } = userResult.rows[0];

    if (!stripe_customer_id) {
      return res.status(400).json({
        error: 'No subscription found',
        message: 'You do not have an active subscription.'
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?tab=subscription`
    });

    logger.info(`[subscriptions] Portal session created for user ${req.userId}`);

    return res.json({ url: session.url });
  } catch (error) {
    logger.error('[subscriptions] portal error:', error);
    return res.status(500).json({ error: 'Failed to create portal session', message: error.message });
  }
});

module.exports = router;
