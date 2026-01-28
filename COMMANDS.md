# Quick Command Reference

Essential commands for The Hub platform.

---

## 🚀 Setup

```bash
# Complete setup wizard
./scripts/setup.sh

# Configure API credentials only
./scripts/setupCredentials.sh

# Set up database only
./scripts/setupDatabase.sh
```

---

## 💻 Development

### Start Servers

```bash
# Backend API (Terminal 1)
npm run dev
# or
npm start

# Frontend (Terminal 2)
cd the-hub
npm run dev
```

### URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Blog: http://localhost:5173/blog
- Admin: http://localhost:5173/admin

---

## 📝 Content

### Generate Blog Posts

```bash
# Generate 20 posts with AI
node scripts/generateBlogPosts.js

# Check blog posts
curl http://localhost:3000/api/blog/posts
```

### Manual Blog Management

```bash
# Create post
curl -X POST http://localhost:3000/api/blog/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post","content":"# Hello"}'

# Get all posts
curl http://localhost:3000/api/blog/posts

# Get post by slug
curl http://localhost:3000/api/blog/posts/my-post-slug
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests only
npm run test:api

# Frontend tests only
cd the-hub && npm run test

# Specific test suite
npm run test:blog       # Blog API tests
npm run test:ai         # AI features tests

# Watch mode (re-run on changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

---

## 🔍 Auditing

```bash
# Security audit
node scripts/securityAudit.js

# Performance benchmark
node scripts/performanceBenchmark.js

# Full test suite
./scripts/runTests.sh

# NPM vulnerability scan
npm audit
npm audit fix
```

---

## 🗄️ Database

### Supabase CLI

```bash
# Install CLI
brew install supabase/tap/supabase  # macOS
npm install -g supabase             # Linux/WSL

# Login
supabase login

# Link project
supabase link --project-ref your-project-id

# Apply schema
supabase db push

# List tables
supabase db tables list

# Check RLS policies
supabase db policies list

# Run SQL
supabase db execute --sql "SELECT * FROM blog_posts LIMIT 5;"

# Create migration
supabase migration new add_new_feature

# Database status
supabase status
```

### Database Queries

```bash
# Count blog posts
supabase db execute --sql "SELECT COUNT(*) FROM blog_posts;"

# Get recent posts
supabase db execute --sql "SELECT title, published_at FROM blog_posts ORDER BY published_at DESC LIMIT 10;"

# Check deal scores
supabase db execute --sql "SELECT brand, model, deal_score FROM watch_listings WHERE deal_score > 75 ORDER BY deal_score DESC;"
```

---

## 📊 Monitoring

### Performance

```bash
# Get performance summary
curl http://localhost:3000/api/admin/performance/summary

# Get all metrics
curl http://localhost:3000/api/admin/performance/metrics

# Get slow endpoints (>1s)
curl http://localhost:3000/api/admin/performance/slow?threshold=1000

# Export metrics
curl http://localhost:3000/api/admin/performance/export > metrics.json

# Clear metrics
curl -X POST http://localhost:3000/api/admin/performance/clear
```

### Cache

```bash
# Get cache stats
curl http://localhost:3000/api/admin/cache/stats

# Clear entire cache
curl -X POST http://localhost:3000/api/admin/cache/clear \
  -H "Content-Type: application/json" \
  -d '{}'

# Clear specific pattern
curl -X POST http://localhost:3000/api/admin/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"pattern": "/api/blog/*"}'
```

### Deal Scoring

```bash
# Get scheduler status
curl http://localhost:3000/api/deal-scoring/scheduler/status

# Start scheduler
curl -X POST http://localhost:3000/api/deal-scoring/scheduler/start

# Stop scheduler
curl -X POST http://localhost:3000/api/deal-scoring/scheduler/stop

# Run scoring now
curl -X POST http://localhost:3000/api/deal-scoring/scheduler/run-now

# Get stats
curl http://localhost:3000/api/deal-scoring/scheduler/stats
```

---

## 🔑 Credentials

### Check Configuration

```bash
# Test OpenAI connection
node -e "require('dotenv').config(); const client = require('./src/services/openai/client'); console.log('OpenAI available:', client.isAvailable());"

# Test Supabase connection
node -e "require('dotenv').config(); const supabase = require('./src/db/supabase'); console.log('Supabase available:', supabase.isAvailable());"

# Check environment variables
cat .env | grep -v "^#"
```

### Update Credentials

```bash
# Run interactive setup
./scripts/setupCredentials.sh

# Or manually edit .env
nano .env
```

---

## 🏗️ Build

```bash
# Backend build (if needed)
npm install --production

# Frontend build
cd the-hub
npm run build

