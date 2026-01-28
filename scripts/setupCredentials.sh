#!/bin/bash

# Credentials Setup Script
# Interactive script to configure API credentials

set -e

echo "=========================================="
echo "  The Hub - Credentials Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo ""

    if [ -f ".env.example" ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
    else
        echo -e "${RED}❌ No .env.example found${NC}"
        echo "Creating new .env file..."

        cat > .env << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:5173

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Supabase
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Deal Scoring Scheduler
ENABLE_DEAL_SCORING_SCHEDULER=true
DEAL_SCORING_INTERVAL_MINUTES=60
EOF
        echo -e "${GREEN}✅ Created new .env file${NC}"
    fi
    echo ""
fi

# Backup existing .env
echo -e "${BLUE}📦 Creating backup...${NC}"
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Backed up existing .env${NC}"
echo ""

# Configure OpenAI API Key
echo -e "${BLUE}🤖 OpenAI API Configuration${NC}"
echo ""
echo "Get your API key from: https://platform.openai.com/account/api-keys"
echo ""

CURRENT_OPENAI=$(grep "OPENAI_API_KEY=" .env | cut -d '=' -f2)
if [[ $CURRENT_OPENAI != "your_openai_api_key_here" ]] && [ ! -z "$CURRENT_OPENAI" ]; then
    echo "Current OpenAI API Key: ${CURRENT_OPENAI:0:10}...${CURRENT_OPENAI: -4}"
    echo ""
    read -p "Update OpenAI API key? (y/n) " -n 1 -r UPDATE_OPENAI
    echo
else
    UPDATE_OPENAI="y"
fi

if [[ $UPDATE_OPENAI =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Enter your OpenAI API Key (starts with sk-): " OPENAI_API_KEY

    # Validate format
    if [[ ! $OPENAI_API_KEY =~ ^sk-[a-zA-Z0-9\-_]{40,}$ ]]; then
        echo -e "${YELLOW}⚠️  Warning: API key format doesn't match expected pattern${NC}"
        echo "   Expected: sk-... (at least 43 characters)"
        echo ""
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Skipping OpenAI configuration"
            OPENAI_API_KEY=""
        fi
    fi

    if [ ! -z "$OPENAI_API_KEY" ]; then
        # Update .env
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|g" .env
        else
            # Linux
            sed -i "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|g" .env
        fi
        echo -e "${GREEN}✅ OpenAI API key configured${NC}"

        # Test the key
        echo ""
        echo -e "${BLUE}🧪 Testing OpenAI API key...${NC}"

        TEST_RESULT=$(node -e "
            require('dotenv').config();
            const OpenAI = require('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            openai.models.list()
                .then(() => {
                    console.log('✅ API key is valid');
                    process.exit(0);
                })
                .catch((error) => {
                    console.log('❌ API key test failed:', error.message);
                    process.exit(1);
                });
        " 2>&1) || true

        echo "$TEST_RESULT"
    fi
fi

echo ""

# Configure Supabase (if not already done)
echo -e "${BLUE}🗄️  Supabase Configuration${NC}"
echo ""

CURRENT_SUPABASE_URL=$(grep "SUPABASE_URL=" .env | cut -d '=' -f2)
if [[ $CURRENT_SUPABASE_URL != "your_supabase_project_url_here" ]] && [ ! -z "$CURRENT_SUPABASE_URL" ]; then
    echo "Current Supabase URL: $CURRENT_SUPABASE_URL"
    echo ""
    read -p "Update Supabase credentials? (y/n) " -n 1 -r UPDATE_SUPABASE
    echo
else
    UPDATE_SUPABASE="y"
fi

if [[ $UPDATE_SUPABASE =~ ^[Yy]$ ]]; then
    echo ""
    echo "Get your Supabase credentials from:"
    echo "  https://supabase.com/dashboard/project/_/settings/api"
    echo ""

    read -p "Enter your Supabase URL: " SUPABASE_URL
    read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Enter your Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY

    # Update .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|SUPABASE_URL=.*|SUPABASE_URL=$SUPABASE_URL|g" .env
        sed -i '' "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|g" .env
        sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY|g" .env
    else
        # Linux
        sed -i "s|SUPABASE_URL=.*|SUPABASE_URL=$SUPABASE_URL|g" .env
        sed -i "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|g" .env
        sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY|g" .env
    fi

    echo -e "${GREEN}✅ Supabase credentials configured${NC}"

    # Update frontend .env
    if [ -f "the-hub/.env" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$SUPABASE_URL|g" the-hub/.env
            sed -i '' "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|g" the-hub/.env
        else
            sed -i "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$SUPABASE_URL|g" the-hub/.env
            sed -i "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|g" the-hub/.env
        fi
        echo -e "${GREEN}✅ Frontend environment updated${NC}"
    fi
fi

echo ""

# Optional: Other services
echo -e "${BLUE}📊 Optional Services${NC}"
echo ""

read -p "Configure Google Analytics? (y/n) " -n 1 -r SETUP_GA
echo
if [[ $SETUP_GA =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Enter your GA4 Measurement ID (G-XXXXXXXXXX): " GA_ID

    # Add to frontend .env
    if [ -f "the-hub/.env" ]; then
        if grep -q "VITE_GA_MEASUREMENT_ID" the-hub/.env; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|VITE_GA_MEASUREMENT_ID=.*|VITE_GA_MEASUREMENT_ID=$GA_ID|g" the-hub/.env
            else
                sed -i "s|VITE_GA_MEASUREMENT_ID=.*|VITE_GA_MEASUREMENT_ID=$GA_ID|g" the-hub/.env
            fi
        else
            echo "VITE_GA_MEASUREMENT_ID=$GA_ID" >> the-hub/.env
        fi
        echo -e "${GREEN}✅ Google Analytics configured${NC}"
    fi
fi

echo ""

read -p "Configure Sentry (error tracking)? (y/n) " -n 1 -r SETUP_SENTRY
echo
if [[ $SETUP_SENTRY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Enter your Sentry DSN: " SENTRY_DSN

    # Add to backend .env
    if grep -q "SENTRY_DSN" .env; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|SENTRY_DSN=.*|SENTRY_DSN=$SENTRY_DSN|g" .env
        else
            sed -i "s|SENTRY_DSN=.*|SENTRY_DSN=$SENTRY_DSN|g" .env
        fi
    else
        echo "" >> .env
        echo "# Error Tracking" >> .env
        echo "SENTRY_DSN=$SENTRY_DSN" >> .env
    fi

    # Add to frontend .env
    if [ -f "the-hub/.env" ]; then
        if grep -q "VITE_SENTRY_DSN" the-hub/.env; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|VITE_SENTRY_DSN=.*|VITE_SENTRY_DSN=$SENTRY_DSN|g" the-hub/.env
            else
                sed -i "s|VITE_SENTRY_DSN=.*|VITE_SENTRY_DSN=$SENTRY_DSN|g" the-hub/.env
            fi
        else
            echo "VITE_SENTRY_DSN=$SENTRY_DSN" >> the-hub/.env
        fi
    fi

    echo -e "${GREEN}✅ Sentry configured${NC}"
fi

echo ""

# Verify configuration
echo -e "${BLUE}🔍 Verifying configuration...${NC}"
echo ""

# Check OpenAI
OPENAI_CHECK=$(grep "OPENAI_API_KEY=" .env | cut -d '=' -f2)
if [[ $OPENAI_CHECK != "your_openai_api_key_here" ]] && [ ! -z "$OPENAI_CHECK" ]; then
    echo -e "${GREEN}✅ OpenAI API key configured${NC}"
else
    echo -e "${YELLOW}⚠️  OpenAI API key not configured${NC}"
fi

# Check Supabase
SUPABASE_CHECK=$(grep "SUPABASE_URL=" .env | cut -d '=' -f2)
if [[ $SUPABASE_CHECK != "your_supabase_project_url_here" ]] && [ ! -z "$SUPABASE_CHECK" ]; then
    echo -e "${GREEN}✅ Supabase credentials configured${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase credentials not configured${NC}"
fi

# Check frontend
if [ -f "the-hub/.env" ]; then
    echo -e "${GREEN}✅ Frontend environment file exists${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend .env not found${NC}"
fi

echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}✅ Credentials Setup Complete!${NC}"
echo "=========================================="
echo ""

echo "📋 Configuration summary:"
echo "  - Backend: .env"
echo "  - Frontend: the-hub/.env"
echo "  - Backups: .env.backup.*"
echo ""

echo "🧪 Test your configuration:"
echo "  node -e \"require('dotenv').config(); const client = require('./src/services/openai/client'); console.log('OpenAI:', client.isAvailable());\""
echo "  node -e \"require('dotenv').config(); const supabase = require('./src/db/supabase'); console.log('Supabase:', supabase.isAvailable());\""
echo ""

echo "🚀 Next steps:"
echo "  1. Set up database: ./scripts/setupDatabase.sh"
echo "  2. Generate blog posts: node scripts/generateBlogPosts.js"
echo "  3. Start development: npm run dev && cd the-hub && npm run dev"
echo ""

echo "📚 Documentation:"
echo "  - CREDENTIALS_SETUP.md - Detailed setup guide"
echo "  - QUICK_START.md - Quick start guide"
echo ""
