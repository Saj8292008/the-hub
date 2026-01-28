/**
 * Generate Initial Blog Posts with AI
 * Run this script to generate 15-20 SEO-optimized blog posts
 *
 * Usage: node scripts/generateBlogPosts.js
 */

// Load environment variables FIRST
require('dotenv').config();

const blogGenerator = require('../src/services/openai/blogGenerator');
const blogQueries = require('../src/db/blogQueries');
const supabase = require('../src/db/supabase');

// Blog post topics organized by category
const BLOG_TOPICS = [
  // Watches (6 posts)
  {
    topic: 'Best Rolex Watches Under $10,000 in 2025',
    category: 'watches',
    targetKeywords: ['rolex price tracker', 'affordable rolex', 'rolex submariner', 'rolex investment'],
    tone: 'authoritative',
    length: 'long'
  },
  {
    topic: 'Omega vs Rolex: Which Luxury Watch Brand Offers Better Value?',
    category: 'watches',
    targetKeywords: ['omega speedmaster', 'rolex comparison', 'luxury watch brands', 'watch investment'],
    tone: 'authoritative',
    length: 'long'
  },
  {
    topic: 'Complete Guide to Buying Used Watches in 2025',
    category: 'watches',
    targetKeywords: ['how to buy used watches', 'watch price guide', 'pre-owned watches', 'watch authentication'],
    tone: 'authoritative',
    length: 'long'
  },
  {
    topic: 'Top 10 Watch Investments Under $5,000 for Beginners',
    category: 'watches',
    targetKeywords: ['best watch investment under 5k', 'affordable luxury watches', 'beginner watch collecting'],
    tone: 'friendly',
    length: 'medium'
  },
  {
    topic: 'Seiko vs Tudor: Battle of the Affordable Luxury Watches',
    category: 'watches',
    targetKeywords: ['seiko', 'tudor', 'affordable luxury', 'watch comparison'],
    tone: 'authoritative',
    length: 'medium'
  },
  {
    topic: 'Understanding Watch Price Fluctuations: A Data-Driven Analysis',
    category: 'watches',
    targetKeywords: ['watch price tracker', 'luxury watch market', 'watch investment trends'],
    tone: 'professional',
    length: 'long'
  },

  // Cars (4 posts)
  {
    topic: 'Best Porsche 911 Models to Buy in 2025',
    category: 'cars',
    targetKeywords: ['porsche 911 price', 'best porsche 911', 'classic car investment', 'porsche buying guide'],
    tone: 'authoritative',
    length: 'long'
  },
  {
    topic: 'Classic Car Investment Guide: What to Buy Now',
    category: 'cars',
    targetKeywords: ['classic car investment', 'car price tracker', 'vintage car values', 'collector cars'],
    tone: 'professional',
    length: 'long'
  },
  {
    topic: 'Ferrari vs Lamborghini: Which Holds Value Better?',
    category: 'cars',
    targetKeywords: ['ferrari investment', 'lamborghini value', 'supercar comparison', 'luxury car market'],
    tone: 'authoritative',
    length: 'medium'
  },
  {
    topic: 'How to Track Luxury Car Prices and Find the Best Deals',
    category: 'cars',
    targetKeywords: ['car price tracker', 'luxury car deals', 'how to buy exotic cars'],
    tone: 'friendly',
    length: 'medium'
  },

  // Sneakers (4 posts)
  {
    topic: 'Most Valuable Air Jordan Sneakers in 2025',
    category: 'sneakers',
    targetKeywords: ['air jordan value', 'sneaker price tracker', 'most expensive jordans', 'sneaker investment'],
    tone: 'authoritative',
    length: 'long'
  },
  {
    topic: 'Nike Dunk vs Air Jordan 1: Which is the Better Investment?',
    category: 'sneakers',
    targetKeywords: ['nike dunk', 'air jordan 1', 'sneaker comparison', 'sneaker resale value'],
    tone: 'friendly',
    length: 'medium'
  },
  {
    topic: 'Beginner\'s Guide to Sneaker Investing in 2025',
    category: 'sneakers',
    targetKeywords: ['sneaker investment guide', 'how to resell sneakers', 'sneaker price tracker'],
    tone: 'friendly',
    length: 'long'
  },
  {
    topic: 'Yeezy vs Off-White: Which Sneaker Brand Has Better Resale Value?',
    category: 'sneakers',
    targetKeywords: ['yeezy value', 'off-white sneakers', 'sneaker resale', 'limited edition sneakers'],
    tone: 'authoritative',
    length: 'medium'
  },

  // Sports (2 posts)
  {
    topic: 'Most Valuable Sports Cards and Memorabilia in 2025',
    category: 'sports',
    targetKeywords: ['sports card value', 'memorabilia investment', 'trading cards price tracker'],
    tone: 'authoritative',
    length: 'long'
  },
  {
    topic: 'How to Invest in Sports Memorabilia: A Complete Guide',
    category: 'sports',
    targetKeywords: ['sports memorabilia investment', 'collectibles guide', 'sports card investing'],
    tone: 'professional',
    length: 'medium'
  },

  // General (4 posts)
  {
    topic: 'The Hub Platform Guide: How to Track Luxury Asset Prices',
    category: 'general',
    targetKeywords: ['luxury asset tracking', 'price tracker tool', 'investment platform'],
    tone: 'professional',
    length: 'medium'
  },
  {
    topic: 'Alternative Investments: Why Luxury Assets Outperform Stocks',
    category: 'general',
    targetKeywords: ['alternative investments', 'luxury asset returns', 'investment diversification'],
    tone: 'professional',
    length: 'long'
  },
  {
    topic: '2025 Luxury Asset Market Trends and Predictions',
    category: 'general',
    targetKeywords: ['luxury market trends', 'investment predictions 2025', 'asset market analysis'],
    tone: 'authoritative',
    length: 'long'
  },
  {
    topic: 'How to Build a Luxury Asset Portfolio from Scratch',
    category: 'general',
    targetKeywords: ['luxury portfolio', 'asset diversification', 'investment strategy'],
    tone: 'professional',
    length: 'long'
  }
];

