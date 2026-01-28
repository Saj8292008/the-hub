# The Hub

Premium luxury asset tracking platform with AI-powered blog, deal scoring, and natural language search.

---

## ✨ Features

- **🤖 AI Blog Platform** - GPT-4 powered content generation with full SEO optimization
- **📊 Deal Scoring System** - Automated 5-factor algorithm to find the best deals
- **🔍 Natural Language Search** - Search using plain English: "rolex submariner under 10k"
- **⚡ Performance Optimized** - Response caching, lazy loading, <200ms API responses
- **🔒 Secure** - Row-level security, input validation, rate limiting
- **📈 Monitoring** - Built-in performance tracking and error monitoring

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- OpenAI API key ([Get one](https://platform.openai.com/account/api-keys))
- Supabase account ([Sign up](https://supabase.com))

### One-Command Setup

```bash
./scripts/setup.sh
```

This interactive wizard will:
1. Install dependencies
2. Configure API credentials
3. Set up database with Supabase CLI
4. Generate 20 SEO blog posts
5. Run tests
6. Start development servers

**Setup time:** ~20 minutes

---

## 📖 Manual Setup

### 1. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd the-hub
npm install
cd ..
```

### 2. Configure Credentials

**Easy way:**
```bash
./scripts/setupCredentials.sh
```

**Manual way:**

Create `.env`:
```bash
NODE_ENV=development
PORT=3000
OPENAI_API_KEY=sk-your-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Create `the-hub/.env`:
```bash
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

📖 **Detailed guide:** [CREDENTIALS_SETUP.md](./CREDENTIALS_SETUP.md)

### 3. Set Up Database

**With Supabase CLI:**
```bash
# Install CLI
brew install supabase/tap/supabase  # macOS
npm install -g supabase             # Linux/WSL

# Link project
supabase link --project-ref your-project-id

# Apply schema
./scripts/setupDatabase.sh
```

**Without CLI:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `database/blog_schema.sql`
3. Paste and run

### 4. Generate Content

```bash
node scripts/generateBlogPosts.js
```

Generates 20 blog posts (~10 minutes, ~$2 OpenAI cost)

### 5. Start Development

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd the-hub
npm run dev
```

Visit:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Blog: http://localhost:5173/blog
- Admin: http://localhost:5173/admin

---

## 📁 Project Structure

```
the-hub/
├── src/                          # Backend
│   ├── api/                      # Express API routes
│   │   ├── server.js            # Main server
│   │   ├── blog.js              # Blog endpoints
│   │   ├── blogSSR.js           # Server-side rendering
│   │   ├── naturalSearch.js     # AI search
│   │   └── sitemap.js           # SEO sitemap
│   ├── services/
│   │   ├── openai/              # AI services
│   │   │   ├── blogGenerator.js # Blog content generation
│   │   │   └── queryParser.js   # NL search parser
│   │   ├── ai/
│   │   │   └── dealScorer.js    # Deal scoring algorithm
│   │   ├── performanceMonitor.js
│   │   └── imageOptimization.js
│   ├── db/
│   │   ├── supabase.js          # Database client
│   │   └── blogQueries.js       # Blog queries
│   ├── middleware/
│   │   ├── caching.js           # Response cache
│   │   └── crawlerDetection.js  # SEO crawler detection
│   └── schedulers/
│       └── dealScoringScheduler.js
│
├── the-hub/                      # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Blog.tsx         # Blog index
│   │   │   ├── BlogPost.tsx     # Post detail
│   │   │   ├── BlogEditor.tsx   # Rich editor
│   │   │   └── AdminSettings.tsx
│   │   ├── components/
│   │   │   ├── blog/            # Blog components
│   │   │   ├── admin/           # Admin dashboards
│   │   │   ├── listings/        # AI search
│   │   │   └── common/          # Shared components
│   │   └── services/
│   │       └── blog.ts          # API client
│   └── dist/                     # Build output
│
├── database/
│   └── blog_schema.sql           # Database schema
│
├── scripts/
│   ├── setup.sh                  # Master setup wizard
│   ├── setupCredentials.sh       # Credential config
│   ├── setupDatabase.sh          # Database setup
│   ├── generateBlogPosts.js      # Content generation
│   ├── securityAudit.js          # Security scan
│   └── performanceBenchmark.js   # Performance test
│
├── tests/
│   ├── api/                      # Backend tests
│   └── frontend/                 # React component tests
│
└── docs/                         # Documentation
    ├── CREDENTIALS_SETUP.md
    ├── QUICK_START.md
    ├── TESTING_GUIDE.md
    └── FINAL_DEPLOYMENT_GUIDE.md
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend only
npm run test:api

# Frontend only
cd the-hub && npm run test

# Security audit
node scripts/securityAudit.js

# Performance benchmark
node scripts/performanceBenchmark.js

# With coverage
npm run test:coverage
```

📖 **Full guide:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

## 🚢 Deployment

### Quick Deploy

```bash
./scripts/deploy.sh production
```

### Recommended Stack

- **Frontend:** Vercel (free tier)
- **Backend:** Railway ($5/month)
- **Database:** Supabase (free tier)
- **Total cost:** ~$20-50/month

📖 **Step-by-step guide:** [FINAL_DEPLOYMENT_GUIDE.md](./FINAL_DEPLOYMENT_GUIDE.md)

---

## 💰 Operating Costs

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Supabase | Free | $0 |
| Railway (Backend) | Hobby | $5 |
| Vercel (Frontend) | Free | $0 |
| OpenAI API | Usage-based | $13-42 |
| **Total** | | **$18-47/month** |

**OpenAI Breakdown:**
- Blog generation (50 posts): $5
- Natural language search (1000 queries): $5
- Deal scoring with AI (1000 items): $10
- Monthly variation: $13-42

---

## 📚 Documentation

### Getting Started
- [Quick Start](./QUICK_START.md) - 5-minute setup guide
- [Credentials Setup](./CREDENTIALS_SETUP.md) - Complete API configuration

### Development
- [Testing Guide](./TESTING_GUIDE.md) - Testing procedures
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION_GUIDE.md) - Speed optimization
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Architecture overview

### Deployment
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Pre-launch checklist
- [Final Deployment Guide](./FINAL_DEPLOYMENT_GUIDE.md) - Production deployment
- [Security Audit](./SECURITY_AND_PERFORMANCE_AUDIT.md) - Security best practices

### Features
- [AI Features](./AI_FEATURES_README.md) - AI capabilities documentation

---

## 🎯 Key Features

### AI Blog Platform

**Content Generation:**
- GPT-4 powered blog posts
- Context-rich prompts with market data
- Structured output (title, content, SEO metadata)
- Bulk generation (20 posts in 15 minutes)

**SEO Optimization:**
- Server-side rendering for crawlers
- Schema.org Article markup
- Open Graph + Twitter Cards
- Dynamic sitemap.xml
- RSS feed (XML + JSON)

**Rich Editor:**
- Live Markdown preview
- AI content generation
- Image upload
- Draft/publish workflow

### Deal Scoring

**Algorithm:**
- 5-factor weighted scoring (0-100)
  - Price vs Market (40%)
  - Condition (20%)
  - Seller Reputation (15%)
  - Listing Quality (15%)
  - Rarity/Demand (10%)

**Features:**
- Automated hourly scheduler
- Real-time WebSocket updates
- Admin control panel
- Hot Deal badges (🔥 90-100, 💰 75-89)

### Natural Language Search

**Capabilities:**
- Parse queries: "rolex submariner under 10k"
- Extract: brand, model, price range, condition
- Categories: watches, cars, sneakers
- Interpreted filters display
- Cost-effective (GPT-3.5 Turbo)

---

## 🛠️ Scripts

```bash
# Setup
./scripts/setup.sh                    # Interactive setup wizard
./scripts/setupCredentials.sh         # Configure API keys
./scripts/setupDatabase.sh            # Set up database

# Content
node scripts/generateBlogPosts.js     # Generate 20 blog posts

# Testing
./scripts/runTests.sh                 # Run all tests
node scripts/securityAudit.js         # Security scan
node scripts/performanceBenchmark.js  # Performance test

# Deployment
./scripts/deploy.sh production        # Deploy to production
```

---

## 🔧 Configuration

### Environment Variables

**Backend (`.env`):**
```bash
NODE_ENV=development
PORT=3000
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
ENABLE_DEAL_SCORING_SCHEDULER=true
DEAL_SCORING_INTERVAL_MINUTES=60
```

**Frontend (`the-hub/.env`):**
```bash
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_GA_MEASUREMENT_ID=G-...  # Optional
```

---

## 📊 Performance

**Targets:**
- API response time: <200ms average
- Page load time: <2s
- Lighthouse score: 90+
- Cache hit rate: >60%
- Uptime: 99.9%

**Optimization:**
- Response caching (2-10 min TTL)
- Image lazy loading
- Code splitting
- Database indexing
- CDN delivery

---

## 🔒 Security

**Features:**
- Row-level security (RLS)
- Input validation
- XSS protection (DOMPurify)
- SQL injection prevention (parameterized queries)
- Rate limiting (60 req/min)
- CORS configuration
- Security headers

**Audit:**
```bash
node scripts/securityAudit.js
```

---

## 🐛 Troubleshooting

### Common Issues

**"OpenAI client not available"**
```bash
# Check API key is set
grep OPENAI_API_KEY .env

# Test connection
node -e "require('dotenv').config(); const client = require('./src/services/openai/client'); console.log('Available:', client.isAvailable());"
```

**"Supabase not available"**
```bash
# Verify credentials
node -e "require('dotenv').config(); const supabase = require('./src/db/supabase'); console.log('Available:', supabase.isAvailable());"

# Check database connection
supabase db ping
```

**Port already in use**
```bash
# Find process
lsof -ti:3000

# Kill process
lsof -ti:3000 | xargs kill -9
```

**Tests failing**
```bash
# Install test dependencies
npm install --include=dev

# Clear cache
rm -rf node_modules/.cache
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

ISC

---

## 💬 Support

- 📖 Documentation: See `docs/` folder
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/the-hub/issues)
- 💡 Questions: Check [QUICK_START.md](./QUICK_START.md) first

---

## 🎯 Project Status

**Version:** 1.0.0
**Status:** Production Ready ✅
**Last Updated:** January 24, 2026

**Features Complete:**
- ✅ AI Blog Platform
- ✅ Deal Scoring System
- ✅ Natural Language Search
- ✅ Performance Optimization
- ✅ Security Hardening
- ✅ Comprehensive Testing
- ✅ Production Documentation

---

**Ready to launch! 🚀**

Start with: `./scripts/setup.sh`
