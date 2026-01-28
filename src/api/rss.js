/**
 * RSS Feed Generation
 * Dynamic RSS feed for blog posts
 */

const blogQueries = require('../db/blogQueries');

class RSSGenerator {
  /**
   * Generate RSS feed
   * GET /rss.xml
   */
  async generateRSS(req, res) {
    try {
      const baseUrl = process.env.BASE_URL || 'https://thehub.com';
      const category = req.query.category; // Optional category filter

      // Get published blog posts
      const { posts } = await blogQueries.getPosts({
        status: 'published',
        category: category || undefined,
        limit: 50,
        sortBy: 'published_at',
        sortOrder: 'desc'
      });

      // Build RSS XML
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
      xml += '  <channel>\n';

      // Channel info
      xml += `    <title>The Hub Blog${category ? ` - ${this.capitalize(category)}` : ''}</title>\n`;
      xml += `    <link>${baseUrl}/blog</link>\n`;
      xml += `    <description>Market insights and investment strategies for luxury assets including watches, cars, and sneakers</description>\n`;
      xml += `    <language>en-us</language>\n`;
      xml += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
      xml += `    <atom:link href="${baseUrl}/rss.xml${category ? `?category=${category}` : ''}" rel="self" type="application/rss+xml" />\n`;

      // Add posts as items
      posts.forEach(post => {
        xml += this.buildRSSItem(baseUrl, post);
      });

      xml += '  </channel>\n';
      xml += '</rss>';

      // Set response headers
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('RSS generation error:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate RSS feed</error>');
    }
  }

  /**
   * Build a single RSS item
   */
  buildRSSItem(baseUrl, post) {
    const pubDate = new Date(post.published_at || post.created_at).toUTCString();
    const url = `${baseUrl}/blog/${post.slug}`;

    let item = '    <item>\n';
    item += `      <title>${this.escapeXml(post.title)}</title>\n`;
    item += `      <link>${this.escapeXml(url)}</link>\n`;
    item += `      <guid isPermaLink="true">${this.escapeXml(url)}</guid>\n`;
    item += `      <pubDate>${pubDate}</pubDate>\n`;

    if (post.excerpt) {
      item += `      <description>${this.escapeXml(post.excerpt)}</description>\n`;
    }

    if (post.category) {
      item += `      <category>${this.escapeXml(post.category)}</category>\n`;
    }

    if (post.author_name) {
      item += `      <author>${this.escapeXml(post.author_name)}</author>\n`;
    }

    // Add hero image as enclosure if available
    if (post.hero_image_url) {
      item += `      <enclosure url="${this.escapeXml(post.hero_image_url)}" type="image/jpeg" />\n`;
    }

    // Add tags as categories
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        item += `      <category>${this.escapeXml(tag)}</category>\n`;
      });
    }

    // Add custom elements
    if (post.read_time_minutes) {
      item += `      <readTime>${post.read_time_minutes} minutes</readTime>\n`;
    }

    if (post.ai_generated) {
      item += `      <aiGenerated>true</aiGenerated>\n`;
    }

    item += '    </item>\n';
    return item;
  }

  /**
   * Generate JSON Feed (modern alternative to RSS)
   * GET /feed.json
   */
  async generateJSONFeed(req, res) {
    try {
      const baseUrl = process.env.BASE_URL || 'https://thehub.com';
      const category = req.query.category;

      // Get published blog posts
      const { posts } = await blogQueries.getPosts({
        status: 'published',
        category: category || undefined,
        limit: 50,
        sortBy: 'published_at',
        sortOrder: 'desc'
      });

      const feed = {
        version: 'https://jsonfeed.org/version/1.1',
        title: `The Hub Blog${category ? ` - ${this.capitalize(category)}` : ''}`,
        home_page_url: `${baseUrl}/blog`,
        feed_url: `${baseUrl}/feed.json${category ? `?category=${category}` : ''}`,
        description: 'Market insights and investment strategies for luxury assets',
        language: 'en',
        items: posts.map(post => this.buildJSONFeedItem(baseUrl, post))
      };

      res.json(feed);
    } catch (error) {
      console.error('JSON Feed generation error:', error);
      res.status(500).json({ error: 'Failed to generate JSON feed' });
    }
  }

  /**
   * Build a single JSON Feed item
   */
  buildJSONFeedItem(baseUrl, post) {
    return {
      id: post.id,
      url: `${baseUrl}/blog/${post.slug}`,
      title: post.title,
      content_html: post.content || '',
      summary: post.excerpt || '',
      image: post.hero_image_url || null,
      date_published: post.published_at || post.created_at,
      date_modified: post.updated_at || null,
      author: {
        name: post.author_name || 'The Hub Team'
      },
      tags: post.tags || [],
      _custom: {
        category: post.category,
        read_time_minutes: post.read_time_minutes,
        view_count: post.view_count,
        ai_generated: post.ai_generated || false
      }
    };
  }

  /**
   * Escape XML special characters
   */
  escapeXml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Capitalize first letter
   */
  capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

module.exports = new RSSGenerator();
