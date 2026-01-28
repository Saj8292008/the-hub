# API Credentials Setup Guide

This guide will help you set up the required API credentials for The Hub platform.

---

## Required Services

The Hub requires three main services:
1. **OpenAI** - For AI-powered blog generation and natural language search
2. **Supabase** - For database and authentication
3. **(Optional) Analytics** - Google Analytics, Sentry, etc.

---

## 1. OpenAI Setup

OpenAI powers the AI blog generation and natural language search features.

### Step 1: Create OpenAI Account

1. Go to https://platform.openai.com/signup
2. Sign up for an account
3. Add a payment method at https://platform.openai.com/account/billing

### Step 2: Generate API Key

1. Go to https://platform.openai.com/account/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. **Important**: Save this key securely - you won't be able to see it again

### Step 3: Set Usage Limits (Recommended)

1. Go to https://platform.openai.com/account/limits
2. Set monthly budget limit (recommended: $50-100 for moderate usage)
3. Enable email notifications for usage alerts

### Step 4: Add to .env File

Open `/Users/sydneyjackson/the-hub/.env` and replace:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

With your actual key:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Estimated Costs

**Blog Generation (GPT-4 Turbo)**:
- ~$0.10 per blog post
- 20 posts = ~$2.00
- Monthly (50 posts) = ~$5.00

**Natural Language Search (GPT-3.5 Turbo)**:
- ~$0.005 per query
- 1000 queries = ~$5.00

**Deal Scoring (Optional AI)**:
- ~$0.01 per listing (if using AI for rarity)
- 1000 listings = ~$10.00

**Total estimated**: $13-42/month depending on usage

---

## 2. Supabase Setup