# Check build size
du -sh the-hub/dist/
ls -lh the-hub/dist/assets/*.js

# Preview production build
cd the-hub
npm run preview
```

---

## 🚢 Deployment

```bash
# Run deployment script
./scripts/deploy.sh production

# Or deploy manually
npm install --production
cd the-hub && npm run build && cd ..

# Deploy to Railway (backend)
railway up

# Deploy to Vercel (frontend)
cd the-hub
vercel --prod
```

---

## 🔧 Utilities

### Git

```bash
# Check status
git status

# Create commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin main

# Create new branch
git checkout -b feature/new-feature
```

### Process Management

```bash
# Find process on port
lsof -ti:3000

# Kill process
lsof -ti:3000 | xargs kill -9

# Start with PM2
pm2 start src/api/server.js --name the-hub-api
pm2 logs the-hub-api
pm2 stop the-hub-api
pm2 restart the-hub-api
```

### Logs

```bash
# View logs (development)
npm run dev 2>&1 | tee logs/dev.log

# View backend logs
tail -f logs/backend.log

# View errors only
grep "ERROR" logs/backend.log

# Real-time log monitoring
tail -f logs/backend.log | grep -i "error\|warning"
```

---

## 📈 SEO

```bash
# Generate sitemap
curl http://localhost:3000/sitemap.xml

# Get RSS feed
curl http://localhost:3000/rss.xml

# Test as Googlebot
curl -A "Googlebot" http://localhost:5173/blog

# Check robots.txt
curl http://localhost:3000/robots.txt
```

---

## 🤖 AI Features

### Natural Language Search

```bash
# Search watches
curl -X POST http://localhost:3000/api/search/watches \
  -H "Content-Type: application/json" \
  -d '{"query": "rolex submariner under 10000"}'

# Search cars
curl -X POST http://localhost:3000/api/search/cars \
  -H "Content-Type: application/json" \
  -d '{"query": "porsche 911 less than 50000 miles"}'

# Search sneakers
curl -X POST http://localhost:3000/api/search/sneakers \
  -H "Content-Type: application/json" \
  -d '{"query": "jordan 1 size 11"}'
```

### AI Blog Generation

```bash
# Generate single post
curl -X POST http://localhost:3000/api/blog/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Best Rolex Watches Under $10,000",
    "category": "watches",
    "targetKeywords": ["rolex", "affordable"],
    "tone": "authoritative",
    "length": "long"
  }'

# Suggest titles
curl -X POST http://localhost:3000/api/blog/ai/suggest-titles \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Luxury Watches",
    "category": "watches",
    "count": 5
  }'
```

---

## 🐛 Debugging

```bash
# Check Node version
node -v
npm -v

# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Clear frontend cache
rm -rf the-hub/node_modules the-hub/package-lock.json
cd the-hub && npm install && cd ..

# Check for syntax errors
npm run lint

# Check TypeScript errors
cd the-hub && npm run type-check && cd ..

# View environment
printenv | grep -E "NODE_ENV|PORT|OPENAI|SUPABASE"
```

---

## 📊 Analytics

```bash
# Blog post views
curl http://localhost:3000/api/blog/analytics/views

# Most popular posts
curl http://localhost:3000/api/blog/analytics/popular

# Email subscribers
curl http://localhost:3000/api/blog/subscribers/count

# Deal scoring stats
curl http://localhost:3000/api/deal-scoring/scheduler/stats
```

---

## 🔄 Updates

```bash
# Update dependencies
npm update
cd the-hub && npm update && cd ..

# Check for outdated packages
npm outdated

# Update specific package
npm install package-name@latest

# Audit dependencies
npm audit
npm audit fix
```

---

## 💡 Quick Tips

### Watch Files for Changes

```bash
# Auto-restart backend on changes
npm run dev

# Auto-rebuild frontend on changes
cd the-hub && npm run dev
```

### Environment Switching

```bash
# Development
NODE_ENV=development npm run dev

# Production
NODE_ENV=production npm start

# Test
NODE_ENV=test npm test
```

### Quick Health Checks

```bash
# Check all services
curl http://localhost:3000/health && \
curl http://localhost:5173 && \
echo "✅ All services running"
```

---

## 🆘 Emergency

```bash
# Stop all processes
pkill -f "node src/api/server.js"
pkill -f "npm run dev"

# Clear all caches
rm -rf node_modules/.cache
rm -rf the-hub/node_modules/.cache
rm -rf the-hub/dist

# Reset to clean state
git reset --hard HEAD
npm install
cd the-hub && npm install && cd ..

# Restore from backup
cp .env.backup .env
```

---

## 📚 Documentation

- [Setup Guide](./CREDENTIALS_SETUP.md)
- [Quick Start](./QUICK_START.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Deployment Guide](./FINAL_DEPLOYMENT_GUIDE.md)

---

**Version:** 1.0.0
**Last Updated:** January 24, 2026
