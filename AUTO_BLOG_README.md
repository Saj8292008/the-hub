# Auto-SEO Blog Writer Skill

**Automated blog post generation for The Hub Deals**

## 🚀 Quick Start

```bash
# Generate a blog post
node scripts/auto-blog-writer.js

# Publish it
node scripts/publish-blog.js <filename>

# Or do both in one go
./scripts/cron-blog-writer.sh
```

## 📁 Files Created

- `scripts/auto-blog-writer.js` - AI blog post generator (OpenRouter GPT-4o-mini)
- `scripts/publish-blog.js` - Markdown → HTML publisher
- `scripts/cron-blog-writer.sh` - Cron-ready wrapper
- `content/blog/` - Generated markdown files
- `public/blog/` - Published HTML files + blog index

## 🧠 How It Works

1. **Queries Supabase** for trending deals from last 7 days
2. **Analyzes brands/models** to pick a trending topic
3. **Generates blog post** using OpenRouter AI (GPT-4o-mini)
4. **Outputs markdown** with SEO metadata to `content/blog/`
5. **Converts to HTML** with responsive template
6. **Updates blog index** and sitemap

## 📝 Topic Types (Rotates)

- **Brand Focus:** "Best [Brand] Deals This Week"
- **Price Guide:** "Price Guide: [Model]"
- **Worth Analysis:** "Is [Watch] Worth It in 2026?"

## ⏰ Schedule with Cron

Run daily at 3 AM:
```bash
crontab -e
# Add:
0 3 * * * cd /Users/sydneyjackson/the-hub && ./scripts/cron-blog-writer.sh
```

## 🔑 Environment Variables

Required in `.env`:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 📊 Database Schema

Uses `watch_listings` table:
- `title`, `brand`, `model`, `price`
- `deal_score` (for ranking)
- `scraped_at` (for time filtering)
- `source`, `condition`, `url`

## ✨ Features

✅ SEO-optimized metadata (title, description, keywords)  
✅ Responsive HTML templates  
✅ Internal linking to deal pages  
✅ Blog index page auto-generated  
✅ Sitemap.xml for search engines  
✅ Cron-ready for automation  
✅ Cost: ~$0.001 per post (GPT-4o-mini)  

## 🧪 Testing

```bash
# Test generation
node scripts/auto-blog-writer.js --topic=brand

# Check output
ls -la content/blog/
cat content/blog/2026-02-18-*.md

# Test publishing
LATEST=$(ls -t content/blog/*.md | head -n 1 | xargs basename)
node scripts/publish-blog.js "$LATEST"

# View HTML
open public/blog/index.html
```

## 🐛 Troubleshooting

**"OpenRouter API error"**
- Check `OPENROUTER_API_KEY` in `.env`
- Verify API key has credits: https://openrouter.ai/account

**"No deals found"**
- Check `watch_listings` table has recent data
- Run scrapers: `npm run scrape`

**"Cron not running"**
- Verify cron entry: `crontab -l`
- Check logs: `tail logs/blog-cron-*.log`

## 🚢 Deployment

Blog outputs to `public/blog/` — deploy as static files:

```bash
# With your existing web server
# Serve public/blog/ at /blog/ route

# Or standalone
netlify deploy --dir=public/blog --prod
```

## 💰 Cost Estimate

- **OpenRouter (GPT-4o-mini):** ~$0.001 per post
- **Supabase:** Free tier sufficient
- **Monthly cost:** ~$0.03 (if daily posts)

## 📚 Related

- Supabase client: `src/db/supabase.js`
- Deal scoring: `src/services/deal-scorer.js`
- Scrapers: `src/services/scraping/`

---

**Status:** ✅ Ready for production  
**Created:** 2026-02-18  
**Branch:** `feature/auto-blog`
