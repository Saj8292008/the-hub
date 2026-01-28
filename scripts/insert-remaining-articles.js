require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper functions
function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function extractExcerpt(content, maxLength = 200) {
  const cleanContent = content
    .replace(/^#.*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .trim();
  const firstParagraph = cleanContent.split('\n\n')[0];
  if (firstParagraph.length <= maxLength) {
    return firstParagraph;
  }
  return firstParagraph.substring(0, maxLength) + '...';
}

// Articles to insert
const articles = [
  // Previously added articles
  {
    title: 'Vintage Seiko Watches: Hidden Gems Under $500 in 2026',
    slug: 'vintage-seiko-watches-under-500',
    meta_description: 'Discover the best vintage Seiko watches under $500. Investment-grade models, where to find them, authentication tips, and which references are appreciating fastest.',
    keywords: ['vintage seiko watches', 'seiko under 500', 'vintage seiko', 'affordable vintage watches', 'seiko investment'],
    category: 'watches',
    tags: ['seiko', 'vintage watches', 'affordable watches', 'watch investment'],
    file: 'watches/vintage-seiko-watches-under-500.md'
  },
  {
    title: 'Watch Investment Guide: Which Luxury Watches Hold Value Best?',
    slug: 'watches-that-hold-value-investment-guide',
    meta_description: 'Which luxury watches hold value best? Data-driven investment guide covering appreciation rates, best brands, model selection, and market trends for 2026.',
    keywords: ['watches that hold value', 'watch investment', 'luxury watch investment', 'watches appreciate', 'best watch investment 2026'],
    category: 'watches',
    tags: ['investment', 'luxury watches', 'rolex', 'patek philippe', 'audemars piguet'],
    file: 'watches/watches-that-hold-value-investment-guide.md'
  },
  {
    title: 'Best Used Sports Cars Under $30k in 2026: Performance for Less',
    slug: 'best-used-sports-cars-under-30k-2026',
    meta_description: 'Top 10 used sports cars under $30k in 2026. Performance specs, reliability ratings, where to buy, and what to check before purchasing.',
    keywords: ['best used sports cars under 30k', 'affordable sports cars', 'used sports cars 2026', 'sports cars under 30000'],
    category: 'cars',
    tags: ['sports cars', 'used cars', 'performance cars', 'car deals'],
    file: 'cars/best-used-sports-cars-under-30k-2026.md'
  },
  // New articles - Cars (4)
  {
    title: 'BMW M3 vs M4 2026: Which Should You Buy? (Price Comparison)',
    slug: 'bmw-m3-vs-m4-2026-comparison',
    meta_description: 'BMW M3 vs M4 complete comparison for 2026. Price differences, performance specs, practicality, resale value, and which offers better value.',
    keywords: ['bmw m3 vs m4', 'bmw m3 m4 comparison', 'm3 vs m4 2026', 'bmw m3 price', 'bmw m4 price'],
    category: 'cars',
    tags: ['bmw', 'm3', 'm4', 'performance cars', 'car comparison'],
    file: 'cars/bmw-m3-vs-m4-2026-comparison.md'
  },
  {
    title: 'Tesla Model 3 vs Model Y: Complete Price & Value Comparison 2026',
    slug: 'tesla-model-3-vs-model-y-2026',
    meta_description: 'Tesla Model 3 vs Model Y 2026 comparison. Pricing, features, range, cost of ownership, and which Tesla offers better value for your needs.',
    keywords: ['tesla model 3 vs model y', 'model 3 vs model y', 'tesla comparison 2026', 'tesla model 3 price', 'tesla model y price'],
    category: 'cars',
    tags: ['tesla', 'model 3', 'model y', 'electric cars', 'car comparison'],
    file: 'cars/tesla-model-3-vs-model-y-2026.md'
  },
  {
    title: 'How to Find Dealer Demo Cars: Get New Cars at 20-30% Off',
    slug: 'how-to-find-dealer-demo-cars',
    meta_description: 'Find dealer demo cars and save 20-30% off new car prices. Where to search, negotiation tactics, what to inspect, and best timing for deals.',
    keywords: ['dealer demo cars', 'demo cars', 'buy demo car', 'demo car deals', 'save on new cars'],
    category: 'cars',
    tags: ['demo cars', 'car deals', 'new cars', 'car buying tips'],
    file: 'cars/how-to-find-dealer-demo-cars.md'
  },
  {
    title: 'Classic Cars Appreciating in Value: Best Investments for 2026',
    slug: 'classic-cars-appreciating-2026',
    meta_description: 'Classic cars appreciating fastest in 2026. Investment analysis, market trends, top models to buy, and which classics will surge in value.',
    keywords: ['classic cars appreciating', 'classic car investment', 'classic cars value 2026', 'vintage car investment'],
    category: 'cars',
    tags: ['classic cars', 'car investment', 'vintage cars', 'collectible cars'],
    file: 'cars/classic-cars-appreciating-2026.md'
  },
  // New articles - Sneakers (5)
  {
    title: 'Jordan 1 Retro Price Guide 2026: What to Pay for Each Colorway',
    slug: 'jordan-1-price-guide-2026',
    meta_description: 'Complete Jordan 1 price guide for 2026. Current prices by colorway, market trends, where to buy, authentication tips, and investment potential.',
    keywords: ['jordan 1 price guide', 'jordan 1 prices', 'jordan 1 value', 'jordan 1 colorways', 'jordan 1 2026'],
    category: 'sneakers',
    tags: ['jordan 1', 'sneakers', 'price guide', 'nike', 'sneaker investment'],
    file: 'sneakers/jordan-1-price-guide-2026.md'
  },
  {
    title: 'Best Sneaker Resale Platforms 2026: StockX vs GOAT vs eBay Compared',
    slug: 'best-sneaker-resale-platforms-2026',
    meta_description: 'Complete comparison of StockX, GOAT, eBay, and other sneaker resale platforms. Fees, authentication quality, best prices, and where to buy in 2026.',
    keywords: ['best sneaker resale platform', 'stockx vs goat', 'stockx vs ebay', 'sneaker resale sites', 'where to buy sneakers'],
    category: 'sneakers',
    tags: ['resale', 'stockx', 'goat', 'ebay', 'sneaker platforms'],
    file: 'sneakers/best-sneaker-resale-platforms-2026.md'
  },
  {
    title: 'How to Cop Limited Release Sneakers in 2026: SNKRS Tips & Bot Alternatives',
    slug: 'how-to-cop-limited-sneakers-2026',
    meta_description: 'Master SNKRS app in 2026. Algorithm secrets, raffle strategies, in-store vs online, and which tools actually work for copping limited sneakers.',
    keywords: ['how to cop sneakers', 'snkrs tips', 'cop limited sneakers', 'snkrs bot', 'sneaker raffles'],
    category: 'sneakers',
    tags: ['snkrs', 'raffles', 'limited release', 'sneaker bots', 'copping guide'],
    file: 'sneakers/how-to-cop-limited-sneakers-2026.md'
  },
  {
    title: 'Yeezy vs Dunk Resale Value 2026: Which Investment Holds Better?',
    slug: 'yeezy-vs-dunk-resale-value-2026',
    meta_description: 'Yeezy vs Dunk resale value comparison 2026. Price data, market trends, why Yeezys crashed, which Dunks are appreciating, and investment outlook.',
    keywords: ['yeezy vs dunk', 'yeezy resale value', 'dunk resale value', 'yeezy investment', 'dunk investment'],
    category: 'sneakers',
    tags: ['yeezy', 'dunk', 'resale value', 'sneaker investment', 'market analysis'],
    file: 'sneakers/yeezy-vs-dunk-resale-value-2026.md'
  },
  {
    title: 'Underrated Sneakers to Buy Before They Spike in 2026',
    slug: 'underrated-sneakers-2026',
    meta_description: '15 underrated sneakers trading near retail that will spike 100-300% by 2028. New Balance, ASICS, Salomon picks with high investment potential.',
    keywords: ['underrated sneakers', 'sneakers to invest in', 'sleeper sneakers', 'new balance investment', 'sneakers before hype'],
    category: 'sneakers',
    tags: ['investment', 'new balance', 'asics', 'salomon', 'underrated'],
    file: 'sneakers/underrated-sneakers-2026.md'
  }
];

async function insertArticles() {
  console.log('🚀 Inserting blog articles...\n');

  let successCount = 0;
  let skipCount = 0;

  for (const article of articles) {
    try {
      console.log(`📝 Processing: ${article.title}`);

      const filePath = path.join(__dirname, '../blog/articles', article.file);

      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  File not found: ${article.file}\n`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const readTime = calculateReadTime(content);
      const excerpt = extractExcerpt(content);

      const articleData = {
        title: article.title,
        slug: article.slug,
        excerpt: excerpt,
        content: content,
        meta_title: article.title,
        meta_description: article.meta_description,
        keywords: article.keywords,
        category: article.category,
        tags: article.tags,
        status: 'published',
        published_at: new Date().toISOString(),
        author_name: 'The Hub Team',
        read_time_minutes: readTime,
        hero_image_url: `/images/blog/${article.slug}.jpg`,
        thumbnail_url: `/images/blog/${article.slug}-thumb.jpg`
      };

      const { data, error } = await supabase
        .from('blog_posts')
        .insert(articleData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log(`   ⚠️  Already exists, skipping\n`);
          skipCount++;
        } else {
          console.log(`   ❌ Error: ${error.message}\n`);
        }
      } else {
        console.log(`   ✅ Inserted: ${article.slug} (${readTime} min read)\n`);
        successCount++;
      }

    } catch (err) {
      console.error(`   ❌ Error: ${err.message}\n`);
    }
  }

  console.log('🎉 Insertion complete!');
  console.log(`   ✅ Inserted: ${successCount}`);
  console.log(`   ⚠️  Skipped: ${skipCount}\n`);

  // Get final counts
  const { data: categories } = await supabase
    .from('blog_posts')
    .select('category')
    .eq('status', 'published');

  if (categories) {
    const counts = categories.reduce((acc, { category }) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    console.log('📚 Total articles by category:');
    Object.entries(counts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} articles`);
    });
  }

  console.log('\n🔗 View articles: http://localhost:5173/blog');
}

insertArticles()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
