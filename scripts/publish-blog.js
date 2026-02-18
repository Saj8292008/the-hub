#!/usr/bin/env node
/**
 * publish-blog.js — Convert markdown blog posts to HTML and publish
 * 
 * Takes a markdown file from content/blog/, converts it to HTML,
 * adds it to public/blog/, updates the blog index, and generates
 * a sitemap entry.
 * 
 * Usage:
 *   node scripts/publish-blog.js <filename>
 *   node scripts/publish-blog.js --all
 *   node scripts/publish-blog.js --rebuild
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'blog');
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'blog');
const SITE_URL = 'https://thehubdeals.com';

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  console.log('📁 Created public/blog/ directory');
}

function parseMarkdownFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    throw new Error('No frontmatter found');
  }

  const [, frontmatterText, markdown] = match;
  const frontmatter = {};
  
  frontmatterText.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      frontmatter[key.trim()] = value;
    }
  });

  return {
    frontmatter,
    markdown: markdown.trim(),
    html: marked(markdown)
  };
}

function generateHTML(post, slug) {
  const { frontmatter, html } = post;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${frontmatter.title} | The Hub Deals</title>
  <meta name="description" content="${frontmatter.description}">
  <meta name="keywords" content="${frontmatter.keywords}">
  <link rel="canonical" href="${SITE_URL}/blog/${slug}.html">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { font-size: 2.5em; color: #111; margin: 20px 0; }
    article { font-size: 1.1em; }
    article h2 { margin-top: 30px; margin-bottom: 15px; }
    article p { margin-bottom: 20px; }
    article a { color: #2563eb; text-decoration: none; }
    .cta { margin-top: 40px; padding: 30px; background: #f0f9ff; border-radius: 8px; text-align: center; }
    .cta a { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${frontmatter.title}</h1>
    <article>${html}</article>
    <div class="cta">
      <h3>🔥 Never Miss a Deal</h3>
      <p>Get instant alerts for your favorite brands and models.</p>
      <a href="${SITE_URL}/signup">Sign Up for Free Alerts</a>
    </div>
  </div>
</body>
</html>`;
}

async function publishPost(filename) {
  const filepath = path.join(CONTENT_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  console.log(`📄 Publishing: ${filename}`);
  
  const post = parseMarkdownFile(filepath);
  const slug = filename.replace('.md', '');
  const html = generateHTML(post, slug);
  const outputPath = path.join(PUBLIC_DIR, `${slug}.html`);
  
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✅ Published to: ${outputPath}`);
  
  return { slug, outputPath };
}

function updateBlogIndex() {
  console.log('📋 Updating blog index...');
  
  const posts = [];
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.md'))
    .sort((a, b) => b.localeCompare(a));

  files.forEach(file => {
    try {
      const filepath = path.join(CONTENT_DIR, file);
      const { frontmatter } = parseMarkdownFile(filepath);
      const slug = file.replace('.md', '');
      
      posts.push({
        title: frontmatter.title,
        description: frontmatter.description,
        date: frontmatter.date,
        slug,
        url: `${SITE_URL}/blog/${slug}.html`
      });
    } catch (error) {
      console.warn(`⚠️  Could not parse ${file}`);
    }
  });

  const postsList = posts.map(post => `
    <div class="post-card">
      <h2><a href="${post.slug}.html">${post.title}</a></h2>
      <p>${post.description}</p>
      <a href="${post.slug}.html">Read More →</a>
    </div>
  `).join('\n');

  const indexHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Blog | The Hub Deals</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    .post-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .post-card h2 a { color: #111; text-decoration: none; }
  </style>
</head>
<body>
  <h1>The Hub Deals Blog</h1>
  ${postsList}
</body>
</html>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), indexHTML);
  console.log(`✅ Blog index updated with ${posts.length} posts`);
  
  return posts;
}

async function main() {
  console.log('🚀 Blog Publisher starting...\n');

  const args = process.argv.slice(2);

  if (args.includes('--rebuild') || args.includes('--all')) {
    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      try {
        await publishPost(file);
      } catch (error) {
        console.error(`❌ Error: ${error.message}`);
      }
    }
    
    updateBlogIndex();
    console.log('\n✨ All posts published!');
    return;
  }

  const filename = args[0];
  if (!filename) {
    console.error('❌ Usage: node scripts/publish-blog.js <filename>');
    process.exit(1);
  }

  await publishPost(filename);
  updateBlogIndex();
  
  console.log('\n✨ Done!');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { publishPost, updateBlogIndex };
