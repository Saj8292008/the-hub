/**
 * AI Blog Content Generator
 * Generates SEO-optimized blog posts using GPT-4 with market data context
 */

const openaiClient = require('./client');
const supabase = require('../../db/supabase');

class BlogGenerator {
  /**
   * Generate a complete blog post
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generated blog post data
   */
  async generateBlogPost(options) {
    const {
      topic,
      category = 'general',
      targetKeywords = [],
      includeData = true,
      tone = 'authoritative',
      length = 'long' // short (800-1200), medium (1200-1800), long (1800-2500)
    } = options;

    if (!topic) {
      throw new Error('Topic is required for blog generation');
    }

    if (!openaiClient.isAvailable()) {
      throw new Error('OpenAI client not available');
    }

    console.log(`🤖 Generating blog post: "${topic}"`);

    // Step 1: Fetch context data
    let contextData = null;
    if (includeData && category !== 'general') {
      console.log(`📊 Fetching market data for ${category}...`);
      contextData = await this.fetchMarketData(category);
    }

    // Step 2: Build prompt
    const prompt = this.buildPrompt({
      topic,
      category,
      targetKeywords,
      contextData,
      tone,
      length
    });

    // Step 3: Call GPT-4 with function calling
    console.log('✨ Calling OpenAI GPT-4...');

    try {
      const response = await openaiClient.chat({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        functions: [this.getBlogPostFunctionSchema()],
        function_call: { name: 'generate_blog_post' },
        temperature: 0.7,
        max_tokens: 4000
      });

      const functionCall = response.choices[0].message.function_call;
      const blogPost = JSON.parse(functionCall.arguments);

      console.log(`✅ Generated: "${blogPost.title}" (${blogPost.content.split(' ').length} words)`);

      return {
        ...blogPost,
        category,
        ai_generated: true,
        ai_model: 'gpt-4-turbo-preview',
        ai_prompt: topic
      };
    } catch (error) {
      console.error('❌ Blog generation error:', error);
      throw new Error(`Failed to generate blog post: ${error.message}`);
    }
  }

  /**
   * Fetch market data for context
   * @param {string} category - Category (watches, cars, sneakers, sports)
   * @returns {Promise<Object>} - Market data
   */
  async fetchMarketData(category) {
    try {
      if (!supabase.isAvailable()) {
        console.warn('Supabase not available, generating without data context');
        return null;
      }

      switch (category) {
        case 'watches':
          return await this.getWatchMarketData();
        case 'cars':
          return await this.getCarMarketData();
        case 'sneakers':
          return await this.getSneakerMarketData();
        default:
          return null;
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    }
  }

  /**
   * Get watch market data
   */
  async getWatchMarketData() {
    const { data: listings } = await supabase.client
      .from('watch_listings')
      .select('brand, model, price, condition, deal_score')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (!listings || listings.length === 0) return null;

    // Analyze data
    const brands = {};
    let totalPrice = 0;
    let hotDeals = 0;

    listings.forEach(listing => {
      if (listing.brand) {
        brands[listing.brand] = (brands[listing.brand] || 0) + 1;
      }
      totalPrice += parseFloat(listing.price) || 0;
      if (listing.deal_score >= 90) hotDeals++;
    });

    const topBrands = Object.entries(brands)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([brand]) => brand);

    return {
      sampleSize: listings.length,
      averagePrice: Math.round(totalPrice / listings.length),
      topBrands,
      hotDealsCount: hotDeals,
      priceRange: {
        min: Math.min(...listings.map(l => parseFloat(l.price) || 0)),
        max: Math.max(...listings.map(l => parseFloat(l.price) || 0))
      }
    };
  }

  /**
   * Get car market data
   */
  async getCarMarketData() {
    // Similar to watch data
    return {
      sampleSize: 0,
      averagePrice: 0,
      topMakes: [],
      note: 'Car data analysis placeholder'
    };
  }

  /**
   * Get sneaker market data
   */
  async getSneakerMarketData() {
    // Similar to watch data
    return {
      sampleSize: 0,
      averagePrice: 0,
      topBrands: [],
      note: 'Sneaker data analysis placeholder'
    };
  }

