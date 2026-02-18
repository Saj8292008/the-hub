/**
 * Public Checkout API for Deal Hunter's Toolkit
 * 
 * Creates Stripe Checkout sessions for toolkit purchases (no auth required)
 * Webhook handles subscription creation and triggers welcome funnel
 * 
 * Endpoints:
 *   POST /api/checkout/create-session — Create Stripe Checkout session (public)
 *   POST /api/checkout/webhook        — Stripe webhook for toolkit subscriptions
 */

const express = require('express');
const router = express.Router();
const stripe = require('../lib/stripe');
const supabase = require('../db/supabase');
const { pool } = require('../db/supabase');
const logger = require('../utils/logger');

// Import the sales funnel automation
const salesFunnel = require('../../scripts/sales-funnel');

// Price IDs from .env
const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || 'price_1Sy1BjCaz620S5FSO8c5KhF9',
  yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY || 'price_1Sy1BjCaz620S5FSDGlVkwJ4',
};

// ---------------------------------------------------------------------------
// POST /api/checkout/create-session
// Public endpoint — creates Stripe Checkout for toolkit purchase
// ---------------------------------------------------------------------------
router.post('/create-session', async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl, email } = req.body;

    // Validate required fields
    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }

    // Validate price ID is one of our toolkit prices
    const validPriceIds = Object.values(PRICE_IDS);
    if (!validPriceIds.includes(priceId)) {
      return res.status(400).json({ 
        error: 'Invalid priceId',
        message: 'Price ID must be a valid toolkit price'
      });
    }

    const plan = priceId === PRICE_IDS.yearly ? 'yearly' : 'monthly';
    logger.info(`[checkout] Creating session for ${plan} plan (${priceId})`);

    // Build checkout session
    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ 
        price: priceId, 
        quantity: 1 
      }],
      success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:4003'}/toolkit.html?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:4003'}/toolkit.html?canceled=true`,
      metadata: { 
        source: 'toolkit',
        plan 
      },
      subscription_data: {
        metadata: { 
          source: 'toolkit',
          plan 
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_email: email || undefined, // Pre-fill email if provided
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logger.info(`[checkout] Session ${session.id} created for ${plan} plan`);

    return res.json({ 
      sessionId: session.id, 
      url: session.url,
      success: true 
    });

  } catch (error) {
    logger.error('[checkout] create-session error:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session', 
      message: error.message 
    });
  }
});

// ---------------------------------------------------------------------------
// POST /api/checkout/webhook
// Handles Stripe webhooks for toolkit purchases
// IMPORTANT: Must be registered with express.raw() — see below
// ---------------------------------------------------------------------------
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('[checkout] Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`[checkout] Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      // ----- Checkout completed (new subscription) -----
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Only handle toolkit checkouts
        if (session.metadata?.source !== 'toolkit') {
          logger.info(`[checkout] Skipping non-toolkit checkout: ${session.id}`);
          break;
        }

        // Get subscription details
        const subscriptionId = session.subscription;
        if (!subscriptionId) {
          logger.error('[checkout] No subscription ID in completed checkout');
          break;
        }

        // Retrieve full subscription object
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = session.customer;
        const customerEmail = session.customer_details?.email || subscription.customer_email;
        const customerName = session.customer_details?.name || '';
        const plan = session.metadata?.plan || 'monthly';

        logger.info(`[checkout] Processing toolkit purchase: ${customerEmail} (${plan})`);

        // Create subscription record in Supabase
        try {
          const { data, error } = await supabase.client
            .from('subscriptions')
            .insert({
              email: customerEmail,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan: plan,
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              metadata: { source: 'toolkit', name: customerName }
            })
            .select()
            .single();

          if (error) {
            logger.error('[checkout] Failed to create subscription record:', error);
          } else {
            logger.info(`[checkout] ✅ Subscription record created for ${customerEmail}`);
          }
        } catch (dbError) {
          logger.error('[checkout] Database error:', dbError);
        }

        // Trigger welcome email funnel
        try {
          await salesFunnel.handleNewSubscription({
            ...subscription,
            customer_email: customerEmail,
            customer_name: customerName,
            metadata: { 
              ...subscription.metadata,
              email: customerEmail,
              name: customerName,
              plan 
            }
          });
          logger.info(`[checkout] ✅ Welcome funnel triggered for ${customerEmail}`);
        } catch (funnelError) {
          logger.error('[checkout] Sales funnel error:', funnelError);
        }

        break;
      }

      // ----- Subscription updated -----
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Only handle toolkit subscriptions
        if (subscription.metadata?.source !== 'toolkit') {
          break;
        }

        const customerId = subscription.customer;
        const subscriptionId = subscription.id;
        const plan = subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';

        try {
          // Update subscription record
          const { error } = await supabase.client
            .from('subscriptions')
            .update({
              plan: plan,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              updated_at: new Date()
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            logger.error('[checkout] Failed to update subscription:', error);
          } else {
            logger.info(`[checkout] ✅ Subscription updated: ${subscriptionId}`);
          }
        } catch (dbError) {
          logger.error('[checkout] Database error:', dbError);
        }

        break;
      }

      // ----- Subscription deleted (canceled) -----
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Only handle toolkit subscriptions
        if (subscription.metadata?.source !== 'toolkit') {
          break;
        }

        const subscriptionId = subscription.id;

        try {
          // Mark subscription as inactive
          const { error } = await supabase.client
            .from('subscriptions')
            .update({
              status: 'canceled',
              cancel_at_period_end: false,
              updated_at: new Date()
            })
            .eq('stripe_subscription_id', subscriptionId);

          if (error) {
            logger.error('[checkout] Failed to mark subscription canceled:', error);
          } else {
            logger.info(`[checkout] ✅ Subscription canceled: ${subscriptionId}`);
          }

          // Trigger cancellation handler in sales funnel
          await salesFunnel.handleCancellation(subscription);
        } catch (error) {
          logger.error('[checkout] Error handling cancellation:', error);
        }

        break;
      }

      default:
        logger.info(`[checkout] Unhandled event: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('[checkout] Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

module.exports = router;
