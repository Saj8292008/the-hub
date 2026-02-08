# 🗄️ The Hub - Database Setup Guide

Complete guide for setting up your Supabase database for production deployment.

---

## 📋 Overview

The Hub uses PostgreSQL (via Supabase) with these main features:
- **Core Tables:** watches, cars, sneakers, sports data
- **Listings:** Scraped marketplace listings
- **Authentication:** User accounts and profiles
- **Subscriptions:** Premium tier management
- **Real-time:** Live updates via Supabase Realtime
- **Row Level Security (RLS):** Data protection

---

## 🚀 Quick Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to [your Supabase project](https://supabase.com/dashboard)
2. Click **SQL Editor** in the sidebar
3. Click **New query**
4. Copy the contents of each migration file (see below)
5. Paste and click **Run**
6. Repeat for all migrations in order

### Option 2: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

---

## 📑 Migration Files (Run in This Order)

### 1. Core Tables (REQUIRED)
**File:** `supabase/migrations/20260125193800_core_tables_schema.sql`

**What it does:**
- Creates main tables: watches, cars, sneakers, sports_teams
- Creates listing tables: watch_listings, car_listings, sneaker_listings
- Adds indexes for performance
- Sets up full-text search
- Configures RLS policies

**Run this first!**

```bash
# Copy file contents from:
/Users/sydneyjackson/the-hub/supabase/migrations/20260125193800_core_tables_schema.sql
```

**Verify:**
```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should show:
-- watches, cars, sneakers, sports_teams
-- watch_listings, car_listings, sneaker_listings, alerts
```

---

### 2. Authentication System (REQUIRED)
**File:** `supabase/migrations/20260126000002_authentication_system.sql`

**What it does:**
- Creates `users` table (extends Supabase auth.users)
- Creates `user_profiles` table
- Sets up JWT token management
- Configures authentication RLS policies

**Run this second!**

```bash
# Copy file contents from:
/Users/sydneyjackson/the-hub/supabase/migrations/20260126000002_authentication_system.sql
```

**Verify:**
```sql
-- Check authentication tables
SELECT * FROM users LIMIT 1;
SELECT * FROM user_profiles LIMIT 1;

-- Should not error (might be empty)
```

---

### 3. Newsletter System (OPTIONAL)
**File:** `supabase/migrations/20260126000000_newsletter_system.sql`

**What it does:**
- Creates `newsletter_subscribers` table
- Adds email validation
- Sets up unsubscribe tokens

**Skip if not using newsletters**

```bash
# Copy file contents from:
/Users/sydneyjackson/the-hub/supabase/migrations/20260126000000_newsletter_system.sql
```

**Verify:**
```sql
SELECT * FROM newsletter_subscribers LIMIT 1;
```

---

### 4. Deal Alerts (OPTIONAL)
**File:** `supabase/migrations/20260128143000_deal_alerts_table.sql`

**What it does:**
- Creates `deal_alerts` table
- Enables user price alerts
- Links to watches/cars/sneakers

**Skip if not using deal alerts**

```bash
# Copy file contents from:
/Users/sydneyjackson/the-hub/supabase/migrations/20260128143000_deal_alerts_table.sql
```

---

### 5. Channel Posts (OPTIONAL)
**File:** `supabase/migrations/20260128150000_channel_posts_table.sql`

**What it does:**
- Creates `channel_posts` table
- Tracks social media posts (Instagram, Twitter, Telegram)
- Prevents duplicate posts

**Skip if not using social auto-posting**

---

### 6. Sports Games (OPTIONAL)
**File:** `supabase/migrations/20260125200000_sports_games_2026_season.sql`

**What it does:**
- Creates `sports_games` table
- Adds 2026 season schedules for NFL, NBA, etc.
- Real-time score tracking

**Skip if not tracking sports**

---

### 7. Subscriptions & Payments (REQUIRED if using Stripe)
**File:** `supabase/migrations/20260206000000_subscriptions_table.sql`

**What it does:**
- Creates `subscriptions` table
- Links users to Stripe subscriptions
- Tracks subscription tiers (free/pro/premium)

**Create manually if file doesn't exist:**

```sql
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'pro', 'premium')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'canceled', 'past_due')),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own subscriptions"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Auto-update timestamp
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔐 Row Level Security (RLS) Policies

### Understanding RLS

RLS ensures users can only access their own data. Here's what's protected:

**Public Data (Anyone can read):**
- `watch_listings`
- `car_listings`
- `sneaker_listings`
- `sports_games`
- `blog_posts`

**Protected Data (User-specific):**
- `users` - Users can only see/edit their own record
- `user_profiles` - Users can only see/edit their own profile
- `subscriptions` - Users can only see their own subscription
- `watches` - Users can only see their own watchlist
- `alerts` - Users can only see their own alerts

### Verify RLS is Enabled

```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should show rowsecurity = true for protected tables
```

### Test RLS Policies

```sql
-- As an authenticated user, try to read someone else's data
-- Should return empty or only your data

SELECT * FROM subscriptions; -- Should only show YOUR subscription
SELECT * FROM users; -- Should only show YOUR user record
SELECT * FROM watch_listings; -- Should show ALL listings (public data)
```

---

## 📊 Sample Data (For Testing)

The core schema migration includes sample data. If you want more:

### Add Test Watch Listings

```sql
INSERT INTO watch_listings (source, url, title, brand, model, price, condition, deal_score)
VALUES
  ('reddit', 'https://reddit.com/r/Watchexchange/test1', 
   'Seiko Presage Cocktail Time', 'Seiko', 'Presage', 350, 'excellent', 82),
  ('ebay', 'https://ebay.com/itm/test2',
   'Citizen Eco-Drive Diver', 'Citizen', 'Eco-Drive', 220, 'good', 75),
  ('watchuseek', 'https://watchuseek.com/test3',
   'Hamilton Khaki Field', 'Hamilton', 'Khaki Field', 425, 'very-good', 88);