  /**
   * Build generation prompt
   */
  buildPrompt({ topic, category, targetKeywords, contextData, tone, length }) {
    const wordCounts = {
      short: '800-1200',
      medium: '1200-1800',
      long: '1800-2500'
    };

    let prompt = `Write a comprehensive, SEO-optimized blog post about "${topic}" for The Hub's luxury asset tracking platform.

**TARGET AUDIENCE:** Investors, collectors, and enthusiasts interested in ${category}

**TONE:** ${tone === 'authoritative' ? 'Expert and authoritative yet accessible' : tone}

**LENGTH:** ${wordCounts[length]} words

**TARGET KEYWORDS:** ${targetKeywords.join(', ') || 'None specified - create organic keywords'}

`;

    if (contextData) {
      prompt += `**MARKET DATA CONTEXT:**
Based on ${contextData.sampleSize} recent listings:
- Average price: $${contextData.averagePrice?.toLocaleString() || 'N/A'}
- Top brands: ${contextData.topBrands?.join(', ') || 'N/A'}
- Hot deals found: ${contextData.hotDealsCount || 0}
- Price range: $${contextData.priceRange?.min?.toLocaleString()} - $${contextData.priceRange?.max?.toLocaleString()}

Use this data to provide unique, data-driven insights.

`;
    }

    prompt += `**REQUIREMENTS:**
1. Integrate target keywords naturally (1-2% density)
2. Include internal links to category pages (/watches, /cars, /sneakers, /sports)
3. Use market data to provide unique insights and specific examples
4. Write in an authoritative yet accessible tone
5. Include actionable advice for buyers/investors
6. Structure with clear H2 and H3 headings
7. Write compelling meta title (50-60 chars) and description (150-160 chars)
8. Generate SEO-friendly slug (lowercase-with-hyphens)
9. Create engaging excerpt (120-150 chars)
10. Include current year (2025) where relevant

**STRUCTURE:**
- Introduction (hook + thesis)
- 3-5 main sections with H2 headings
- Conclusion with call to action
- Use bullet points and numbered lists
- Include specific data points and examples

**STYLE GUIDE:**
- Luxury brand voice: sophisticated, expert, trustworthy
- Data-driven insights (cite specific numbers)
- Avoid hyperbole and clickbait
- Use active voice
- Short paragraphs (2-3 sentences max)
- Include year (2025) in title if relevant

**OUTPUT FORMAT:**
Return structured JSON via function calling with all required fields.`;

    return prompt;
  }

  /**
   * Get system prompt
   */
  getSystemPrompt() {
    return `You are an expert content writer for The Hub, a luxury asset tracking platform. You specialize in creating SEO-optimized, data-driven content about watches, cars, sneakers, and sports. Your writing is authoritative yet accessible, combining market insights with actionable advice for investors and collectors.`;
  }

  /**
   * Get function schema for structured output
   */
  getBlogPostFunctionSchema() {
    return {
      name: 'generate_blog_post',
      description: 'Generate a complete, SEO-optimized blog post',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Engaging post title (50-70 chars, include year if relevant)'
          },
          slug: {
            type: 'string',
            description: 'URL slug (lowercase-with-hyphens)'
          },
          excerpt: {
            type: 'string',
            description: 'Brief excerpt (120-150 chars)'
          },
          content: {
            type: 'string',
            description: 'Full post content in Markdown format with H2/H3 headings'
          },
          meta_title: {
            type: 'string',
            description: 'SEO meta title (50-60 chars)'
          },
          meta_description: {
            type: 'string',
            description: 'SEO meta description (150-160 chars)'
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: 'Target SEO keywords (5-10 keywords)'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Post tags (3-5 relevant tags)'
          },
          internal_links: {
            type: 'array',
            items: { type: 'string' },
            description: 'Suggested internal links to category pages'
          }
        },
        required: ['title', 'slug', 'excerpt', 'content', 'meta_title', 'meta_description', 'keywords', 'tags']
      }
    };
  }

  /**
   * Generate multiple blog posts in batch
   * @param {Array} topics - Array of topic strings
   * @param {Object} options - Shared generation options
   * @returns {Promise<Array>} - Array of generated posts
   */
  async generateBatch(topics, options = {}) {
    console.log(`🚀 Generating ${topics.length} blog posts in batch...`);

    const results = [];
    const errors = [];

    for (const topic of topics) {
      try {
        const post = await this.generateBlogPost({ ...options, topic });
        results.push(post);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate post for "${topic}":`, error);
        errors.push({ topic, error: error.message });
      }
    }

    console.log(`✅ Batch complete: ${results.length} succeeded, ${errors.length} failed`);

    return { results, errors };
  }
}

module.exports = new BlogGenerator();
