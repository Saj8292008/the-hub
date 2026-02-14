#!/usr/bin/env node

/**
 * Stripe Setup Script
 * Creates the Pro product and price objects in Stripe.
 * Run once after configuring STRIPE_SECRET_KEY in .env.
 *
 * Usage:
 *   node scripts/stripe-setup.js
 *
 * What it creates:
 *   - Product: "The Hub Pro"
 *   - Price: $9/month  (recurring)
 *   - Price: $99/year  (recurring)
 *
 * After running, copy the printed price IDs into .env:
 *   STRIPE_PRICE_ID_PRO_MONTHLY=price_xxx
 *   STRIPE_PRICE_ID_PRO_YEARLY=price_xxx
 */

require('dotenv').config();

const Stripe = require('stripe');

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not set in .env');
    process.exit(1);
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });

  console.log('🔧 Setting up Stripe products and prices...\n');

  // ---------------------------------------------------------------
  // 1. Create (or find) the "The Hub Pro" product
  // ---------------------------------------------------------------
  let product;

  // Check if product already exists
  const existingProducts = await stripe.products.list({ limit: 100 });
  product = existingProducts.data.find(p => p.name === 'The Hub Pro');

  if (product) {
    console.log(`✅ Product already exists: ${product.id} ("${product.name}")`);
  } else {
    product = await stripe.products.create({
      name: 'The Hub Pro',
      description: 'Real-time Telegram alerts, price history, advanced deal scores, early access to deals',
      metadata: {
        tier: 'pro',
        app: 'the-hub'
      }
    });
    console.log(`✅ Created product: ${product.id} ("${product.name}")`);
  }

  // ---------------------------------------------------------------
  // 2. Create monthly price ($9/month)
  // ---------------------------------------------------------------
  let monthlyPrice;

  // Check existing prices
  const existingPrices = await stripe.prices.list({
    product: product.id,
    limit: 100
  });

  monthlyPrice = existingPrices.data.find(
    p => p.recurring?.interval === 'month' && p.unit_amount === 900 && p.active
  );

  if (monthlyPrice) {
    console.log(`✅ Monthly price already exists: ${monthlyPrice.id} ($${monthlyPrice.unit_amount / 100}/month)`);
  } else {
    monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 900, // $9.00 in cents
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'pro', period: 'monthly' }
    });
    console.log(`✅ Created monthly price: ${monthlyPrice.id} ($9/month)`);
  }

  // ---------------------------------------------------------------
  // 3. Create yearly price ($99/year)
  // ---------------------------------------------------------------
  let yearlyPrice;

  yearlyPrice = existingPrices.data.find(
    p => p.recurring?.interval === 'year' && p.unit_amount === 9900 && p.active
  );

  if (yearlyPrice) {
    console.log(`✅ Yearly price already exists: ${yearlyPrice.id} ($${yearlyPrice.unit_amount / 100}/year)`);
  } else {
    yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 9900, // $99.00 in cents
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { tier: 'pro', period: 'yearly' }
    });
    console.log(`✅ Created yearly price: ${yearlyPrice.id} ($99/year)`);
  }

  // ---------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------
  console.log('\n📋 Add these to your .env file:\n');
  console.log(`STRIPE_PRICE_ID_PRO_MONTHLY=${monthlyPrice.id}`);
  console.log(`STRIPE_PRICE_ID_PRO_YEARLY=${yearlyPrice.id}`);
  console.log('\n💰 Pricing summary:');
  console.log(`   Monthly: $9/month  (${monthlyPrice.id})`);
  console.log(`   Yearly:  $99/year  = $8.25/month — save ~8%  (${yearlyPrice.id})`);
  console.log('\n✅ Stripe setup complete!');
}

main().catch(err => {
  console.error('❌ Stripe setup failed:', err.message);
  process.exit(1);
});
