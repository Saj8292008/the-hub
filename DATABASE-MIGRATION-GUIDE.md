# 🗄️ Database Migration Guide

**Before deploying to production**, you need to ensure your Supabase database has all the required tables and schema.

---

## 📋 Migration Checklist

Run these migrations in order in your Supabase SQL Editor:

### Core Migrations (REQUIRED)
- [ ] `20260125193800_core_tables_schema.sql` - Main tables (watches, cars, sneakers, sports)
- [ ] `20260125194500_add_timestamp_columns.sql` - Add timestamp tracking
- [ ] `20260125195000_fix_rls_policies.sql` - Fix Row Level Security policies
- [ ] `20260126000002_authentication_system.sql` - Users, profiles, subscriptions
- [ ] `20260126000000_newsletter_system.sql` - Newsletter subscribers

### Feature Migrations (RECOMMENDED)
- [ ] `20260128143000_deal_alerts_table.sql` - Deal alerts system
- [ ] `20260128150000_channel_posts_table.sql` - Telegram channel tracking
- [ ] `20260126120000_add_user_associations.sql` - User-related associations
- [ ] `20260126180000_scraper_logs_table.sql` - Scraper logging
- [ ] `20260202200000_amazon_deals_table.sql` - Amazon deals tracking

### Optional Migrations
- [ ] `20260125021939_initial_blog_schema.sql` - Blog system (if using blog)
- [ ] `20260125200000_sports_games_2026_season.sql` - 2026 sports season data
- [ ] `20260125210000_update_real_sports_data.sql` - Real sports data updates
- [ ] `20260126000001_add_external_id_to_sports_games.sql` - Sports game external IDs
- [ ] `20260128091700_add_seller_column.sql` - Add seller tracking
- [ ] `20260128160000_new_features.sql` - Additional features

### Additional Migrations (in /migrations/)
- [ ] `migrations/create_alert_queue.sql` - Alert queue system
- [ ] `migrations/add_instagram_tracking.sql` - Instagram post tracking
- [ ] `migrations/add_twitter_tracking.sql` - Twitter post tracking (if needed)

---

## 🚀 How to Run Migrations

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `sysvawxchniqelifyenl`
3. Click **SQL Editor** in the left sidebar
4. Click **"New query"**

### Step 2: Run Core Migrations First

**Migration 1: Core Tables**
```bash
# Copy the contents of this file:
cat supabase/migrations/20260125193800_core_tables_schema.sql
```

1. Paste into SQL Editor
2. Click **"Run"** or press Cmd/Ctrl + Enter
3. Verify: "Success. No rows returned"

**Migration 2: Timestamp Columns**
```bash
cat supabase/migrations/20260125194500_add_timestamp_columns.sql
```

**Migration 3: RLS Policies**
```bash
cat supabase/migrations/20260125195000_fix_rls_policies.sql
```

**Migration 4: Authentication System**
```bash
cat supabase/migrations/20260126000002_authentication_system.sql
```

**Migration 5: Newsletter System**
```bash
cat supabase/migrations/20260126000000_newsletter_system.sql
```

### Step 3: Run Feature Migrations

**Deal Alerts:**
```bash
cat supabase/migrations/20260128143000_deal_alerts_table.sql
```

**Channel Posts:**
```bash
cat supabase/migrations/20260128150000_channel_posts_table.sql
```

**Alert Queue (from /migrations/):**
```bash
cat migrations/create_alert_queue.sql
```

**Instagram Tracking (from /migrations/):**
```bash
cat migrations/add_instagram_tracking.sql
```

### Step 4: Verify Tables Created

1. In Supabase Dashboard, go to **Table Editor**
2. Verify these tables exist:

**Core Tables:**
- ✅ `watches`
- ✅ `watch_listings`
- ✅ `cars`
- ✅ `car_listings`
- ✅ `sneakers`
- ✅ `sneaker_listings`
- ✅ `sports_teams`
- ✅ `sports_games`

**User Tables:**
- ✅ `users`
- ✅ `user_profiles`
- ✅ `subscriptions`

**Feature Tables:**
- ✅ `newsletter_subscribers`
- ✅ `deal_alerts`
- ✅ `channel_posts`
- ✅ `alert_queue`
- ✅ `instagram_posts`

**Optional Tables:**
- `scraper_logs`
- `blog_posts`
- `blog_authors`
- `amazon_deals`

---

## 🔒 Row Level Security (RLS) Verification

### Check RLS Policies

1. Go to **Authentication** → **Policies**
2. Verify these tables have RLS enabled:

**Public Read Tables:**
- `watch_listings` - Anyone can read
- `car_listings` - Anyone can read
- `sneaker_listings` - Anyone can read
- `sports_teams` - Anyone can read
- `sports_games` - Anyone can read

