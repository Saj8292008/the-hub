#!/usr/bin/env node
/**
 * Score new/unscored listings — run via cron every hour
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const dealScorer = require('../src/services/deal-scorer');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function scoreNew() {
  // Get unscored listings (deal_score is null)
  const { data: listings, error } = await sb
    .from('watch_listings')
    .select('id, title, price, brand, model, condition, source, seller, url, created_at, timestamp, description')
    .is('deal_score', null)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) { console.error('❌', error.message); process.exit(1); }
  if (!listings || listings.length === 0) { console.log('✅ No unscored listings'); process.exit(0); }

  console.log(`📊 Scoring ${listings.length} new listings...`);
  let scored = 0;

  for (const listing of listings) {
    try {
      // Fix price from title if truncated
      let price = listing.price;
      const matches = (listing.title || '').match(/\$\s?([\d,]+(?:\.\d{2})?)/g);
      if (matches) {
        const prices = matches.map(m => parseFloat(m.replace(/[$,\s]/g, ''))).filter(p => p > 0);
        if (prices.length > 0 && prices[prices.length - 1] > price * 3) {
          price = prices[prices.length - 1];
        }
      }

      const result = await dealScorer.scoreDeal({ ...listing, price });
      
      await sb.from('watch_listings').update({
        price,
        deal_score: result.score,
        score_breakdown: result.breakdown
      }).eq('id', listing.id);

      scored++;
    } catch (e) { /* skip */ }
  }

  console.log(`✅ Scored ${scored}/${listings.length} listings`);
  process.exit(0);
}

scoreNew().catch(e => { console.error(e); process.exit(1); });