Supabase provides the PostgreSQL database and authentication system.

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up for free account
3. Click "New Project"
4. Fill in project details:
   - Name: the-hub (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Choose closest to your users
   - Plan: Free tier is sufficient for development

### Step 2: Get API Credentials

Once your project is created:

1. Go to Project Settings (gear icon) → API
2. Copy the following:
   - **Project URL** (looks like: https://xxxxxxxxxxxxx.supabase.co)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

### Step 3: Set Up Database Schema

1. In Supabase dashboard, go to SQL Editor
2. Copy the contents of `/database/blog_schema.sql`
3. Paste into SQL Editor
4. Click "Run" to create all tables and indexes

### Step 4: Enable Row Level Security

The schema already includes RLS policies, but verify:

1. Go to Authentication → Policies
2. Ensure policies are enabled for all tables
3. Test by trying to insert/query data

### Step 5: Add to .env Files

**Backend** (`.env`):
```bash
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Frontend** (`the-hub/.env` or `the-hub/.env.production`):
```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Never commit `.env` files to git! They're already in `.gitignore`.

### Supabase Free Tier Limits

- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth per month
- 50,000 monthly active users
- Pauses after 7 days of inactivity (Pro plan required for always-on)

For production, consider upgrading to Pro ($25/month) for:
- Always-on database
- Daily backups
- 8 GB database space
- 100 GB bandwidth

---

## 3. Create Admin User

After Supabase is configured, create an admin user for blog management:

### Option A: Through Supabase Dashboard

1. Go to Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Click "Create User"

### Option B: Through Application

1. Start the application: `npm run dev`
2. Go to login page
3. Use Supabase Auth signup flow

### Grant Admin Permissions

1. In Supabase SQL Editor, run:

```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-admin-email@example.com';
```

---

## 4. Optional Services

### Google Analytics

1. Create GA4 property at https://analytics.google.com
2. Get Measurement ID (looks like `G-XXXXXXXXXX`)
3. Add to frontend `.env`:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Sentry (Error Tracking)

1. Create account at https://sentry.io
2. Create new project
3. Get DSN from project settings
4. Add to `.env`:

```bash
SENTRY_DSN=https://xxxxxxxxxxxxx@sentry.io/xxxxx
```

### Uptime Monitoring

Consider setting up:
- UptimeRobot (https://uptimerobot.com) - Free for 50 monitors
- Better Uptime (https://betteruptime.com) - Free tier available

---

## 5. Environment File Templates

### Backend `.env`

```bash
# Server
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:5173

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Deal Scoring Scheduler
ENABLE_DEAL_SCORING_SCHEDULER=true
DEAL_SCORING_INTERVAL_MINUTES=60

# Optional: Error Tracking
SENTRY_DSN=https://xxxxxxxxxxxxx@sentry.io/xxxxx
```

### Frontend `.env`

```bash
# API
VITE_API_URL=http://localhost:3000

# Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 6. Verification Steps

After setting up all credentials:

### Test OpenAI Connection

```bash
cd /Users/sydneyjackson/the-hub
node -e "require('dotenv').config(); const client = require('./src/services/openai/client'); console.log('OpenAI available:', client.isAvailable());"
```

Expected output: `OpenAI available: true`

### Test Supabase Connection

```bash
cd /Users/sydneyjackson/the-hub
node -e "require('dotenv').config(); const supabase = require('./src/db/supabase'); console.log('Supabase available:', supabase.isAvailable());"
```

Expected output: `Supabase available: true`

### Test Full System

```bash
# Start backend
npm run dev

# In another terminal, start frontend
cd the-hub
npm run dev

# Visit http://localhost:5173
# Try creating a blog post with AI generation
```

---

## 7. Security Best Practices

### Never Commit Secrets

Ensure `.env` files are in `.gitignore`:

```bash
# Check .gitignore
cat .gitignore | grep .env
```

### Use Different Keys for Production

- Development: Use test/development API keys
- Production: Use separate production keys with stricter limits

### Rotate Keys Regularly

- OpenAI: Rotate every 90 days
- Supabase: Rotate service role key quarterly
- Enable key rotation in Supabase settings

### Monitor Usage

- Set up billing alerts in OpenAI
- Monitor Supabase usage dashboard
- Track API costs weekly

### Secure Service Role Key

The Supabase service role key bypasses RLS - never expose it:
- Only use on backend
- Never commit to git
- Never expose in frontend code
- Use environment variables only

---

## 8. Troubleshooting

### OpenAI 401 Errors

**Problem**: `AuthenticationError: 401 Incorrect API key`

**Solutions**:
1. Verify key starts with `sk-`
2. Check for extra spaces in .env file
3. Ensure `.env` is in project root
4. Restart server after changing .env
5. Verify billing is set up in OpenAI dashboard

### Supabase Connection Errors

**Problem**: `Supabase not available`

**Solutions**:
1. Verify URL format: `https://xxxxx.supabase.co`
2. Check keys are complete (very long strings starting with `eyJ`)
3. Ensure project is not paused (free tier pauses after 7 days)
4. Check database schema is applied
5. Verify RLS policies don't block access

### Database Schema Errors

**Problem**: `relation "blog_posts" does not exist`

**Solutions**:
1. Apply schema: Run `/database/blog_schema.sql` in SQL Editor
2. Verify schema in Database → Tables
3. Check if tables were created in correct schema (public)

---

## 9. Cost Optimization

### OpenAI

- Use GPT-3.5 Turbo for simpler tasks (5x cheaper)
- Cache common queries
- Set rate limits (60 requests/min)
- Monitor usage in dashboard

### Supabase

- Start with free tier
- Upgrade to Pro only when needed
- Enable connection pooling
- Use indexes for query optimization

### Total Monthly Costs

**Development** (free tier):
- OpenAI: ~$5-20/month (depending on usage)
- Supabase: Free
- Hosting: Free (Vercel/Netlify)
- **Total**: $5-20/month

**Production** (moderate traffic):
- OpenAI: ~$20-50/month
- Supabase Pro: $25/month
- Hosting: Free (Vercel) or $20/month (dedicated)
- **Total**: $45-95/month

---

## Next Steps

Once credentials are configured:

1. ✅ Test connections (see Verification Steps)
2. ✅ Apply database schema
3. ✅ Create admin user
4. ✅ Generate initial blog posts:
   ```bash
   node scripts/generateBlogPosts.js
   ```
5. ✅ Test blog features
6. ✅ Deploy to production
7. ✅ Monitor usage and costs

---

**Need Help?**

- OpenAI Docs: https://platform.openai.com/docs
- Supabase Docs: https://supabase.com/docs
- Project Issues: https://github.com/yourusername/the-hub/issues

---

**Last Updated**: January 24, 2026
