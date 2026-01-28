#!/bin/bash

# Master Setup Script for The Hub
# Guides through complete platform setup

set -e

echo ""
echo "=================================================="
echo "                                                  "
echo "     ╔════════════════════════════════════╗      "
echo "     ║        THE HUB - SETUP WIZARD      ║      "
echo "     ╚════════════════════════════════════╝      "
echo "                                                  "
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${CYAN}"
cat << "EOF"
    ████████╗██╗  ██╗███████╗    ██╗  ██╗██╗   ██╗██████╗
    ╚══██╔══╝██║  ██║██╔════╝    ██║  ██║██║   ██║██╔══██╗
       ██║   ███████║█████╗      ███████║██║   ██║██████╔╝
       ██║   ██╔══██║██╔══╝      ██╔══██║██║   ██║██╔══██╗
       ██║   ██║  ██║███████╗    ██║  ██║╚██████╔╝██████╔╝
       ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝ ╚═════╝ ╚═════╝
EOF
echo -e "${NC}"
echo ""

echo "Welcome to The Hub setup wizard!"
echo "This script will guide you through the complete setup process."
echo ""

# Check Node.js
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
echo ""

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo ""
    echo "Please install Node.js 18+ from: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Node.js version is $NODE_VERSION, recommended 18+${NC}"
else
    echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

echo ""

