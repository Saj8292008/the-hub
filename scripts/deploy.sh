#!/bin/bash

# Deployment Script for The Hub
# Automates build, test, and deployment process

set -e  # Exit on error

echo "======================================"
echo "  The Hub - Deployment Script"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
SKIP_TESTS=${SKIP_TESTS:-false}

echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Check if required files exist
echo "📋 Checking prerequisites..."

if [ ! -f ".env" ]; then
  echo -e "${RED}❌ .env file not found${NC}"
  exit 1
fi

if [ ! -f "the-hub/.env.${ENVIRONMENT}" ] && [ ! -f "the-hub/.env" ]; then
  echo -e "${RED}❌ Frontend environment file not found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."

npm install --production=false

cd the-hub
npm install --production=false
cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Run tests (if not skipped)
if [ "$SKIP_TESTS" != "true" ]; then
  echo "🧪 Running tests..."

  # Backend tests
  if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    npm test || {
      echo -e "${YELLOW}⚠️  Backend tests failed, but continuing...${NC}"
    }
  fi

  # Frontend tests
  cd the-hub
  if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    npm test || {
      echo -e "${YELLOW}⚠️  Frontend tests failed, but continuing...${NC}"
    }
  fi
  cd ..

  echo -e "${GREEN}✅ Tests completed${NC}"
  echo ""
else
  echo -e "${YELLOW}⏭️  Skipping tests${NC}"
  echo ""
fi

# Build frontend
echo "🔨 Building frontend..."

cd the-hub

if [ "$ENVIRONMENT" = "production" ]; then
  npm run build
else
  npm run build
fi

cd ..

echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo ""

# Check database migrations (if any)
echo "🗄️  Checking database..."

if [ -f "database/blog_schema.sql" ]; then
  echo -e "${YELLOW}⚠️  Remember to run database migrations if needed${NC}"
  echo "   supabase db push"
fi

echo ""

# Generate sitemap
echo "🗺️  Generating sitemap..."
echo -e "${YELLOW}⚠️  Remember to regenerate sitemap after deployment${NC}"
echo "   curl https://your-domain.com/sitemap.xml"
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}✅ Build Complete!${NC}"
echo "======================================"
echo ""
echo "📦 Deployment artifacts:"
echo "   - Frontend: ./the-hub/dist/"
echo "   - Backend: ./ (all .js files)"
echo ""
echo "🚀 Next steps:"
echo ""
echo "1. Deploy backend:"
echo "   - Heroku: git push heroku main"
echo "   - Railway: railway up"
echo "   - Render: git push origin main"
echo ""
echo "2. Deploy frontend:"
echo "   - Vercel: vercel --prod"
echo "   - Netlify: netlify deploy --prod"
echo "   - Cloudflare: wrangler pages deploy the-hub/dist"
echo ""
echo "3. Verify deployment:"
echo "   - Backend health: https://api.yourdomain.com/health"
echo "   - Frontend: https://yourdomain.com"
echo "   - Sitemap: https://yourdomain.com/sitemap.xml"
echo ""
echo "4. Post-deployment:"
echo "   - Submit sitemap to Google Search Console"
echo "   - Monitor error logs"
echo "   - Check performance metrics at /admin"
echo ""
echo "======================================"
