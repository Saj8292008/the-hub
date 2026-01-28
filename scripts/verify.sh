#!/bin/bash

# Verification Script
# Checks if The Hub is properly configured and ready to run

set -e

echo "=========================================="
echo "  The Hub - Installation Verification"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

# Node.js
echo -e "${BLUE}🔍 Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        check_pass "Node.js $NODE_VERSION installed"
    else
        check_warn "Node.js $NODE_VERSION (recommend 18+)"
    fi
else
    check_fail "Node.js not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm $NPM_VERSION installed"
else
    check_fail "npm not installed"
fi
echo ""

# Dependencies
echo -e "${BLUE}🔍 Checking dependencies...${NC}"

if [ -d "node_modules" ]; then
    check_pass "Backend dependencies installed"
else
    check_fail "Backend dependencies missing (run: npm install)"
fi

if [ -d "the-hub/node_modules" ]; then
    check_pass "Frontend dependencies installed"
else
    check_fail "Frontend dependencies missing (run: cd the-hub && npm install)"
fi
echo ""

# Environment files
echo -e "${BLUE}🔍 Checking environment files...${NC}"

if [ -f ".env" ]; then
    check_pass ".env file exists"

    # Check for placeholder values
    if grep -q "your_openai_api_key_here" .env; then
        check_warn "OpenAI API key not configured (placeholder value)"
    else
        OPENAI_KEY=$(grep "OPENAI_API_KEY=" .env | cut -d'=' -f2)
        if [ -z "$OPENAI_KEY" ]; then
            check_fail "OpenAI API key missing"
        elif [[ $OPENAI_KEY =~ ^sk-[a-zA-Z0-9\-_]{40,}$ ]]; then
            check_pass "OpenAI API key configured"
        else
            check_warn "OpenAI API key format looks incorrect"
        fi
    fi

    if grep -q "your_supabase_project_url_here" .env; then
        check_warn "Supabase credentials not configured (placeholder values)"
    else
        SUPABASE_URL=$(grep "SUPABASE_URL=" .env | cut -d'=' -f2)
        if [ -z "$SUPABASE_URL" ]; then
            check_fail "Supabase URL missing"
        elif [[ $SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
            check_pass "Supabase URL configured"
        else
            check_warn "Supabase URL format looks incorrect"
        fi
    fi
else
    check_fail ".env file missing"
fi

if [ -f "the-hub/.env" ]; then
    check_pass "Frontend .env file exists"
else
    check_warn "Frontend .env file missing (may use defaults)"
fi
echo ""

# Database
echo -e "${BLUE}🔍 Checking database...${NC}"

if [ -f "database/blog_schema.sql" ]; then
    check_pass "Database schema file exists"
else
    check_fail "Database schema file missing"
fi

if command -v supabase &> /dev/null; then
    check_pass "Supabase CLI installed"

    if [ -f ".supabase/config.toml" ]; then
        check_pass "Supabase project linked"
    else
        check_warn "Supabase project not linked (run: ./scripts/setupDatabase.sh)"
    fi
else
    check_warn "Supabase CLI not installed (optional but recommended)"
fi
echo ""

# Test connectivity
echo -e "${BLUE}🔍 Testing API connectivity...${NC}"

if [ -f ".env" ]; then
    # Test OpenAI
    OPENAI_TEST=$(node -e "
        require('dotenv').config();
        const client = require('./src/services/openai/client');
        console.log(client.isAvailable() ? 'true' : 'false');
    " 2>/dev/null || echo "false")

    if [ "$OPENAI_TEST" = "true" ]; then
        check_pass "OpenAI client initialized"
    else
        check_warn "OpenAI client not available (check API key)"
    fi

    # Test Supabase
    SUPABASE_TEST=$(node -e "
        require('dotenv').config();
        const supabase = require('./src/db/supabase');
        console.log(supabase.isAvailable() ? 'true' : 'false');
    " 2>/dev/null || echo "false")

    if [ "$SUPABASE_TEST" = "true" ]; then
        check_pass "Supabase client initialized"
    else
        check_warn "Supabase client not available (check credentials)"
    fi
else
    check_warn "Skipping connectivity tests (no .env file)"
fi
echo ""

# Build artifacts
echo -e "${BLUE}🔍 Checking build artifacts...${NC}"

if [ -d "the-hub/dist" ]; then
    check_pass "Frontend build exists"
    BUNDLE_SIZE=$(du -sh the-hub/dist/ | cut -f1)
    echo "  Build size: $BUNDLE_SIZE"
else
    check_warn "Frontend not built (run: cd the-hub && npm run build)"
fi
echo ""

# Scripts
echo -e "${BLUE}🔍 Checking scripts...${NC}"

SCRIPTS=(
    "scripts/setup.sh"
    "scripts/setupCredentials.sh"
    "scripts/setupDatabase.sh"
    "scripts/generateBlogPosts.js"
    "scripts/securityAudit.js"
    "scripts/performanceBenchmark.js"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            check_pass "$(basename $script) exists and is executable"
        else
            check_warn "$(basename $script) exists but not executable"
        fi
    else
        check_fail "$(basename $script) missing"
    fi
done
echo ""

# Documentation
echo -e "${BLUE}🔍 Checking documentation...${NC}"

DOCS=(
    "README.md"
    "QUICK_START.md"
    "CREDENTIALS_SETUP.md"
    "TESTING_GUIDE.md"
    "FINAL_DEPLOYMENT_GUIDE.md"
)

DOC_COUNT=0
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        ((DOC_COUNT++))
    fi
done

if [ $DOC_COUNT -eq ${#DOCS[@]} ]; then
    check_pass "All documentation files present ($DOC_COUNT/${#DOCS[@]})"
elif [ $DOC_COUNT -gt 0 ]; then
    check_warn "Some documentation missing ($DOC_COUNT/${#DOCS[@]})"
else
    check_fail "Documentation missing"
fi
echo ""

# Port availability
echo -e "${BLUE}🔍 Checking port availability...${NC}"

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    check_warn "Port 3000 already in use (backend)"
else
    check_pass "Port 3000 available (backend)"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    check_warn "Port 5173 already in use (frontend)"
else
    check_pass "Port 5173 available (frontend)"
fi
echo ""

# Git
echo -e "${BLUE}🔍 Checking Git...${NC}"

if [ -d ".git" ]; then
    check_pass "Git repository initialized"

    # Check .gitignore
    if [ -f ".gitignore" ]; then
        if grep -q ".env" .gitignore; then
            check_pass ".env in .gitignore"
        else
            check_fail ".env NOT in .gitignore (security risk!)"
        fi
    else
        check_warn ".gitignore missing"
    fi
else
    check_warn "Not a Git repository"
fi
echo ""

# Summary
echo "=========================================="
echo -e "${BLUE}Verification Summary${NC}"
echo "=========================================="
echo ""

echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"
echo ""

# Overall status
if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 Perfect! Everything is configured correctly.${NC}"
        echo ""
        echo "You're ready to:"
        echo "  1. Start development: npm run dev && cd the-hub && npm run dev"
        echo "  2. Generate content: node scripts/generateBlogPosts.js"
        echo "  3. Run tests: npm test"
    else
        echo -e "${YELLOW}⚠️  Almost ready! Address warnings above.${NC}"
        echo ""
        if grep -q "placeholder" <(echo "$WARNINGS"); then
            echo "Configure credentials:"
            echo "  ./scripts/setupCredentials.sh"
        fi
    fi
else
    echo -e "${RED}❌ Setup incomplete. Fix errors above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  • Install dependencies: npm install && cd the-hub && npm install"
    echo "  • Configure credentials: ./scripts/setupCredentials.sh"
    echo "  • Set up database: ./scripts/setupDatabase.sh"
    echo ""
    exit 1
fi

echo ""
echo "📚 Need help? Check:"
echo "  • QUICK_START.md - Quick setup guide"
echo "  • CREDENTIALS_SETUP.md - Detailed credential configuration"
echo "  • COMMANDS.md - Common commands reference"
echo ""
