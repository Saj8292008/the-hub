/**
 * AI Newsletter Content Generator
 * Generates weekly newsletter content using GPT-4 with market data context
 */

const openaiClient = require('../openai/client');
const supabase = require('../../db/supabase');
const marked = require('marked');

class NewsletterContentGenerator {
  /**
   * Generate complete weekly newsletter
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generated newsletter data
   */
  async generateWeeklyNewsletter(options = {}) {
    const {
      weekStart = this.getWeekStart(),
      weekEnd = this.getWeekEnd(),
      minDealScore = 8.5,
      topDealsCount = 5,
      customPrompt = null
    } = options;

    console.log(`📧 Generating newsletter for ${weekStart} to ${weekEnd}`);

    try {
      // Step 1: Gather data from database
      const data = await this.gatherNewsletterData(weekStart, weekEnd, minDealScore, topDealsCount);

      console.log(`   Found ${data.topDeals.length} top deals`);
      console.log(`   Total new listings: ${data.stats.totalListings}`);

      // Step 2: Generate content with AI
      const content = await this.generateContentWithAI(data, customPrompt);

      // Step 3: Generate A/B test subject lines
      const subjectLines = await this.generateSubjectLines(data);

      // Step 4: Convert markdown to HTML
      const contentHtml = marked.parse(content.markdown);

      return {
        subject_lines: subjectLines,
        content_markdown: content.markdown,
        content_html: contentHtml,
        deals: data.topDeals,
        stats: data.stats,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating newsletter:', error);
      throw error;
    }
  }

  /**
   * Gather all data needed for newsletter
   * @param {string} weekStart - ISO date string
   * @param {string} weekEnd - ISO date string
   * @param {number} minDealScore - Minimum deal score
   * @param {number} topDealsCount - Number of top deals to include
   * @returns {Promise<Object>} - Gathered data
   */
  async gatherNewsletterData(weekStart, weekEnd, minDealScore, topDealsCount) {
    if (!supabase.isAvailable()) {
      console.warn('⚠️  Supabase not available, using sample data');
      return this.getSampleData();
    }

    try {
      // Get top deals
      const topDeals = await this.getTopDeals(minDealScore, topDealsCount);

      // Get market statistics
      const stats = await this.getMarketStats(weekStart, weekEnd);

      // Get popular blog posts
      const popularPosts = await this.getPopularPosts(weekStart, weekEnd);

      return {
        weekStart,
        weekEnd,
        topDeals,
        stats,
        popularPosts
      };
    } catch (error) {
      console.error('Error gathering newsletter data:', error);
      return this.getSampleData();
    }
  }

  /**
   * Get top deals from all categories
   * @param {number} minScore - Minimum deal score
   * @param {number} limit - Max number of deals
   * @returns {Promise<Array>} - Top deals
   */
  async getTopDeals(minScore, limit) {
    const deals = [];

    try {
      // Get watch listings
      const { data: watches } = await supabase.client
        .from('watch_listings')
        .select('*')
        .gte('deal_score', minScore)
        .order('deal_score', { ascending: false })
        .limit(limit);

      if (watches && watches.length > 0) {
        deals.push(...watches.map(w => ({
          ...w,
          category: 'watches',
          type: 'watch'
        })));
      }

      // Get car listings (if table exists)
      try {
        const { data: cars } = await supabase.client
          .from('car_listings')
          .select('*')
          .gte('deal_score', minScore)
          .order('deal_score', { ascending: false })
          .limit(limit);

        if (cars && cars.length > 0) {
          deals.push(...cars.map(c => ({
            ...c,
            category: 'cars',
            type: 'car'
          })));
        }
      } catch (e) {
        // Car listings table might not exist yet
        console.log('No car listings available');
      }

      // Get sneaker listings (if table exists)
      try {
        const { data: sneakers } = await supabase.client
          .from('sneaker_listings')
          .select('*')
          .gte('deal_score', minScore)
          .order('deal_score', { ascending: false })
          .limit(limit);

        if (sneakers && sneakers.length > 0) {
          deals.push(...sneakers.map(s => ({
            ...s,
            category: 'sneakers',
            type: 'sneaker'
          })));
        }
      } catch (e) {
        // Sneaker listings table might not exist yet
        console.log('No sneaker listings available');
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    }

    // Sort by deal score and take top N
    deals.sort((a, b) => (b.deal_score || 0) - (a.deal_score || 0));
    return deals.slice(0, limit);
  }

  /**
   * Get market statistics for the week
   * @param {string} weekStart - ISO date string
   * @param {string} weekEnd - ISO date string
   * @returns {Promise<Object>} - Market stats
   */
  async getMarketStats(weekStart, weekEnd) {
    try {
      // Get total new listings
      const { count: totalListings } = await supabase.client
        .from('watch_listings')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', weekStart)
        .lte('timestamp', weekEnd);

      // Get average price
      const { data: priceData } = await supabase.client
        .from('watch_listings')
        .select('price')
        .gte('timestamp', weekStart)
        .lte('timestamp', weekEnd)
        .not('price', 'is', null);

      const avgPrice = priceData && priceData.length > 0
        ? priceData.reduce((sum, l) => sum + (l.price || 0), 0) / priceData.length
        : 0;

      return {
        totalListings: totalListings || 0,
        avgPrice: Math.round(avgPrice),
        weekStart,
        weekEnd
      };
    } catch (error) {
      console.error('Error getting market stats:', error);
      return {
        totalListings: 0,
        avgPrice: 0,
        weekStart,
        weekEnd
      };
    }
  }

  /**
   * Get popular blog posts from the week
   * @param {string} weekStart - ISO date string
   * @param {string} weekEnd - ISO date string
   * @returns {Promise<Array>} - Popular posts
   */
  async getPopularPosts(weekStart, weekEnd) {
    try {
      const { data } = await supabase.client
        .from('blog_posts')
        .select('id, title, slug, excerpt, view_count, category')
        .eq('status', 'published')
        .gte('published_at', weekStart)
        .lte('published_at', weekEnd)
        .order('view_count', { ascending: false })
        .limit(3);

      return data || [];
    } catch (error) {
      console.error('Error getting popular posts:', error);
      return [];
    }
  }

  /**
   * Generate newsletter content using GPT-4
   * @param {Object} data - Gathered data
   * @param {string} customPrompt - Optional custom prompt
   * @returns {Promise<Object>} - { markdown }
   */
  async generateContentWithAI(data, customPrompt) {
    if (!openaiClient.isAvailable()) {
      console.warn('⚠️  OpenAI not available, using template content');
      return { markdown: this.generateTemplateContent(data) };
    }

    try {
      const prompt = customPrompt || this.buildPrompt(data);

      console.log('🤖 Generating content with GPT-4...');

      const response = await openaiClient.chat({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const markdown = response.choices[0].message.content;

      console.log('✅ Content generated successfully');

      return { markdown };
    } catch (error) {
      console.error('Error generating AI content:', error);
      console.log('Falling back to template content');
      return { markdown: this.generateTemplateContent(data) };
    }
  }

  /**
   * Build prompt for AI content generation
   * @param {Object} data - Gathered data
   * @returns {string} - Prompt
   */
  buildPrompt(data) {
    const weekStartDate = new Date(data.weekStart).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const weekEndDate = new Date(data.weekEnd).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return `
Generate a compelling weekly newsletter for The Hub subscribers.

**Week:** ${weekStartDate} - ${weekEndDate}

**This Week's Data:**
- Total new listings: ${data.stats.totalListings}
- Average listing price: $${data.stats.avgPrice.toLocaleString()}
- Top deals found: ${data.topDeals.length}

**Top Deals to Feature:**
${data.topDeals.map((deal, i) => `
${i + 1}. ${deal.title || `${deal.brand || ''} ${deal.model || ''}`}
   - Category: ${deal.category}
   - Price: $${deal.price?.toLocaleString() || 'N/A'}
   - Deal Score: ${deal.deal_score?.toFixed(1) || 'N/A'}/10
   - Location: ${deal.location || 'Not specified'}
   - Source: ${deal.source || 'Unknown'}
`).join('\n')}

**Popular Blog Posts This Week:**
${data.popularPosts.length > 0
  ? data.popularPosts.map(post => `- "${post.title}" (${post.view_count} views)`).join('\n')
  : '- No new blog posts this week'
}

**Instructions:**
1. Create a warm, personalized greeting using {{firstName}}
2. Write an engaging introduction about this week's market activity
3. Feature the top 3-5 deals with:
   - Exciting headlines for each deal
   - Why it's a great deal (savings %, below market value, etc.)
   - Key details (price, location, condition)
   - Call-to-action to view the listing
4. Add a "Market Pulse" section with:
   - Brief insights on price trends
   - Notable market movements
   - What to watch for next week
5. If there are popular blog posts, feature one with a teaser
6. Include a brief "Product Updates" section (you can make up 1-2 recent improvements)
7. Close with a friendly sign-off and call-to-action
8. Use markdown formatting (headers, lists, bold text)
9. Keep total length around 400-600 words
10. Tone: Helpful friend who found great deals (enthusiastic but not salesy)

**Format:** Return pure markdown without any preamble or meta-commentary.
    `.trim();
  }

  /**
   * Get system prompt for AI
   * @returns {string} - System prompt
   */
  getSystemPrompt() {
    return `You are an expert newsletter writer for The Hub, a premium market intelligence platform tracking deals on luxury watches, cars, sneakers, and sports memorabilia.

Your newsletters are:
- Engaging and data-driven
- Helpful without being pushy
- Professional yet friendly
- Focused on providing real value

Your subscribers are sophisticated buyers who appreciate quality insights and genuine deals. Write in a style that's enthusiastic about good deals but maintains credibility.`;
  }

  /**
   * Generate A/B test subject lines
   * @param {Object} data - Gathered data
   * @returns {Promise<Array<string>>} - Subject lines
   */
  async generateSubjectLines(data) {
    if (!openaiClient.isAvailable()) {
      // Return template subject lines
      return [
        `🔥 This Week's Top ${data.topDeals.length} Deals`,
        `Your Weekly Deal Alert - ${new Date(data.weekStart).toLocaleDateString()}`
      ];
    }

    try {
      const avgScore = data.topDeals.length > 0
        ? (data.topDeals.reduce((sum, d) => sum + (d.deal_score || 0), 0) / data.topDeals.length).toFixed(1)
        : 0;

      const response = await openaiClient.chat({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Generate 2 compelling email subject lines for A/B testing. Make them catchy, under 60 characters, use emojis strategically, and create urgency or curiosity. Return only the subject lines, one per line.'
          },
          {
            role: 'user',
            content: `Generate 2 subject lines for a newsletter featuring ${data.topDeals.length} top deals with an average deal score of ${avgScore}/10. New listings this week: ${data.stats.totalListings}.`
          }
        ],
        temperature: 0.9,
        max_tokens: 100
      });

      const content = response.choices[0].message.content;
      const lines = content
        .split('\n')
        .filter(l => l.trim().length > 0)
        .map(l => l.replace(/^\d+\.\s*/, '').trim()); // Remove numbering

      return lines.slice(0, 2);
    } catch (error) {
      console.error('Error generating subject lines:', error);
      return [
        `🔥 ${data.topDeals.length} Hot Deals This Week`,
        `Weekly Deal Alert - ${data.stats.totalListings} New Listings`
      ];
    }
  }

  /**
   * Generate template content (fallback when AI not available)
   * @param {Object} data - Gathered data
   * @returns {string} - Markdown content
   */
  generateTemplateContent(data) {
    const weekStartDate = new Date(data.weekStart).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });

    return `
# THE HUB WEEKLY

👋 Hey {{firstName}},

Welcome to your weekly roundup of the best deals and market insights from The Hub!

## 🔥 This Week's Top Deals

${data.topDeals.slice(0, 5).map((deal, i) => {
  const title = deal.title || `${deal.brand || ''} ${deal.model || ''}`.trim() || 'Great Deal';
  const savings = deal.deal_score ? `(Deal Score: ${deal.deal_score.toFixed(1)}/10)` : '';

  return `
### ${i + 1}. ${title}

💰 **$${deal.price?.toLocaleString() || 'N/A'}** ${savings}
📍 ${deal.location || 'Location not specified'}
🔗 [View Listing](${deal.url || '#'})

${deal.condition ? `Condition: ${deal.condition}` : ''}
`.trim();
}).join('\n\n')}

## 📊 Market Pulse

This week we tracked **${data.stats.totalListings} new listings** with an average price of **$${data.stats.avgPrice.toLocaleString()}**.

${data.popularPosts.length > 0 ? `
## 📝 Featured Reading

**${data.popularPosts[0].title}**

${data.popularPosts[0].excerpt || 'Check out our latest article for expert insights and buying tips.'}

[Read More →](${process.env.FRONTEND_URL}/blog/${data.popularPosts[0].slug})
` : ''}

## 🚀 What's New

- ✨ Improved deal scoring algorithm for more accurate recommendations
- 📊 Enhanced price tracking across all categories
- 🔔 Coming soon: Custom deal alerts based on your preferences

---

That's it for this week! Found a deal you love? Don't wait – the best ones go fast.

Happy hunting,
**The Hub Team**

[View All Deals](${process.env.FRONTEND_URL}) • [Update Preferences](${process.env.FRONTEND_URL}/newsletter/preferences)
    `.trim();
  }

