require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (!supabase) {
  console.error('❌ Supabase client not available. Check your .env configuration.');
  process.exit(1);
}

// Helper function to calculate read time
function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Helper function to extract excerpt from content
function extractExcerpt(content, maxLength = 200) {
  // Remove markdown headers and get first paragraph
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

// Articles metadata
const articles = [
  {
    title: 'Best Rolex Submariner Deals in 2026: Where to Find Them Under Retail',
    slug: 'rolex-submariner-deals-2026',
    meta_title: 'Best Rolex Submariner Deals 2026: Find Them Under Retail',
    meta_description: 'Find authentic Rolex Submariner deals in 2026. Expert guide to buying below retail, authentication tips, and current market prices. Save thousands on your Submariner.',
    keywords: ['rolex submariner deals', 'rolex submariner price', 'buy rolex submariner', 'submariner under retail', 'rolex submariner 2026'],
    category: 'watches',
    tags: ['rolex', 'submariner', 'luxury watches', 'watch deals', 'price guide'],
    file: 'watches/rolex-submariner-deals-2026.md'
  },
  {
    title: 'Omega Speedmaster Price Guide 2026: What You Should Actually Pay',
    slug: 'omega-speedmaster-price-guide-2026',
    meta_title: 'Omega Speedmaster Price Guide 2026: Fair Market Prices',
    meta_description: 'Complete Omega Speedmaster price guide for 2026. Current prices by reference, vintage vs modern values, where to buy, and investment potential analysis.',
    keywords: ['omega speedmaster price', 'speedmaster price guide', 'omega moonwatch price', 'speedmaster value', 'buy omega speedmaster'],
    category: 'watches',
    tags: ['omega', 'speedmaster', 'moonwatch', 'price guide', 'luxury watches'],
    file: 'watches/omega-speedmaster-price-guide-2026.md'
  },
  {
    title: 'How to Spot Fake Luxury Watches: Expert Authentication Guide',
    slug: 'spot-fake-luxury-watches-guide',
    meta_title: 'How to Spot Fake Luxury Watches: Authentication Guide 2026',
    meta_description: 'Learn to spot fake Rolex, Omega, and luxury watches. Expert authentication tips, red flags, movement inspection guide, and professional authentication services.',
    keywords: ['spot fake luxury watches', 'fake rolex', 'authenticate luxury watch', 'fake omega', 'watch authentication'],
    category: 'watches',
    tags: ['authentication', 'fake watches', 'rolex', 'omega', 'luxury watches', 'buyer guide'],
    file: 'watches/spot-fake-luxury-watches-guide.md'
  }
];

async function insertArticles() {
  console.log('🚀 Starting blog article insertion...\n');

  for (const article of articles) {
    try {
      console.log(`📝 Processing: ${article.title}`);

      // Read markdown file
      const filePath = path.join(__dirname, '../blog/articles', article.file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Calculate read time
      const readTime = calculateReadTime(content);

      // Extract excerpt if not provided
      const excerpt = article.excerpt || extractExcerpt(content);

      // Prepare article data
      const articleData = {
        title: article.title,
        slug: article.slug,
        excerpt: excerpt,
        content: content,
        meta_title: article.meta_title,
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

      // Insert into database
      const { data, error } = await supabase
        .from('blog_posts')
        .insert(articleData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Duplicate slug
          console.log(`⚠️  Article already exists: ${article.slug}`);

          // Update existing article instead
          const { data: updateData, error: updateError } = await supabase
            .from('blog_posts')
            .update(articleData)
            .eq('slug', article.slug)
            .select()
            .single();

          if (updateError) {
            console.error(`❌ Error updating article: ${updateError.message}`);
          } else {
            console.log(`✅ Updated: ${article.slug} (${readTime} min read)\n`);
          }
        } else {
          console.error(`❌ Error inserting article: ${error.message}\n`);
        }
      } else {
        console.log(`✅ Inserted: ${article.slug} (${readTime} min read)\n`);
      }

    } catch (err) {
      console.error(`❌ Error processing ${article.file}:`, err.message, '\n');
    }
  }

  console.log('🎉 Article insertion complete!');
  console.log('\n📊 Summary:');

  // Get article counts by category
  const { data: categories } = await supabase
    .from('blog_posts')
    .select('category')
    .eq('status', 'published');

  if (categories) {
    const counts = categories.reduce((acc, { category }) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    console.log('Articles by category:');
    Object.entries(counts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} articles`);
    });
  }

  console.log('\n🔗 View your articles:');
  console.log('  http://localhost:5173/blog');
}

// Run the script
insertArticles()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
