#!/usr/bin/env node

/**
 * Content Multiplier Batch - Pulls top deals from Supabase and multiplies content
 * Usage: node content-multiplier-batch.js [--dry-run] [--limit 5]
 */

require('dotenv').config({ path: '/Users/sydneyjackson/the-hub/.env' });
const { createClient } = require('@supabase/supabase-js');
const { multiplyContent } = require('./content-multiplier');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Parse CLI arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = parseInt(args.find(arg => arg.startsWith('--limit'))?.split('=')[1] || '5');

// Main function
async function batchMultiplyContent() {
  console.log(`🚀 Content Multiplier Batch`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${LIMIT} deals\n`);
  
  try {
    // Pull top deals from Supabase
    console.log('📥 Fetching top deals from Supabase...');
    
    const { data: deals, error } = await supabase
      .from('deals')
      .select('*')
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(LIMIT);
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    if (!deals || deals.length === 0) {
      console.log('❌ No deals found in database');
      return;
    }
    
    console.log(`✓ Found ${deals.length} deals\n`);
    
    // Process each deal
    const results = [];
    let totalPosts = 0;
    
    for (const deal of deals) {
      console.log(`📝 Processing: ${deal.title}`);
      console.log(`   Category: ${deal.category || 'unknown'}`);
      console.log(`   Price: $${deal.price} (was $${deal.original_price || deal.price})`);
      console.log(`   Score: ${deal.score || 0}/20`);
      
      // Format deal object for multiplier
      const dealInput = {
        title: deal.title,
        price: deal.price,
        original_price: deal.original_price || deal.price * 1.3, // Estimate if missing
        category: deal.category || 'watches',
        source: deal.source || 'unknown',
        score: deal.score || 10,
        url: deal.url || deal.link || ''
      };
      
      // Generate variations
      const variations = multiplyContent(dealInput);
      totalPosts += variations.length;
      
      results.push({
        deal: {
          id: deal.id,
          title: deal.title,
          price: deal.price,
          category: deal.category,
          score: deal.score
        },
        variations: variations,
        generated_at: new Date().toISOString()
      });
      
      console.log(`   ✓ Generated ${variations.length} post variations`);
      
      // Show breakdown
      const formatCounts = variations.reduce((acc, v) => {
        acc[v.format] = (acc[v.format] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`   Breakdown: ${Object.entries(formatCounts).map(([k, v]) => `${k}(${v})`).join(', ')}`);
      console.log('');
    }
    
    // Save output
    if (!DRY_RUN) {
      const outputDir = '/Users/sydneyjackson/the-hub/content/social';
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`✓ Created directory: ${outputDir}`);
      }
      
      const date = new Date().toISOString().split('T')[0];
      const outputPath = path.join(outputDir, `multiplied-${date}.json`);
      
      const output = {
        generated_at: new Date().toISOString(),
        summary: {
          deals_processed: deals.length,
          total_posts: totalPosts,
          posts_per_deal: Math.round(totalPosts / deals.length)
        },
        results: results
      };
      
      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
      console.log(`💾 Saved output to: ${outputPath}`);
    } else {
      console.log('💡 DRY RUN - No files saved');
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Deals processed: ${deals.length}`);
    console.log(`Total posts generated: ${totalPosts}`);
    console.log(`Average posts per deal: ${Math.round(totalPosts / deals.length)}`);
    console.log('='.repeat(60));
    
    // Return results for testing
    return results;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  batchMultiplyContent().then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for testing
module.exports = { batchMultiplyContent };
