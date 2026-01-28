# The Hub - Onboarding Checklist

Complete this checklist to get The Hub up and running. Check off items as you complete them.

---

## 📋 Pre-Setup (5 minutes)

- [ ] Node.js 18+ installed ([Download](https://nodejs.org))
- [ ] Git installed ([Download](https://git-scm.com))
- [ ] Text editor ready (VS Code, Sublime, etc.)
- [ ] Terminal/command line open

---

## 🔑 Get API Credentials (10 minutes)

### OpenAI API Key

- [ ] Go to [OpenAI Platform](https://platform.openai.com/signup)
- [ ] Create account or log in
- [ ] Add payment method (Settings → Billing)
- [ ] Go to [API Keys](https://platform.openai.com/account/api-keys)
- [ ] Click "Create new secret key"
- [ ] Copy key (starts with `sk-`)
- [ ] Save key securely (you won't see it again)

**Monthly cost:** ~$20-50 for moderate usage

### Supabase Credentials

- [ ] Go to [Supabase](https://supabase.com)
- [ ] Create account or log in
- [ ] Click "New Project"
- [ ] Enter project name: `the-hub`
- [ ] Create strong database password
- [ ] Choose region closest to you
- [ ] Wait for project to provision (~2 minutes)
- [ ] Go to Settings → API
- [ ] Copy **Project URL** (https://xxxxx.supabase.co)
- [ ] Copy **anon/public** key
- [ ] Copy **service_role** key (keep secret!)

**Cost:** Free tier is sufficient for development

---

## 🚀 Quick Setup (10 minutes)

### Option A: Automated Setup (Recommended)

- [ ] Clone or download the project
- [ ] Open terminal in project directory
- [ ] Run: `npm run setup`
- [ ] Follow the interactive wizard
- [ ] Enter API credentials when prompted
- [ ] Wait for blog posts to generate (~15 min)

### Option B: Manual Setup

#### 1. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd the-hub
npm install
cd ..
```

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed

#### 2. Configure Credentials

```bash
npm run setup:credentials
```

Or manually create `.env`:

```bash
NODE_ENV=development
PORT=3000
OPENAI_API_KEY=sk-your-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] `.env` file created
- [ ] OpenAI API key added
- [ ] Supabase credentials added

Create `the-hub/.env`:

```bash
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] Frontend `.env` created

#### 3. Set Up Database

**With Supabase CLI (Recommended):**

```bash
# Install CLI
brew install supabase/tap/supabase  # macOS
# or
npm install -g supabase             # Linux/WSL

# Run database setup
npm run setup:database
```

- [ ] Supabase CLI installed
- [ ] Project linked
- [ ] Database schema applied

**Without CLI:**

- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Open `database/blog_schema.sql`
- [ ] Copy all contents
- [ ] Paste in SQL Editor
- [ ] Click "Run"
- [ ] Verify tables created (Database → Tables)

#### 4. Verify Installation

```bash
npm run verify
```

- [ ] All checks passed
- [ ] No critical errors

---

## 🎨 Generate Content (15 minutes)

```bash
npm run generate:blog
```

This generates 20 SEO-optimized blog posts.

- [ ] Blog generation started
- [ ] All 20 posts generated successfully
- [ ] No errors during generation

**Cost:** ~$2 in OpenAI credits

---

## 🧪 Test Everything (5 minutes)

```bash
# Quick verification
npm run verify

# Full test suite (optional)
npm test
```

- [ ] Verification passed
- [ ] Tests passed (if run)

---

## 🚀 Start Development (2 minutes)

### Open Two Terminal Windows

**Terminal 1 - Backend:**
```bash
npm run dev
```

- [ ] Backend started
- [ ] Server running on http://localhost:3000
- [ ] No errors in console

**Terminal 2 - Frontend:**
```bash
cd the-hub
npm run dev
```

- [ ] Frontend started
- [ ] App running on http://localhost:5173
- [ ] No errors in console

---

## ✅ Verify Everything Works

### Frontend

Visit [http://localhost:5173](http://localhost:5173)

- [ ] Homepage loads
- [ ] No console errors
- [ ] Images load
- [ ] Navigation works

### Blog Platform

Visit [http://localhost:5173/blog](http://localhost:5173/blog)

- [ ] Blog index loads
- [ ] 20 blog posts visible
- [ ] Can click and read post
- [ ] Table of contents works
- [ ] Related posts shown

Click "Subscribe" and enter email:

- [ ] Newsletter subscription works
- [ ] Success message shown

### Admin Panel

Visit [http://localhost:5173/admin](http://localhost:5173/admin)

- [ ] Admin dashboard loads
- [ ] Deal Scoring tab works
- [ ] Performance tab shows metrics
- [ ] No errors

### AI Features

Visit [http://localhost:5173/watches](http://localhost:5173/watches)

Try natural language search:
- Enter: "rolex submariner under 10000"
- Click AI Search

- [ ] Search works
- [ ] Interpreted filters shown
- [ ] Results displayed
- [ ] No errors

### Backend API

Open browser to [http://localhost:3000/health](http://localhost:3000/health)

- [ ] Returns `{"status": "ok"}`

Try API endpoint:
[http://localhost:3000/api/blog/posts](http://localhost:3000/api/blog/posts)

- [ ] Returns list of blog posts
- [ ] JSON format correct

---

## 🎓 Learn the System (30 minutes)

### Explore Documentation

- [ ] Read [QUICK_START.md](./QUICK_START.md) (5 min)
- [ ] Skim [README.md](./README.md) (10 min)
- [ ] Bookmark [COMMANDS.md](./COMMANDS.md) for reference
- [ ] Review [Testing Guide](./TESTING_GUIDE.md) (optional)

### Try Key Features

#### Create Blog Post Manually

1. Go to http://localhost:5173/blog/admin
2. Click "Create New Post"
3. Fill in title, content, category
4. Click "Publish"

- [ ] Created blog post manually

#### Generate Blog Post with AI

1. Go to http://localhost:5173/blog/editor/new
2. Click "Generate with AI"
3. Enter topic: "Best Watches Under $5000"
4. Select category: "watches"
5. Click "Generate"
6. Review and publish

- [ ] Generated blog post with AI

#### Test Deal Scoring

1. Go to http://localhost:5173/admin
2. Select "Deal Scoring" tab
3. Click "Run Scoring Now"
4. Wait for completion

- [ ] Deal scoring works

#### Monitor Performance

1. Go to http://localhost:5173/admin
2. Select "Performance" tab
3. Review metrics

- [ ] Performance monitoring works

---

## 🔧 Optional Enhancements

### Add Google Analytics

- [ ] Create GA4 property
- [ ] Add measurement ID to `the-hub/.env`:
      `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX`

### Set Up Error Tracking

- [ ] Sign up for [Sentry](https://sentry.io)
- [ ] Create project
- [ ] Add DSN to `.env`: `SENTRY_DSN=https://...`

### Configure Custom Domain (Production)

- [ ] Purchase domain
- [ ] Configure DNS
- [ ] Set up SSL

---

## 🚀 Ready for Production?

Before deploying, complete:

- [ ] Run security audit: `npm run audit:security`
- [ ] Run performance test: `npm run audit:performance`
- [ ] All tests passing: `npm test`
- [ ] Documentation reviewed: `FINAL_DEPLOYMENT_GUIDE.md`
- [ ] Backup plan ready
- [ ] Monitoring configured

Then deploy:

```bash
npm run deploy
```

Or follow [FINAL_DEPLOYMENT_GUIDE.md](./FINAL_DEPLOYMENT_GUIDE.md)

---

## ✨ You're All Set!

### What You've Built

✅ AI-powered blog platform with 20 posts
✅ SEO-optimized with server-side rendering
✅ Deal scoring system
✅ Natural language search
✅ Performance monitoring
✅ Complete admin panel

### Next Steps

1. **Generate more content** - Run blog generator regularly
2. **Monitor performance** - Check /admin dashboard daily
3. **Customize design** - Match your brand
4. **Deploy to production** - Go live!
5. **Submit sitemap** - To Google Search Console
6. **Build backlinks** - Improve SEO

### Get Help

- 📖 [Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/yourusername/the-hub/issues)
- 💬 Check documentation first
- 📚 Review [COMMANDS.md](./COMMANDS.md) for common tasks

---

## 🎯 Success Metrics

Track these after deployment:

**Week 1:**
- [ ] All services running without errors
- [ ] No critical security issues
- [ ] Response times < 200ms

**Month 1:**
- [ ] 10+ pages indexed by Google
- [ ] 100+ organic visitors
- [ ] 10+ email subscribers

**Month 3:**
- [ ] 50+ pages indexed
- [ ] 1000+ organic visitors
- [ ] Top 20 for target keywords
- [ ] 100+ email subscribers

---

**Congratulations! 🎉**

You've successfully set up The Hub. Happy building!

---

**Need help?** Review the documentation in the `docs/` folder or check [COMMANDS.md](./COMMANDS.md) for quick reference.