**Protected Tables:**
- `users` - Users can only read/write their own data
- `user_profiles` - Users can only read/write their own profile
- `subscriptions` - Users can only read their own subscription
- `deal_alerts` - Users can only manage their own alerts

### If RLS Policies are Missing

Run this SQL to create basic policies:

```sql
-- Enable RLS on all tables
ALTER TABLE watch_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sneaker_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read for listings
CREATE POLICY "Public read access" ON watch_listings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON car_listings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON sneaker_listings FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
```

---

## 🧪 Test Database Connection

After running migrations, test the database connection:

### Option 1: Use Supabase SQL Editor

```sql
-- Test query: Get total watches
SELECT COUNT(*) as total_watches FROM watches;

-- Test query: Get recent listings
SELECT * FROM watch_listings ORDER BY created_at DESC LIMIT 5;

-- Test query: Verify users table
SELECT COUNT(*) as total_users FROM users;
```

### Option 2: Test from Backend

```bash
# From your local machine
cd /Users/sydneyjackson/the-hub
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://sysvawxchniqelifyenl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5c3Zhd3hjaG5pcWVsaWZ5ZW5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc4ODk1NSwiZXhwIjoyMDg0MzY0OTU1fQ.2vT6lOoCcZPFg_slodGZEpmUrlQVjf2iNKdrF6lHfsA'
);
supabase.from('watches').select('count').then(console.log);
"
```

Expected output:
```json
{ data: [...], error: null, count: X }
```

---

## 🐛 Common Migration Issues

### Issue: "relation does not exist"
**Cause:** Migration ran out of order  
**Fix:** Run migrations in the exact order listed above

### Issue: "duplicate key value violates unique constraint"
**Cause:** Migration was run twice  
**Fix:** Safe to ignore if table already exists, or drop table and re-run

### Issue: "permission denied for table"
**Cause:** Using anon key instead of service role key  
**Fix:** Ensure you're using the service role key in backend

### Issue: RLS blocking queries
**Cause:** RLS enabled but no policies exist  
**Fix:** Run the RLS policy SQL from above

---

## 📊 Migration Status Tracker

Use this to track your migration progress:

```
🗄️ Database Migration Status

Core Migrations:
✅ Core tables schema
✅ Timestamp columns
✅ RLS policies
✅ Authentication system
✅ Newsletter system

Feature Migrations:
✅ Deal alerts
✅ Channel posts
✅ Alert queue
✅ Instagram tracking

Tables Verified:
✅ watches, watch_listings
✅ cars, car_listings
✅ sneakers, sneaker_listings
✅ sports_teams, sports_games
✅ users, user_profiles, subscriptions
✅ newsletter_subscribers
✅ deal_alerts, channel_posts

RLS Policies:
✅ Public read on listings
✅ User-specific policies
✅ Subscription policies

Database Ready: ✅ YES / ❌ NO
```

---

## 🎯 Quick Migration Script

If you prefer, run all core migrations at once:

```bash
# From project root
cd /Users/sydneyjackson/the-hub

# Core migrations
cat supabase/migrations/20260125193800_core_tables_schema.sql | pbcopy
# Paste in Supabase SQL Editor and run

cat supabase/migrations/20260125194500_add_timestamp_columns.sql | pbcopy
# Paste and run

cat supabase/migrations/20260125195000_fix_rls_policies.sql | pbcopy
# Paste and run

cat supabase/migrations/20260126000002_authentication_system.sql | pbcopy
# Paste and run

cat supabase/migrations/20260126000000_newsletter_system.sql | pbcopy
# Paste and run

# Feature migrations
cat supabase/migrations/20260128143000_deal_alerts_table.sql | pbcopy
cat supabase/migrations/20260128150000_channel_posts_table.sql | pbcopy
cat migrations/create_alert_queue.sql | pbcopy
cat migrations/add_instagram_tracking.sql | pbcopy

echo "✅ All migrations copied to clipboard! Paste each one in Supabase SQL Editor."
```

---

## ✅ Migration Complete Checklist

Before proceeding with deployment, verify:

- [ ] All core migrations run successfully
- [ ] All required tables exist in Supabase Table Editor
- [ ] RLS policies are configured
- [ ] Test query returns data successfully
- [ ] No errors in Supabase logs
- [ ] Backend can connect to database (test locally)

**Once verified, proceed to:**
1. Backend deployment (Railway)
2. Frontend deployment (Vercel)
3. End-to-end testing

See: `PRODUCTION-DEPLOYMENT-READY.md`

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs/guides/database
- Migration troubleshooting: See `TROUBLESHOOTING.md`
- Database setup guide: See `DATABASE-SETUP.md`