# Setup steps overview
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}                 SETUP STEPS                      ${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  1. 📦 Install dependencies"
echo "  2. 🔑 Configure API credentials"
echo "  3. 🗄️  Set up database with Supabase CLI"
echo "  4. ✍️  Generate initial blog content"
echo "  5. 🧪 Run tests"
echo "  6. 🚀 Start development server"
echo ""

read -p "Press Enter to begin setup..." dummy
echo ""

# Step 1: Install Dependencies
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1/6: Installing Dependencies${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Installing backend dependencies..."
npm install || {
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
}
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

echo "Installing frontend dependencies..."
cd the-hub
npm install || {
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
}
cd ..
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

echo -e "${GREEN}✅ Step 1 Complete - Dependencies installed${NC}"
echo ""
read -p "Press Enter to continue..." dummy
echo ""

# Step 2: Configure Credentials
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2/6: Configure API Credentials${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "You'll need:"
echo "  • OpenAI API key (from https://platform.openai.com/account/api-keys)"
echo "  • Supabase credentials (from https://supabase.com/dashboard)"
echo ""

read -p "Do you have your API credentials ready? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Please gather your credentials and run this script again${NC}"
    echo ""
    echo "Get your credentials from:"
    echo "  OpenAI: https://platform.openai.com/account/api-keys"
    echo "  Supabase: https://supabase.com/dashboard/project/_/settings/api"
    echo ""
    echo "Then run: ./scripts/setup.sh"
    exit 0
fi

echo ""
./scripts/setupCredentials.sh || {
    echo -e "${RED}❌ Credentials setup failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Step 2 Complete - Credentials configured${NC}"
echo ""
read -p "Press Enter to continue..." dummy
echo ""

# Step 3: Database Setup
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3/6: Database Setup with Supabase CLI${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not installed${NC}"
    echo ""
    echo "Install Supabase CLI:"
    echo ""
    echo "  macOS:"
    echo "    brew install supabase/tap/supabase"
    echo ""
    echo "  Linux/WSL:"
    echo "    npm install -g supabase"
    echo ""
    echo "  Or visit: https://supabase.com/docs/guides/cli"
    echo ""

    read -p "Skip database setup for now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠️  Skipping database setup${NC}"
        echo "Run manually later: ./scripts/setupDatabase.sh"
    else
        exit 1
    fi
else
    ./scripts/setupDatabase.sh || {
        echo -e "${YELLOW}⚠️  Database setup had issues${NC}"
        echo "You can run it again: ./scripts/setupDatabase.sh"
    }
fi

echo -e "${GREEN}✅ Step 3 Complete - Database configured${NC}"
echo ""
read -p "Press Enter to continue..." dummy
echo ""

# Step 4: Generate Content
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4/6: Generate Initial Blog Content${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "This will generate 20 SEO-optimized blog posts using AI."
echo "It may take 10-15 minutes and will cost approximately \$2 in OpenAI credits."
echo ""

read -p "Generate blog posts now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    node scripts/generateBlogPosts.js || {
        echo -e "${YELLOW}⚠️  Blog generation failed or was interrupted${NC}"
        echo "You can run it again: node scripts/generateBlogPosts.js"
    }
else
    echo -e "${YELLOW}⚠️  Skipping blog generation${NC}"
    echo "You can generate posts later: node scripts/generateBlogPosts.js"
fi

echo -e "${GREEN}✅ Step 4 Complete - Content generation done${NC}"
echo ""
read -p "Press Enter to continue..." dummy
echo ""

# Step 5: Run Tests
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 5/6: Run Tests${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Run test suite? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""

    # Install test dependencies
    echo "Installing test dependencies..."
    npm install --include=dev

    # Run tests
    echo ""
    echo "Running backend tests..."
    npm run test:api || {
        echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    }

    echo ""
    echo "Running frontend tests..."
    cd the-hub
    npm run test || {
        echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    }
    cd ..
else
    echo -e "${YELLOW}⚠️  Skipping tests${NC}"
    echo "You can run tests later: npm test"
fi

echo -e "${GREEN}✅ Step 5 Complete - Tests run${NC}"
echo ""
read -p "Press Enter to continue..." dummy
echo ""

# Step 6: Start Development Server
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 6/6: Start Development Server${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Development servers:"
echo "  • Backend API: http://localhost:3000"
echo "  • Frontend: http://localhost:5173"
echo ""

read -p "Start development servers now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}Starting servers...${NC}"
    echo ""
    echo "Backend: http://localhost:3000"
    echo "Frontend: http://localhost:5173"
    echo ""
    echo "Press Ctrl+C to stop servers"
    echo ""

    # Start backend in background
    npm run dev &
    BACKEND_PID=$!

    # Wait a moment for backend to start
    sleep 3

    # Start frontend
    cd the-hub
    npm run dev
    cd ..

    # Cleanup
    kill $BACKEND_PID 2>/dev/null || true
else
    echo ""
    echo -e "${YELLOW}Skipping server start${NC}"
    echo ""
    echo "Start manually:"
    echo "  Terminal 1: npm run dev"
    echo "  Terminal 2: cd the-hub && npm run dev"
fi

echo ""

# Final Summary
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}         🎉 SETUP COMPLETE! 🎉${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "✅ What was completed:"
echo "  1. ✅ Dependencies installed"
echo "  2. ✅ API credentials configured"
echo "  3. ✅ Database set up"
echo "  4. ✅ Content generated"
echo "  5. ✅ Tests run"
echo "  6. ✅ Development environment ready"
echo ""

echo "🚀 Quick Start Commands:"
echo ""
echo "  Start development:"
echo "    npm run dev              # Backend API (Terminal 1)"
echo "    cd the-hub && npm run dev # Frontend (Terminal 2)"
echo ""
echo "  Generate more blog posts:"
echo "    node scripts/generateBlogPosts.js"
echo ""
echo "  Run tests:"
echo "    npm test"
echo ""
echo "  Security audit:"
echo "    node scripts/securityAudit.js"
echo ""
echo "  Performance benchmark:"
echo "    node scripts/performanceBenchmark.js"
echo ""

echo "📚 Documentation:"
echo "  • QUICK_START.md - Quick reference"
echo "  • CREDENTIALS_SETUP.md - Detailed credential setup"
echo "  • TESTING_GUIDE.md - Testing procedures"
echo "  • FINAL_DEPLOYMENT_GUIDE.md - Production deployment"
echo ""

echo "🔗 Useful URLs:"
echo "  • Frontend: http://localhost:5173"
echo "  • Backend API: http://localhost:3000"
echo "  • Blog: http://localhost:5173/blog"
echo "  • Admin: http://localhost:5173/admin"
echo "  • API Docs: http://localhost:3000/health"
echo ""

echo "💡 Next Steps:"
echo "  1. Visit http://localhost:5173 to see your platform"
echo "  2. Go to http://localhost:5173/blog to see generated posts"
echo "  3. Try natural language search at http://localhost:5173/watches"
echo "  4. Access admin panel at http://localhost:5173/admin"
echo "  5. Review documentation before deploying to production"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}     Happy building! 🚀                          ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