```

### Add Test User (for development)

```sql
-- Don't do this in production! Use the signup flow instead
INSERT INTO users (email, password_hash, subscription_tier)
VALUES 
  ('test@example.com', 'hashed-password-here', 'premium');
```

---

## 🔍 Database Verification

### Check All Tables Exist

```sql
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected tables:
- alerts
- cars
- car_listings
- channel_posts (if using social posting)
- deal_alerts (if using alerts)
- newsletter_subscribers (if using newsletters)
- sneakers
- sneaker_listings
- sports_games (if tracking sports)
- sports_teams (if tracking sports)
- subscriptions
- users
- user_profiles
- watches
- watch_listings

### Check Indexes

```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Should have indexes on:
- Primary keys (all tables)
- Foreign keys (user_id, etc.)
- Commonly queried fields (brand, model, price)
- Search vectors (for full-text search)

### Check RLS Policies

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check Database Size

```sql
SELECT 
  schemaname,
  SUM(pg_total_relation_size(schemaname||'.'||tablename))::numeric / 1024 / 1024 AS size_mb
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;
```

Free tier limit: 500 MB

---

## 🔧 Database Maintenance

### Backup Your Database

Supabase automatically backs up your database daily. To create a manual backup:

1. Go to Supabase Dashboard
2. Click **Database** → **Backups**
3. Click **Create backup**
4. Wait for completion
5. Download if needed

### Restore from Backup

1. Go to Supabase Dashboard → Database → Backups
2. Find the backup you want to restore
3. Click **Restore**
4. Confirm (this will overwrite current data!)

### Clear Old Data

```sql
-- Delete old scraped listings (older than 30 days)
DELETE FROM watch_listings 
WHERE last_seen < NOW() - INTERVAL '30 days';

DELETE FROM car_listings 
WHERE last_seen < NOW() - INTERVAL '30 days';

DELETE FROM sneaker_listings 
WHERE last_seen < NOW() - INTERVAL '30 days';

-- Vacuum to reclaim space
VACUUM FULL;
```

### Optimize Performance

```sql
-- Update table statistics (helps query planner)
ANALYZE;

-- Rebuild indexes (if queries are slow)
REINDEX TABLE watch_listings;
REINDEX TABLE car_listings;
REINDEX TABLE sneaker_listings;
```

---

## 🚨 Common Database Issues

### Issue: "relation does not exist"

**Cause:** Table wasn't created (migration not run)

**Fix:**
1. Go to Supabase SQL Editor
2. Run the migration that creates that table
3. Verify with: `SELECT * FROM table_name LIMIT 1;`

### Issue: "permission denied for table"

**Cause:** RLS policy is blocking access

**Fix:**
```sql
-- Temporarily disable RLS for testing (NOT in production!)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Or fix the policy:
CREATE POLICY "Allow public read" ON table_name
  FOR SELECT USING (true);
```

### Issue: "duplicate key value violates unique constraint"

**Cause:** Trying to insert data that already exists

**Fix:**
```sql
-- Use UPSERT instead of INSERT
INSERT INTO watch_listings (url, title, ...)
VALUES (...)
ON CONFLICT (url) 
DO UPDATE SET 
  title = EXCLUDED.title,
  price = EXCLUDED.price,
  last_seen = NOW();
```

### Issue: Database is slow

**Causes:**
- Missing indexes
- Large table scans
- Unoptimized queries

**Debug:**
```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_time / 1000 as total_seconds,
  mean_time / 1000 as mean_seconds
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

**Fix:**
- Add indexes on commonly queried columns
- Use `EXPLAIN ANALYZE` to see query plans
- Limit result sets with pagination

---

## 📈 Monitoring

### Key Metrics to Watch

**In Supabase Dashboard:**
1. **Database Size:** Settings → Billing → Usage
   - Free tier: 500 MB
   - Watch for: >400 MB (80% full)

2. **Connections:** Database → Connection Pooling
   - Free tier: 60 direct connections
   - Watch for: >50 connections

3. **Query Performance:** Database → Query Performance
   - Watch for: Queries taking >1 second

4. **API Requests:** Dashboard Home
   - Free tier: 500k requests/month
   - Watch for: Consistent high usage

### Set Up Alerts

1. Go to Supabase Dashboard
2. Settings → Notifications
3. Enable alerts for:
   - Database size reaching limit
   - High connection count
   - Slow queries
   - API errors

---

## ✅ Deployment Checklist

Before deploying, ensure:

- [ ] All required migrations run successfully
- [ ] Core tables exist (watches, watch_listings, users, etc.)
- [ ] RLS policies are enabled on protected tables
- [ ] Indexes are created (check with query above)
- [ ] Sample data loads correctly
- [ ] No SQL errors in Supabase logs
- [ ] Database size is reasonable (<100 MB for fresh install)
- [ ] Backup is created
- [ ] API keys are correct in Railway/Vercel

---

## 🆘 Need Help?

**Supabase Resources:**
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com/)
- [SQL Tutorial](https://supabase.com/docs/guides/database)

**Check These First:**
1. Supabase Dashboard → Logs (for SQL errors)
2. Table Editor → Click table → Structure (verify schema)
3. SQL Editor → Run test query (verify connectivity)

---

**Last Updated:** 2026-02-08