class BlogPostGenerator {
  constructor() {
    this.successCount = 0;
    this.errorCount = 0;
    this.errors = [];
    this.useFileStorage = false;
    this.generatedPosts = [];
  }

  async generateAll() {
    console.log('🚀 Starting AI Blog Post Generation');
    console.log(`📝 Total posts to generate: ${BLOG_TOPICS.length}`);
    console.log('-----------------------------------\n');

    // Check if OpenAI is available
    const openaiClient = require('../src/services/openai/client');
    if (!openaiClient.isAvailable()) {
      console.error('❌ OpenAI client not available. Please check OPENAI_API_KEY in .env');
      process.exit(1);
    }

    // Check if Supabase is available - use file storage as fallback
    if (!supabase.isAvailable()) {
      console.warn('⚠️  Supabase not available. Using JSON file storage as fallback.');
      console.warn('   Posts will be saved to ./generated-blog-posts.json\n');
      this.useFileStorage = true;
    } else {
      console.log('✅ Supabase connected\n');
    }

    // Generate posts one by one
    for (let i = 0; i < BLOG_TOPICS.length; i++) {
      const topic = BLOG_TOPICS[i];
      console.log(`\n[${i + 1}/${BLOG_TOPICS.length}] Generating: "${topic.topic}"`);
      console.log(`Category: ${topic.category} | Tone: ${topic.tone} | Length: ${topic.length}`);

      try {
        await this.generateSinglePost(topic);
        this.successCount++;
        console.log(`✅ Success (${this.successCount}/${BLOG_TOPICS.length})`);

        // Small delay to avoid rate limiting
        if (i < BLOG_TOPICS.length - 1) {
          console.log('⏳ Waiting 2 seconds...');
          await this.sleep(2000);
        }
      } catch (error) {
        this.errorCount++;
        this.errors.push({ topic: topic.topic, error: error.message });
        console.error(`❌ Error: ${error.message}`);
      }
    }

    // Summary
    console.log('\n===================================');
    console.log('📊 Generation Summary');
    console.log('===================================');
    console.log(`✅ Successful: ${this.successCount}`);
    console.log(`❌ Failed: ${this.errorCount}`);
    console.log(`📈 Success Rate: ${((this.successCount / BLOG_TOPICS.length) * 100).toFixed(1)}%`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.topic}`);
        console.log(`   ${err.error}\n`);
      });
    }

    // Save to file if using file storage
    if (this.useFileStorage && this.generatedPosts.length > 0) {
      const fs = require('fs');
      const outputPath = './generated-blog-posts.json';
      fs.writeFileSync(outputPath, JSON.stringify(this.generatedPosts, null, 2));
      console.log(`\n💾 Posts saved to: ${outputPath}`);
      console.log('   Import these posts to your database when Supabase is configured.');
    }

    console.log('\n🎉 Blog post generation complete!');
    if (!this.useFileStorage) {
      console.log(`View posts at: http://localhost:5173/blog`);
    }
  }

  async generateSinglePost(topicConfig) {
    // Generate post with AI
    const generatedPost = await blogGenerator.generateBlogPost({
      topic: topicConfig.topic,
      category: topicConfig.category,
      targetKeywords: topicConfig.targetKeywords,
      includeData: true,
      tone: topicConfig.tone,
      length: topicConfig.length
    });

    // Add additional metadata
    const postData = {
      ...generatedPost,
      status: 'published',
      published_at: new Date().toISOString(),
      author_name: 'The Hub Team',
      view_count: 0
    };

    // Save to database or file storage
    if (this.useFileStorage) {
      // Add to in-memory array for later file export
      this.generatedPosts.push(postData);

      console.log(`   📄 Slug: ${postData.slug}`);
      console.log(`   📏 Length: ${postData.content.split(' ').length} words`);
      console.log(`   🏷️  Keywords: ${postData.keywords.slice(0, 3).join(', ')}...`);

      return postData;
    } else {
      // Save to database
      const result = await blogQueries.createPost(postData);

      if (!result.data) {
        throw new Error('Failed to save post to database');
      }

      console.log(`   📄 Slug: ${result.data.slug}`);
      console.log(`   📏 Length: ${result.data.content.split(' ').length} words`);
      console.log(`   🏷️  Keywords: ${result.data.keywords.slice(0, 3).join(', ')}...`);

      return result.data;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the generator
async function main() {
  const generator = new BlogPostGenerator();

  try {
    await generator.generateAll();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Generation interrupted by user');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = BlogPostGenerator;
