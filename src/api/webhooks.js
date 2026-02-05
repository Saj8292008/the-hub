/**
 * Stripe Webhook Handler
 * Processes subscription lifecycle events from Stripe
 * 
 * Handles Pro and Premium tier subscriptions
 */

const express = require('express');
const router = express.Router();
const stripe = require('../lib/stripe');
const { pool } = require('../db/supabase');
const logger = require('../utils/logger');
const { getTierFromPriceId } = require('../services/tiers/tierConfig');

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 * IMPORTANT: This route must use express.raw() middleware to verify signature
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    logger.warn('Stripe webhook received but Stripe not configured');
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Handle checkout.session.completed event
 * Fired when a new subscription is purchased
 */
async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer;
  let tier = session.metadata?.tier;

  if (!userId) {
    logger.error('No userId in checkout session metadata');
    return;
  }

  // If tier not in metadata, try to get it from the subscription
  if (!tier && session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = subscription.items.data[0]?.price?.id;
      tier = getTierFromPriceId(priceId) || 'premium';
    } catch (e) {
      logger.warn(`Could not retrieve subscription to determine tier: ${e.message}`);
      tier = 'premium'; // Default fallback
    }
  }

  tier = tier || 'premium'; // Final fallback

  // Upgrade user to the appropriate tier
  await pool.query(
    `UPDATE users
     SET tier = $1,
         stripe_customer_id = $2,
         subscription_starts_at = NOW(),
         subscription_ends_at = NOW() + INTERVAL '30 days'
     WHERE id = $3`,
    [tier, customerId, userId]
  );

  logger.info(`✅ User ${userId} upgraded to ${tier} (checkout completed)`);
}

/**
 * Handle customer.subscription.created event
 * Fired when a subscription is created
 */
async function handleSubscriptionCreated(subscription) {
  const customerId = subscription.customer;

  // Get the user by customer ID
  const userResult = await pool.query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (userResult.rows.length === 0) {
    logger.error(`No user found for customer ${customerId}`);
    return;
  }

  const user = userResult.rows[0];
  const periodEnd = new Date(subscription.current_period_end * 1000);

  // Determine tier from subscription metadata or price ID
  let tier = subscription.metadata?.tier;
  if (!tier) {
    const priceId = subscription.items.data[0]?.price?.id;
    tier = getTierFromPriceId(priceId) || 'premium';
  }

  // Update subscription info
  await pool.query(
    `UPDATE users
     SET tier = $1,
         subscription_starts_at = NOW(),
         subscription_ends_at = $2
     WHERE id = $3`,
    [tier, periodEnd, user.id]
  );

  logger.info(`✅ Subscription created for user ${user.id} (tier: ${tier})`);
}

/**
 * Handle customer.subscription.updated event
 * Fired when subscription is modified (e.g., plan change, renewal)
 */
async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;

  // Get the user by customer ID
  const userResult = await pool.query(
    'SELECT id, tier FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (userResult.rows.length === 0) {
    logger.error(`No user found for customer ${customerId}`);
    return;
  }

  const user = userResult.rows[0];
  const periodEnd = new Date(subscription.current_period_end * 1000);

  // Determine tier from subscription metadata or price ID (handles plan changes)
  let newTier = subscription.metadata?.tier;
  if (!newTier) {
    const priceId = subscription.items.data[0]?.price?.id;
    newTier = getTierFromPriceId(priceId);
  }

  // Only update tier if we could determine it
  if (newTier && newTier !== user.tier) {
    await pool.query(
      'UPDATE users SET tier = $1, subscription_ends_at = $2 WHERE id = $3',
      [newTier, periodEnd, user.id]
    );
    logger.info(`✅ User ${user.id} tier changed: ${user.tier} → ${newTier} (ends: ${periodEnd.toISOString()})`);
  } else {
    await pool.query(
      'UPDATE users SET subscription_ends_at = $1 WHERE id = $2',
      [periodEnd, user.id]
    );
    logger.info(`✅ Subscription updated for user ${user.id} (ends: ${periodEnd.toISOString()})`);
  }
}

/**
 * Handle customer.subscription.deleted event
 * Fired when subscription is canceled and period has ended
 */
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  // Get the user by customer ID
  const userResult = await pool.query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (userResult.rows.length === 0) {
    logger.error(`No user found for customer ${customerId}`);
    return;
  }

  const user = userResult.rows[0];

  // Downgrade to free
  await pool.query(
    `UPDATE users
     SET tier = 'free',
         subscription_ends_at = NULL
     WHERE id = $1`,
    [user.id]
  );

  logger.info(`⬇️ User ${user.id} downgraded to free (subscription deleted)`);
}

/**
 * Handle invoice.payment_succeeded event
 * Fired when subscription payment succeeds (renewal)
 */
async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;

  // Get the user by customer ID
  const userResult = await pool.query(
    'SELECT id, tier FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (userResult.rows.length === 0) {
    logger.error(`No user found for customer ${customerId}`);
    return;
  }

  const user = userResult.rows[0];

  // Extend subscription based on invoice period
  const lineItem = invoice.lines.data[0];
  const periodEnd = new Date(lineItem.period.end * 1000);

  // Determine tier from invoice line item price
  const priceId = lineItem.price?.id;
  const tier = getTierFromPriceId(priceId) || user.tier || 'premium';

  await pool.query(
    `UPDATE users
     SET tier = $1,
         subscription_ends_at = $2
     WHERE id = $3`,
    [tier, periodEnd, user.id]
  );

  logger.info(`💰 Payment succeeded for user ${user.id} (tier: ${tier}, extended to ${periodEnd.toISOString()})`);
}

/**
 * Handle invoice.payment_failed event
 * Fired when subscription payment fails
 */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  // Get the user by customer ID
  const userResult = await pool.query(
    'SELECT id, email FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (userResult.rows.length === 0) {
    logger.error(`No user found for customer ${customerId}`);
    return;
  }

  const user = userResult.rows[0];

  logger.warn(`⚠️ Payment failed for user ${user.id} (${user.email})`);

  // TODO: Send email notification about failed payment
  // This could integrate with the email service to notify the user
}

module.exports = router;
