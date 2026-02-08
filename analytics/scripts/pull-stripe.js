#!/usr/bin/env node

/**
 * Pull revenue metrics from Stripe
 * 
 * Collects MRR, subscribers, churn, and transaction data.
 * 
 * Usage:
 *   node pull-stripe.js              # Full report
 *   node pull-stripe.js --quick      # Quick MRR summary
 *   node pull-stripe.js --json       # JSON output
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error('❌ Missing STRIPE_SECRET_KEY');
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
const isJson = args.includes('--json');

async function getMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    revenue: {},
    subscriptions: {},
    customers: {},
    recent: {}
  };

  // =========================================================================
  // SUBSCRIPTION METRICS
  // =========================================================================

  try {
    // Active subscriptions
    const activeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100
    });
    metrics.subscriptions.active = activeSubscriptions.data.length;

    // Calculate MRR from active subscriptions
    let mrr = 0;
    const planBreakdown = {};
    
    for (const sub of activeSubscriptions.data) {
      for (const item of sub.items.data) {
        const amount = item.price.unit_amount || 0;
        const interval = item.price.recurring?.interval || 'month';
        const intervalCount = item.price.recurring?.interval_count || 1;
        
        // Normalize to monthly
        let monthlyAmount = amount / 100;
        if (interval === 'year') {
          monthlyAmount = monthlyAmount / 12;
        } else if (interval === 'week') {
          monthlyAmount = monthlyAmount * 4.33;
        }
        
        mrr += monthlyAmount;
        
        // Track by plan
        const planName = item.price.nickname || item.price.id;
        planBreakdown[planName] = (planBreakdown[planName] || 0) + 1;
      }
    }
    
    metrics.revenue.mrr = Math.round(mrr * 100) / 100;
    metrics.revenue.arr = Math.round(mrr * 12 * 100) / 100;
    metrics.subscriptions.byPlan = planBreakdown;

    // Trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      status: 'trialing',
      limit: 100
    });
    metrics.subscriptions.trialing = trialingSubscriptions.data.length;

    // Past due subscriptions
    const pastDueSubscriptions = await stripe.subscriptions.list({
      status: 'past_due',
      limit: 100
    });
    metrics.subscriptions.pastDue = pastDueSubscriptions.data.length;

    // Canceled this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const canceledSubscriptions = await stripe.subscriptions.list({
      status: 'canceled',
      created: { gte: Math.floor(monthStart.getTime() / 1000) },
      limit: 100
    });
    metrics.subscriptions.canceledThisMonth = canceledSubscriptions.data.length;

  } catch (e) {
    console.error('Subscription metrics error:', e.message);
    metrics.subscriptions.error = e.message;
  }

  // =========================================================================
  // CUSTOMER METRICS
  // =========================================================================

  try {
    // Total customers
    const customers = await stripe.customers.list({ limit: 100 });
    metrics.customers.total = customers.data.length;
    
    // Count customers with active subscriptions
    let customersWithSubscriptions = 0;
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1
      });
      if (subs.data.length > 0) {
        customersWithSubscriptions++;
      }
    }
    metrics.customers.withActiveSubscription = customersWithSubscriptions;

    // New customers this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const newCustomers = await stripe.customers.list({
      created: { gte: Math.floor(monthStart.getTime() / 1000) },
      limit: 100
    });
    metrics.customers.newThisMonth = newCustomers.data.length;

    // New customers this week
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newCustomersWeek = await stripe.customers.list({
      created: { gte: Math.floor(weekStart.getTime() / 1000) },
      limit: 100
    });
    metrics.customers.newThisWeek = newCustomersWeek.data.length;

  } catch (e) {
    console.error('Customer metrics error:', e.message);
    metrics.customers.error = e.message;
  }

  // =========================================================================
  // REVENUE METRICS
  // =========================================================================

  try {
    // Total revenue this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const charges = await stripe.charges.list({
      created: { gte: Math.floor(monthStart.getTime() / 1000) },
      limit: 100
    });

    let monthlyRevenue = 0;
    let successfulCharges = 0;
    let failedCharges = 0;

    for (const charge of charges.data) {
      if (charge.status === 'succeeded') {
        monthlyRevenue += charge.amount / 100;
        successfulCharges++;
      } else if (charge.status === 'failed') {
        failedCharges++;
      }
    }

    metrics.revenue.thisMonth = Math.round(monthlyRevenue * 100) / 100;
    metrics.revenue.successfulCharges = successfulCharges;
    metrics.revenue.failedCharges = failedCharges;

    // Average revenue per transaction
    if (successfulCharges > 0) {
      metrics.revenue.avgTransaction = Math.round((monthlyRevenue / successfulCharges) * 100) / 100;
    }

  } catch (e) {
    console.error('Revenue metrics error:', e.message);
    metrics.revenue.error = e.message;
  }

  // =========================================================================
  // RECENT ACTIVITY
  // =========================================================================

  try {
    // Recent successful payments
    const recentPayments = await stripe.paymentIntents.list({
      limit: 5
    });

    metrics.recent.payments = recentPayments.data.map(p => ({
      id: p.id,
      amount: p.amount / 100,
      status: p.status,
      created: new Date(p.created * 1000).toISOString()
    }));

    // Recent subscription events
    const events = await stripe.events.list({
      limit: 10,
      types: [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.paid',
        'invoice.payment_failed'
      ]
    });

    metrics.recent.events = events.data.map(e => ({
      type: e.type,
      created: new Date(e.created * 1000).toISOString()
    }));

  } catch (e) {
    console.error('Recent activity error:', e.message);
    metrics.recent.error = e.message;
  }

  // =========================================================================
  // CALCULATED METRICS
  // =========================================================================

  // Churn rate (simplified: canceled / (active + canceled))
  const totalSubs = (metrics.subscriptions.active || 0) + (metrics.subscriptions.canceledThisMonth || 0);
  if (totalSubs > 0) {
    metrics.subscriptions.churnRate = Math.round(((metrics.subscriptions.canceledThisMonth || 0) / totalSubs) * 100 * 10) / 10;
  }

  // ARPU (Average Revenue Per User)
  if (metrics.customers.withActiveSubscription > 0 && metrics.revenue.mrr > 0) {
    metrics.revenue.arpu = Math.round((metrics.revenue.mrr / metrics.customers.withActiveSubscription) * 100) / 100;
  }

  return metrics;
}

function printMetrics(metrics) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              THE HUB - STRIPE METRICS                        ║');
  console.log(`║              ${new Date().toLocaleString().padEnd(32)}       ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  console.log('║  💰 REVENUE                                                  ║');
  console.log(`║  • MRR:                       $${String(metrics.revenue.mrr || 0).padStart(7)}                    ║`);
  console.log(`║  • ARR:                       $${String(metrics.revenue.arr || 0).padStart(7)}                    ║`);
  console.log(`║  • Revenue this month:        $${String(metrics.revenue.thisMonth || 0).padStart(7)}                    ║`);
  console.log(`║  • ARPU:                      $${String(metrics.revenue.arpu || 'N/A').padStart(7)}                    ║`);
  console.log(`║  • Avg transaction:           $${String(metrics.revenue.avgTransaction || 'N/A').padStart(7)}                    ║`);
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  📊 SUBSCRIPTIONS                                            ║');
  console.log(`║  • Active:                    ${String(metrics.subscriptions.active || 0).padStart(8)}                    ║`);
  console.log(`║  • Trialing:                  ${String(metrics.subscriptions.trialing || 0).padStart(8)}                    ║`);
  console.log(`║  • Past due:                  ${String(metrics.subscriptions.pastDue || 0).padStart(8)}                    ║`);
  console.log(`║  • Canceled this month:       ${String(metrics.subscriptions.canceledThisMonth || 0).padStart(8)}                    ║`);
  console.log(`║  • Churn rate:                ${String((metrics.subscriptions.churnRate || 0) + '%').padStart(8)}                    ║`);
  
  if (metrics.subscriptions.byPlan && Object.keys(metrics.subscriptions.byPlan).length > 0) {
    console.log('║  • By plan:                                                  ║');
    for (const [plan, count] of Object.entries(metrics.subscriptions.byPlan)) {
      const planName = plan.substring(0, 20);
      console.log(`║      ${planName.padEnd(20)} ${String(count).padStart(8)}                    ║`);
    }
  }
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  👥 CUSTOMERS                                                ║');
  console.log(`║  • Total customers:           ${String(metrics.customers.total || 0).padStart(8)}                    ║`);
  console.log(`║  • With active subscription:  ${String(metrics.customers.withActiveSubscription || 0).padStart(8)}                    ║`);
  console.log(`║  • New this month:            ${String(metrics.customers.newThisMonth || 0).padStart(8)}                    ║`);
  console.log(`║  • New this week:             ${String(metrics.customers.newThisWeek || 0).padStart(8)}                    ║`);
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  📈 RECENT EVENTS                                            ║');
  
  if (metrics.recent.events && metrics.recent.events.length > 0) {
    for (const event of metrics.recent.events.slice(0, 5)) {
      const eventType = event.type.replace('customer.subscription.', '').replace('invoice.', '');
      const date = new Date(event.created).toLocaleString();
      console.log(`║  • ${eventType.substring(0, 15).padEnd(15)} ${date.padEnd(20)}         ║`);
    }
  } else {
    console.log('║  • No recent events                                          ║');
  }
  
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

function printQuickSummary(metrics) {
  console.log('\n💰 Quick Stripe Summary:');
  console.log(`   MRR: $${metrics.revenue.mrr || 0} | Subscribers: ${metrics.subscriptions.active || 0}`);
  console.log(`   This month: $${metrics.revenue.thisMonth || 0} | New customers: ${metrics.customers.newThisMonth || 0}\n`);
}

async function main() {
  try {
    const metrics = await getMetrics();
    
    if (isJson) {
      console.log(JSON.stringify(metrics, null, 2));
    } else if (isQuick) {
      printQuickSummary(metrics);
    } else {
      printMetrics(metrics);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching Stripe metrics:', error.message);
    process.exit(1);
  }
}

main();
