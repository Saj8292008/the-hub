/**
 * Blog Server-Side Rendering (SSR)
 * Renders blog pages for search engine crawlers with full meta tags
 */

const blogQueries = require('../db/blogQueries');
const { marked } = require('marked');

class BlogSSR {
  /**
   * Render blog index page for crawlers
   * GET /blog
   */
  async renderBlogIndex(req, res) {
    try {
      const baseUrl = process.env.BASE_URL || 'https://thehub.com';

      // Get recent published posts
      const { posts } = await blogQueries.getPosts({
        status: 'published',
        limit: 12,
        sortBy: 'published_at',
        sortOrder: 'desc'
      });

      const html = this.buildBlogIndexHTML(baseUrl, posts);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Blog index SSR error:', error);
      res.status(500).send('<html><body><h1>Error loading blog</h1></body></html>');
    }
  }

  /**
   * Render individual blog post for crawlers
   * GET /blog/:slug
   */
  async renderBlogPost(req, res) {
    try {
      const { slug } = req.params;
      const baseUrl = process.env.BASE_URL || 'https://thehub.com';

      // Get post by slug
      const post = await blogQueries.getPostBySlug(slug);

      if (!post) {
        return res.status(404).send('<html><body><h1>Post not found</h1></body></html>');
      }

      const html = this.buildBlogPostHTML(baseUrl, post);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Blog post SSR error:', error);
      res.status(500).send('<html><body><h1>Error loading post</h1></body></html>');
    }
  }

  /**
   * Build HTML for blog index page
   */
  buildBlogIndexHTML(baseUrl, posts) {
    const postsHTML = posts.map(post => `
      <article>
        <h2><a href="${baseUrl}/blog/${post.slug}">${this.escapeHtml(post.title)}</a></h2>
        <p>${this.escapeHtml(post.excerpt || '')}</p>
        <p><small>Published: ${new Date(post.published_at || post.created_at).toLocaleDateString()}</small></p>
      </article>
    `).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Hub Blog - Market Insights & Investment Strategies</title>
  <meta name="description" content="Expert insights on luxury asset investing, including watches, cars, and sneakers. Stay updated with market trends and data-driven analysis.">

  <!-- Open Graph -->
  <meta property="og:title" content="The Hub Blog">
  <meta property="og:description" content="Expert insights on luxury asset investing">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${baseUrl}/blog">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="The Hub Blog">
  <meta name="twitter:description" content="Expert insights on luxury asset investing">

  <!-- Canonical -->
  <link rel="canonical" href="${baseUrl}/blog">

  <!-- RSS -->
  <link rel="alternate" type="application/rss+xml" title="The Hub Blog RSS" href="${baseUrl}/rss.xml">

  <!-- Schema.org -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "The Hub Blog",
    "description": "Expert insights on luxury asset investing",
    "url": "${baseUrl}/blog",
    "publisher": {
      "@type": "Organization",
      "name": "The Hub",
      "url": "${baseUrl}"
    }
  }
  </script>
</head>
<body>
  <header>
    <h1>The Hub Blog</h1>
    <p>Market Insights & Investment Strategies</p>
  </header>

  <main>
    ${postsHTML}
  </main>

  <footer>
    <p>&copy; 2025 The Hub. All rights reserved.</p>
  </footer>
</body>
</html>`;
  }

  /**
   * Build HTML for individual blog post
   */
  buildBlogPostHTML(baseUrl, post) {
    // Convert Markdown to HTML
    const contentHTML = marked(post.content || '');

    // Build JSON-LD structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.excerpt || '',
      "image": post.hero_image_url || `${baseUrl}/images/default-blog.jpg`,
      "datePublished": post.published_at || post.created_at,
      "dateModified": post.updated_at || post.published_at || post.created_at,
      "author": {
        "@type": "Person",
        "name": post.author_name || "The Hub Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "The Hub",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo.png`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${baseUrl}/blog/${post.slug}`
      },
      "wordCount": post.content ? post.content.split(/\s+/).length : 0,
      "keywords": post.keywords ? post.keywords.join(', ') : '',
      "articleSection": post.category || 'General',
      "inLanguage": "en-US"
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(post.meta_title || post.title)}</title>
  <meta name="description" content="${this.escapeHtml(post.meta_description || post.excerpt || '')}">
  ${post.keywords && post.keywords.length ? `<meta name="keywords" content="${this.escapeHtml(post.keywords.join(', '))}">` : ''}

  <!-- Open Graph -->
  <meta property="og:title" content="${this.escapeHtml(post.title)}">
  <meta property="og:description" content="${this.escapeHtml(post.excerpt || '')}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${baseUrl}/blog/${post.slug}">
  ${post.hero_image_url ? `<meta property="og:image" content="${post.hero_image_url}">` : ''}
  <meta property="article:published_time" content="${post.published_at || post.created_at}">
  ${post.updated_at ? `<meta property="article:modified_time" content="${post.updated_at}">` : ''}
  <meta property="article:section" content="${post.category || 'General'}">
  ${post.tags ? post.tags.map(tag => `<meta property="article:tag" content="${this.escapeHtml(tag)}">`).join('\n  ') : ''}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${this.escapeHtml(post.title)}">
  <meta name="twitter:description" content="${this.escapeHtml(post.excerpt || '')}">
  ${post.hero_image_url ? `<meta name="twitter:image" content="${post.hero_image_url}">` : ''}

  <!-- Canonical -->
  <link rel="canonical" href="${baseUrl}/blog/${post.slug}">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  ${JSON.stringify(structuredData, null, 2)}
  </script>
</head>
<body>
  <article>
    <header>
      ${post.hero_image_url ? `<img src="${post.hero_image_url}" alt="${this.escapeHtml(post.title)}">` : ''}
      <h1>${this.escapeHtml(post.title)}</h1>
      ${post.excerpt ? `<p class="excerpt">${this.escapeHtml(post.excerpt)}</p>` : ''}
      <p class="meta">
        <time datetime="${post.published_at || post.created_at}">
          ${new Date(post.published_at || post.created_at).toLocaleDateString()}
        </time>
        ${post.author_name ? `by ${this.escapeHtml(post.author_name)}` : ''}
        ${post.read_time_minutes ? `• ${post.read_time_minutes} min read` : ''}
      </p>
    </header>

    <div class="content">
      ${contentHTML}
    </div>

    ${post.tags && post.tags.length ? `
      <footer>
        <p>Tags: ${post.tags.map(tag => `<span>${this.escapeHtml(tag)}</span>`).join(', ')}</p>
      </footer>
    ` : ''}
  </article>

  <footer>
    <p>&copy; 2025 The Hub. All rights reserved.</p>
    <p><a href="${baseUrl}/blog">Back to Blog</a></p>
  </footer>
</body>
</html>`;
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

module.exports = new BlogSSR();