  /**
   * Get sample data (fallback)
   * @returns {Object} - Sample data
   */
  getSampleData() {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - 7)).toISOString();
    const weekEnd = new Date().toISOString();

    return {
      weekStart,
      weekEnd,
      topDeals: [
        {
          title: 'Rolex Submariner 116610',
          brand: 'Rolex',
          model: 'Submariner',
          price: 7500,
          deal_score: 9.2,
          location: 'New York, NY',
          source: 'reddit',
          category: 'watches',
          url: 'https://example.com'
        },
        {
          title: 'Nike Air Jordan 1 Chicago',
          brand: 'Nike',
          model: 'Air Jordan 1',
          price: 280,
          deal_score: 8.8,
          location: 'Los Angeles, CA',
          source: 'ebay',
          category: 'sneakers',
          url: 'https://example.com'
        }
      ],
      stats: {
        totalListings: 147,
        avgPrice: 2450,
        weekStart,
        weekEnd
      },
      popularPosts: []
    };
  }

  /**
   * Get start of current week (Monday)
   * @returns {string} - ISO date string
   */
  getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }

  /**
   * Get end of current week (Sunday)
   * @returns {string} - ISO date string
   */
  getWeekEnd() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() + (7 - day); // Next Sunday
    const sunday = new Date(now.setDate(diff));
    sunday.setHours(23, 59, 59, 999);
    return sunday.toISOString();
  }
}

// Export singleton instance
module.exports = new NewsletterContentGenerator();
