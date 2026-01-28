# The Hub - Quick Start Guide

Get your blog platform and AI features running in 5 minutes!

---

## Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Supabase account ([Sign up here](https://supabase.com))

---

## Step 1: Configure Environment Variables

### Backend (root `.env`)

Create `/Users/sydneyjackson/the-hub/.env`:

```bash
# OpenAI API
OPENAI_API_KEY=sk-proj-your-key-here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

# App Config
BASE_URL=http://localhost:5173
NODE_ENV=development

# Schedulers (optional)
ENABLE_SCRAPER_SCHEDULER=false
ENABLE_DEAL_SCORING_SCHEDULER=true
DEAL_SCORING_INTERVAL_MINUTES=60
```

### Frontend (the-hub `.env`)

Create `/Users/sydneyjackson/the-hub/the-hub/.env`:

```bash
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 2: Install Dependencies

```bash
# From project root
npm install

# Frontend
cd the-hub
npm install
cd ..
```

---

## Step 3: Set Up Database

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run the schema:

```bash
# Copy the schema file contents
cat database/blog_schema.sql

# Or use Supabase CLI
supabase db push
```

---

## Step 4: Start Servers

**Terminal 1 - Backend:**
```bash
npm start
```

Wait for:
```
✅ API Server is running on port 3000
📊 Dashboard API: http://localhost:3000
🔌 WebSocket server ready
🚀 Starting deal scoring scheduler
```

**Terminal 2 - Frontend:**
```bash
cd the-hub
npm run dev
```

Wait for:
```
VITE v5.0.0 ready in 500 ms
➜  Local: http://localhost:5173/
```

---

## Step 5: Verify Everything Works

### Test Backend API

```bash
# Health check
curl http://localhost:3000/health
# Expected: {"status":"OK","timestamp":"..."}

# Blog posts
curl http://localhost:3000/api/blog/posts
# Expected: {"posts":[],"pagination":{...}}
```

### Test Frontend

1. Open browser: `http://localhost:5173`
2. Navigate to `/blog` - should see empty blog index
3. Navigate to `/blog/admin` - should see admin dashboard
4. Navigate to `/admin` - should see admin settings

---

## Step 6: Generate Your First Blog Post

### Option A: Via UI (Recommended)

1. Go to `http://localhost:5173/blog/editor/new`
2. Click "AI Generate" button
3. Fill in modal:
   - **Topic:** "Best Rolex Watches Under $10,000 in 2025"
   - **Category:** Watches
   - **Keywords:** rolex, submariner, investment
   - **Tone:** Authoritative
   - **Length:** Medium
4. Click "Generate Post" (takes 15-30 seconds)
5. Review content
6. Click "Publish"
7. View at `http://localhost:5173/blog`

### Option B: Generate 20 Posts at Once

```bash
# From project root
./scripts/runBlogGeneration.sh

# Follow prompts:
# - Confirm generation (y)
# - Wait 10-15 minutes
# - View posts at http://localhost:5173/blog
```

**Note:** This costs ~$2.00 in OpenAI API calls

---

## Step 7: Test AI Features

### Natural Language Search

1. Go to `http://localhost:5173/watches`
2. Ensure "AI" button is purple (active)
3. Type: "rolex submariner under 10k"
4. Press Enter
5. See interpreted filters displayed

**Note:** Requires watch listings in your database to see results

### Deal Scoring

1. Go to `http://localhost:5173/admin`
2. Click "Deal Scoring" tab
3. View scheduler status
4. Click "Run Now" to score all listings

**Note:** Requires listings in your database

---

## Common Issues & Solutions

### "OpenAI client not available"

**Problem:** Missing or invalid API key

**Solution:**
1. Check `.env` has `OPENAI_API_KEY=sk-...`
2. Verify key is valid at https://platform.openai.com/api-keys
3. Restart backend: `Ctrl+C` then `npm start`

### "Supabase not available"

**Problem:** Missing Supabase credentials

**Solution:**
1. Check both `.env` files have Supabase URLs and keys
2. Verify credentials at https://supabase.com
3. Run database schema if not done: `cat database/blog_schema.sql`
4. Restart servers

### Blog admin redirects to blog index

**Problem:** Not authenticated

