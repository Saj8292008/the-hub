#!/usr/bin/env node
/**
 * Content Atomizer CLI
 * 
 * Usage:
 *   node scripts/atomize.js --blog "path/to/post.md"
 *   node scripts/atomize.js --insight "Your insight here"
 *   node scripts/atomize.js --deal '{"title":"...", "price": 1000}'
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ContentAtomizer = require('../src/services/content/ContentAtomizer');

const atomizer = new ContentAtomizer();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];
  const value = args.slice(1).join(' ');

  try {
    switch (command) {
      case '--blog':
      case '-b':
        await atomizeBlog(value);
        break;
      
      case '--insight':
      case '-i':
        await atomizeInsight(value);
        break;
      
      case '--deal':
      case '-d':
        await atomizeDeal(value);
        break;
      
      case '--help':
      case '-h':
        showHelp();
        break;
      
      default:
        // Treat as quick insight if no flag
        await atomizeInsight(args.join(' '));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function atomizeBlog(filePath) {
  if (!filePath) {
    console.error('❌ Please provide a file path');
    return;
  }

  const fullPath = path.resolve(filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Parse frontmatter if exists
  let title = path.basename(filePath, path.extname(filePath));
  let body = content;
  let category = 'general';

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    body = frontmatterMatch[2];
    
    const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
    if (titleMatch) title = titleMatch[1];
    
    const categoryMatch = frontmatter.match(/category:\s*["']?([^"'\n]+)["']?/);
    if (categoryMatch) category = categoryMatch[1];
  }

  console.log(`\n📄 Atomizing: "${title}"\n`);
  console.log('═'.repeat(60));

  const result = await atomizer.atomizeBlogPost({ title, body, category });
  
  printResults(result);
  
  // Save to file
  const outputPath = fullPath.replace(/\.(md|txt)$/, '-atomized.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n💾 Saved to: ${outputPath}`);
}

async function atomizeInsight(insight) {
  if (!insight) {
    console.error('❌ Please provide an insight');
    return;
  }

  console.log(`\n💡 Atomizing insight...\n`);
  console.log('═'.repeat(60));

  const result = await atomizer.quickAtomize(insight);
  
  console.log('\n🐦 TWEET:');
  console.log(`   ${result.tweet}\n`);
  
  console.log('🧵 THREAD HOOK:');
  console.log(`   ${result.thread_hook}\n`);
  
  console.log('💼 LINKEDIN OPENER:');
  console.log(`   ${result.linkedin_opener}\n`);
  
  console.log('📱 TELEGRAM:');
  console.log(`   ${result.telegram}\n`);
  
  console.log('🎨 QUOTE CARD:');
  console.log(`   "${result.quote_card}"\n`);
}

async function atomizeDeal(dealJson) {
  let deal;
  
  try {
    deal = JSON.parse(dealJson);
  } catch {
    console.error('❌ Invalid JSON. Example: \'{"title":"Rolex Sub", "price": 8000, "marketPrice": 10000}\'');
    return;
  }

  console.log(`\n🔥 Atomizing deal: "${deal.title}"\n`);
  console.log('═'.repeat(60));

  const result = await atomizer.atomizeDeal(deal);
  
  console.log('\n🚨 URGENT TWEET:');
  console.log(`   ${result.content.urgentTweet}\n`);
  
  console.log('📊 DETAIL TWEET:');
  console.log(`   ${result.content.detailTweet}\n`);
  
  console.log('📱 TELEGRAM ALERT:');
  console.log(`   ${result.content.telegramAlert}\n`);
  
  console.log('🧵 THREAD HOOK:');
  console.log(`   ${result.content.threadHook}\n`);
  
  console.log('📸 STORY CAPTION:');
  console.log(`   ${result.content.storyCaption}\n`);
  
  console.log('# HASHTAGS:');
  console.log(`   ${result.content.hashtags?.join(' ')}\n`);
}

function printResults(result) {
  const { pieces } = result;
  
  console.log(`\n✅ Generated ${result.totalPieces} pieces of content\n`);
  
  // Tweets
  if (pieces.tweets?.length > 0) {
    console.log('═'.repeat(60));
    console.log('🐦 STANDALONE TWEETS:');
    console.log('═'.repeat(60));
    pieces.tweets.forEach((tweet, i) => {
      console.log(`\n${i + 1}. ${tweet}`);
    });
  }
  
  // Threads
  if (pieces.threads?.length > 0) {
    console.log('\n' + '═'.repeat(60));
    console.log('🧵 TWITTER THREADS:');
    console.log('═'.repeat(60));
    pieces.threads.forEach((thread, i) => {
      console.log(`\n--- Thread ${i + 1} ---`);
      console.log(`Hook: ${thread.hook}\n`);
      thread.tweets?.forEach((tweet, j) => {
        console.log(`${j + 1}/ ${tweet}`);
      });
    });
  }
  
  // LinkedIn
  if (pieces.linkedin) {
    console.log('\n' + '═'.repeat(60));
    console.log('💼 LINKEDIN POST:');
    console.log('═'.repeat(60));
    console.log(`\n${pieces.linkedin}`);
  }
  
  // Telegram
  if (pieces.telegram?.length > 0) {
    console.log('\n' + '═'.repeat(60));
    console.log('📱 TELEGRAM MESSAGES:');
    console.log('═'.repeat(60));
    pieces.telegram.forEach((msg, i) => {
      console.log(`\n${i + 1}. ${msg}`);
    });
  }
  
  // Quote cards
  if (pieces.quoteCards?.length > 0) {
    console.log('\n' + '═'.repeat(60));
    console.log('🎨 QUOTE CARDS:');
    console.log('═'.repeat(60));
    pieces.quoteCards.forEach((quote, i) => {
      console.log(`\n${i + 1}. "${quote}"`);
    });
  }
  
  // Polls
  if (pieces.polls?.length > 0) {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 POLL IDEAS:');
    console.log('═'.repeat(60));
    pieces.polls.forEach((poll, i) => {
      console.log(`\n${i + 1}. ${poll.question}`);
      poll.options?.forEach((opt, j) => {
        console.log(`   ${String.fromCharCode(65 + j)}. ${opt}`);
      });
    });
  }
  
  // Newsletter
  if (pieces.newsletterSnippet) {
    console.log('\n' + '═'.repeat(60));
    console.log('📧 NEWSLETTER SNIPPET:');
    console.log('═'.repeat(60));
    console.log(`\n${pieces.newsletterSnippet}`);
  }
}

function showHelp() {
  console.log(`
📝 Content Atomizer CLI

Turn one piece of content into 15+ social media pieces.

USAGE:
  node scripts/atomize.js [command] [value]

COMMANDS:
  --blog, -b <file>     Atomize a markdown/text blog post
  --insight, -i <text>  Quick atomize an insight or stat
  --deal, -d <json>     Atomize a deal alert
  --help, -h            Show this help

EXAMPLES:
  node scripts/atomize.js --blog blog/posts/watch-market-2026.md
  node scripts/atomize.js --insight "Rolex Submariner prices dropped 15% this month"
  node scripts/atomize.js "Quick insight without flag"
  node scripts/atomize.js --deal '{"title":"Rolex Sub 124060","price":12000,"marketPrice":14500,"savings":2500,"savingsPercent":17,"category":"watches"}'

The atomizer uses GPT-4 to generate:
  • Twitter threads (2-3)
  • Standalone tweets (5-7)
  • LinkedIn post (1)
  • Telegram messages (3)
  • Quote cards (3-4)
  • Poll ideas (2)
  • Newsletter snippet (1)
`);
}

main();
