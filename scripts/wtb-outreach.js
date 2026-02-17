#!/usr/bin/env node
/**
 * WTB Auto-Outreach CLI
 * Scan Reddit WTB threads and post personalized comments for matching inventory
 * 
 * Usage:
 *   node scripts/wtb-outreach.js --dry-run              # See what would be posted
 *   node scripts/wtb-outreach.js                        # Actually post comments
 *   node scripts/wtb-outreach.js --limit 5 --delay 180  # Custom limits
 *   node scripts/wtb-outreach.js --min-transactions 10  # Target experienced buyers only
 */

require('dotenv').config();
const WTBOutreach = require('../src/services/reddit/WTBOutreach');
const logger = require('../src/utils/logger');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  limit: 10,
  delay: 120000, // 2 minutes default (Reddit's rule)
  minTransactions: 0,
  minScore: 50
};

// Parse --limit N
const limitIndex = args.indexOf('--limit');
if (limitIndex !== -1 && args[limitIndex + 1]) {
  options.limit = parseInt(args[limitIndex + 1], 10);
}

// Parse --delay N (in seconds)
const delayIndex = args.indexOf('--delay');
if (delayIndex !== -1 && args[delayIndex + 1]) {
  options.delay = parseInt(args[delayIndex + 1], 10) * 1000;
}

// Parse --min-transactions N
const minTxIndex = args.indexOf('--min-transactions');
if (minTxIndex !== -1 && args[minTxIndex + 1]) {
  options.minTransactions = parseInt(args[minTxIndex + 1], 10);
}

// Parse --min-score N
const minScoreIndex = args.indexOf('--min-score');
if (minScoreIndex !== -1 && args[minScoreIndex + 1]) {
  options.minScore = parseInt(args[minScoreIndex + 1], 10);
}

// Validate Reddit credentials
const requiredEnvVars = ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_REFRESH_TOKEN'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0 && !options.dryRun) {
  console.error('\n❌ Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\nAdd these to your .env file or run with --dry-run to test without posting.\n');
  process.exit(1);
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🎯 WTB Auto-Outreach for The Hub\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Mode:              ${options.dryRun ? '🧪 DRY RUN (no comments will be posted)' : '🚀 LIVE (will post real comments)'}`);
  console.log(`Max comments:      ${options.limit}`);
  console.log(`Delay:             ${options.delay / 1000}s between posts`);
  console.log(`Min transactions:  ${options.minTransactions}`);
  console.log(`Min deal score:    ${options.minScore}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (options.dryRun) {
    console.log('💡 Dry run mode: Comments will be generated but not posted.\n');
  } else {
    console.log('⚠️  LIVE mode: Real comments will be posted to Reddit!\n');
    console.log('Press Ctrl+C within 3 seconds to cancel...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  try {
    // Initialize outreach service
    const outreach = new WTBOutreach({
      minTransactions: options.minTransactions,
      maxCommentsPerRun: options.limit,
      minDealScore: options.minScore
    });

    // Run outreach
    const result = await outreach.runOutreach(options);

    // Display results
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 OUTREACH RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Thread:            ${result.thread.title}`);
    console.log(`URL:               ${result.thread.url}`);
    console.log(`Total requests:    ${result.totalMatches} (${result.qualifiedMatches} qualified)`);
    console.log(`Comments posted:   ${result.posted}`);
    console.log(`Skipped:           ${result.skipped}`);
    console.log(`Errors:            ${result.errors}\n`);

    if (result.results.length > 0) {
      console.log('📝 Detailed Results:\n');
      result.results.forEach((r, i) => {
        console.log(`${i + 1}. u/${r.author}`);
        console.log(`   Looking for: ${r.brand} ${r.models.join(', ') || '(any model)'}`);
        console.log(`   Matches: ${r.dealCount} deal(s) | Score: ${r.matchScore}`);
        
        if (r.success && !r.dryRun) {
          console.log(`   ✅ Posted: ${r.permalink}`);
        } else if (r.dryRun) {
          console.log(`   🧪 Would post: "${r.comment}"`);
        } else if (r.skipped) {
          console.log(`   ⏭️  Skipped: ${r.reason}`);
        } else if (r.error) {
          console.log(`   ❌ Error: ${r.error}`);
        }
        console.log('');
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (options.dryRun) {
      console.log('💡 This was a dry run. Run without --dry-run to actually post comments.\n');
    } else {
      console.log('✅ Outreach complete! Check Reddit to verify comments were posted.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Cancelled by user\n');
  process.exit(0);
});

main();