**Solution:**
1. Sign up for Supabase auth: `http://localhost:5173/blog/admin`
2. Or configure auth in Supabase dashboard
3. Use email/password from Supabase Auth users table

### AI generation fails

**Problem:** OpenAI rate limit or insufficient credits

**Solution:**
1. Check OpenAI dashboard: https://platform.openai.com/usage
2. Add billing info if needed
3. Wait if rate limited (resets every minute)
4. Try generating shorter content ("short" length)

### Deal scoring not running

**Problem:** Scheduler disabled or no listings

**Solution:**
1. Check `ENABLE_DEAL_SCORING_SCHEDULER=true` in `.env`
2. Add test watch listings to database
3. Restart backend
4. View status at `http://localhost:5173/admin`

---

## Next Steps

### 1. Generate Content

```bash
# Generate 20 blog posts
./scripts/runBlogGeneration.sh

# Or generate manually via UI
# Go to /blog/editor/new and use AI Generate
```

### 2. Test All Features

Follow the comprehensive [Testing Guide](./TESTING_GUIDE.md):
- Blog CRUD operations
- AI generation
- Natural language search
- Deal scoring
- SEO (sitemap, RSS, meta tags)

### 3. Customize

**Brand Colors:**
Edit `/the-hub/tailwind.config.js` to customize colors

**Blog Categories:**
Add/remove categories in `/src/types/blog.ts`

**Scoring Weights:**
Adjust in `/src/services/ai/dealScorer.js`

**Generation Prompts:**
Fine-tune in `/src/services/openai/blogGenerator.js`

### 4. Deploy

1. Configure production environment variables
2. Build frontend: `cd the-hub && npm run build`
3. Deploy backend to hosting (Heroku, Railway, Render)
4. Deploy frontend to CDN (Vercel, Netlify, Cloudflare)
5. Submit sitemap to Google Search Console

See [Testing Guide - Deployment Checklist](./TESTING_GUIDE.md#deployment-checklist) for details.

---

## Quick Reference

### URLs

| Feature | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3000 |
| **Blog Index** | http://localhost:5173/blog |
| **Blog Admin** | http://localhost:5173/blog/admin |
| **Blog Editor** | http://localhost:5173/blog/editor/new |
| **Admin Settings** | http://localhost:5173/admin |
| **API Health** | http://localhost:3000/health |
| **Sitemap** | http://localhost:3000/sitemap.xml |
| **RSS Feed** | http://localhost:3000/rss.xml |

### Key Files

| File | Purpose |
|------|---------|
| `.env` | Backend configuration |
| `the-hub/.env` | Frontend configuration |
| `database/blog_schema.sql` | Database schema |
| `scripts/generateBlogPosts.js` | Bulk generation script |
| `TESTING_GUIDE.md` | Comprehensive testing |
| `AI_FEATURES_README.md` | Feature documentation |

### Commands

```bash
# Start backend
npm start

# Start frontend
cd the-hub && npm run dev

# Generate 20 blog posts
./scripts/runBlogGeneration.sh

# Build frontend for production
cd the-hub && npm run build

# Run tests (if configured)
npm test
```

---

## Support

**Documentation:**
- [Testing Guide](./TESTING_GUIDE.md) - Comprehensive testing procedures
- [AI Features Documentation](./AI_FEATURES_README.md) - Feature reference
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Project overview

**Get Help:**
- Check server logs for errors
- Review `.env` configuration
- Verify database schema is applied
- Check OpenAI API credits

---

## Success Checklist

After completing this guide, you should have:

- ✅ Backend running on port 3000
- ✅ Frontend running on port 5173
- ✅ Database schema applied
- ✅ At least 1 blog post created
- ✅ AI generation working
- ✅ Deal scoring scheduler running
- ✅ Natural language search functional
- ✅ Sitemap accessible at /sitemap.xml
- ✅ RSS feed accessible at /rss.xml

If any checkboxes are unchecked, review the relevant section above or check the troubleshooting guide.

---

**You're ready to go! 🚀**

For detailed feature documentation, see [AI_FEATURES_README.md](./AI_FEATURES_README.md)

For comprehensive testing, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)

For deployment, see the deployment section in [TESTING_GUIDE.md](./TESTING_GUIDE.md#deployment-checklist)

---

**Version:** 1.0.0
**Last Updated:** January 24, 2025
