/**
 * Sitemap Generation
 * Dynamic sitemap.xml for SEO
 */

const blogQueries = require('../db/blogQueries');

class SitemapGenerator {
  /**
   * Generate sitemap.xml
   * GET /sitemap.xml
   */
  async generateSitemap(req, res) {
    try {
      const baseUrl = process.env.BASE_URL || 'https://thehub.com';

      // Get all published blog posts
      const { posts } = await blogQueries.getPosts({
        status: 'published',
        limit: 1000,
        sortBy: 'published_at',
        sortOrder: 'desc'
      });

      // Build XML
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Homepage
      xml += this.buildUrlEntry(baseUrl, new Date().toISOString(), 'daily', '1.0');

      // Main category pages
      const categories = ['watches', 'cars', 'sneakers', 'sports', 'blog'];
      categories.forEach(category => {
        xml += this.buildUrlEntry(
          `${baseUrl}/${category}`,
          new Date().toISOString(),
          'daily',
          '0.9'
        );
      });

      // Blog posts
      posts.forEach(post => {
        const lastmod = post.updated_at || post.published_at || post.created_at;
        xml += this.buildUrlEntry(
          `${baseUrl}/blog/${post.slug}`,
          lastmod,
          'weekly',
          '0.8'
        );
      });

      xml += '</urlset>';

      // Set response headers
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
    }
  }

  /**
   * Build a single URL entry for sitemap
   */
  buildUrlEntry(url, lastmod, changefreq, priority) {
    return `  <url>
    <loc>${this.escapeXml(url)}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
  }

  /**
   * Escape XML special characters
   */
  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate robots.txt
   * GET /robots.txt
   */
  async generateRobotsTxt(req, res) {
    const baseUrl = process.env.BASE_URL || 'https://thehub.com';

    const robotsTxt = `# The Hub - Luxury Asset Tracker
User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 1

# Disallow admin pages
Disallow: /api/
Disallow: /admin/
`;

    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  }
}

module.exports = new SitemapGenerator();
