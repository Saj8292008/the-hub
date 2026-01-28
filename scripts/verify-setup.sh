#!/bin/bash

# The Hub - Setup Verification Script
# Tests all major systems to ensure proper configuration
# Run after completing QUICK_START_GUIDE.md

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    The Hub - Setup Verification Script            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Counter for pass/fail
PASSED=0
FAILED=0
WARNINGS=0

# Function to check if server is running
check_server() {
    echo -e "${YELLOW}[1/10]${NC} Checking if backend server is running..."
    if curl -s "${API_URL}/health" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Backend server is running on ${API_URL}"
        ((PASSED++))
        return 0
    else
        echo -e "  ${RED}✗${NC} Backend server is NOT running"
        echo -e "  ${RED}→${NC} Start with: npm run dev"
        ((FAILED++))
        return 1
    fi
}

# Function to check frontend
check_frontend() {
    echo -e "\n${YELLOW}[2/10]${NC} Checking if frontend is running..."
    if curl -s "${FRONTEND_URL}" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Frontend is running on ${FRONTEND_URL}"
        ((PASSED++))
        return 0
    else
        echo -e "  ${RED}✗${NC} Frontend is NOT running"
        echo -e "  ${RED}→${NC} Start with: cd the-hub && npm run dev"
        ((FAILED++))
        return 1
    fi
}

# Function to check scraper scheduler
check_scraper_scheduler() {
    echo -e "\n${YELLOW}[3/10]${NC} Checking scraper scheduler status..."
    RESPONSE=$(curl -s "${API_URL}/api/scraper-debug/scheduler/status" 2>/dev/null || echo '{"success":false}')

    IS_RUNNING=$(echo "$RESPONSE" | grep -o '"isRunning":[^,}]*' | cut -d':' -f2 | tr -d ' ')

    if [ "$IS_RUNNING" = "true" ]; then
        echo -e "  ${GREEN}✓${NC} Scraper scheduler is running"
        ACTIVE_JOBS=$(echo "$RESPONSE" | grep -o '"activeJobs":[0-9]*' | cut -d':' -f2)
        echo -e "    Active jobs: ${ACTIVE_JOBS}"
        ((PASSED++))
        return 0
    else
        echo -e "  ${RED}✗${NC} Scraper scheduler is NOT running"
        echo -e "  ${RED}→${NC} Check .env: ENABLE_SCRAPER_SCHEDULER=true"
        ((FAILED++))
        return 1
    fi
}

# Function to check newsletter scheduler
check_newsletter_scheduler() {
    echo -e "\n${YELLOW}[4/10]${NC} Checking newsletter scheduler status..."
    RESPONSE=$(curl -s "${API_URL}/api/newsletter/scheduler/status" 2>/dev/null || echo '{"isRunning":false}')

    IS_RUNNING=$(echo "$RESPONSE" | grep -o '"isRunning":[^,}]*' | cut -d':' -f2 | tr -d ' ')

    if [ "$IS_RUNNING" = "true" ]; then
        echo -e "  ${GREEN}✓${NC} Newsletter scheduler is running"
        ((PASSED++))
        return 0
    else
        echo -e "  ${RED}✗${NC} Newsletter scheduler is NOT running"
        echo -e "  ${RED}→${NC} Check .env: ENABLE_NEWSLETTER_SCHEDULER=true"
        ((FAILED++))
        return 1
    fi
}

# Function to test scraper trigger
test_scraper_trigger() {
    echo -e "\n${YELLOW}[5/10]${NC} Testing manual scraper trigger..."
    RESPONSE=$(curl -s -X POST "${API_URL}/api/scraper-debug/trigger/reddit" 2>/dev/null || echo '{"success":false}')

    SUCCESS=$(echo "$RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2 | tr -d ' ')

    if [ "$SUCCESS" = "true" ]; then
        ITEMS_FOUND=$(echo "$RESPONSE" | grep -o '"itemsFound":[0-9]*' | cut -d':' -f2)
        DURATION=$(echo "$RESPONSE" | grep -o '"duration":[0-9]*' | cut -d':' -f2)
        echo -e "  ${GREEN}✓${NC} Reddit scraper trigger successful"
        echo -e "    Items found: ${ITEMS_FOUND}"
        echo -e "    Duration: ${DURATION}ms"
        ((PASSED++))
        return 0
    else
        ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo -e "  ${RED}✗${NC} Reddit scraper trigger failed"
        echo -e "  ${RED}→${NC} Error: ${ERROR}"
        ((FAILED++))
        return 1
    fi
}

# Function to check scraper logs
check_scraper_logs() {
    echo -e "\n${YELLOW}[6/10]${NC} Checking scraper logs..."
    RESPONSE=$(curl -s "${API_URL}/api/scraper-debug/logs?limit=5" 2>/dev/null || echo '{"success":false}')

    SUCCESS=$(echo "$RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2 | tr -d ' ')

    if [ "$SUCCESS" = "true" ]; then
        LOG_COUNT=$(echo "$RESPONSE" | grep -o '"logs":\[' | wc -l)
        echo -e "  ${GREEN}✓${NC} Scraper logs are accessible"
        echo -e "    Recent logs available"
        ((PASSED++))
        return 0
    else
        echo -e "  ${RED}✗${NC} Cannot access scraper logs"
        echo -e "  ${RED}→${NC} Check if scraper_logs table exists in database"
        ((FAILED++))
        return 1
    fi
}

# Function to check database connection
check_database() {
    echo -e "\n${YELLOW}[7/10]${NC} Checking database connection..."
    RESPONSE=$(curl -s "${API_URL}/api/scraper-debug/health" 2>/dev/null || echo '{"success":false}')

    SUCCESS=$(echo "$RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2 | tr -d ' ')

    if [ "$SUCCESS" = "true" ]; then
        echo -e "  ${GREEN}✓${NC} Database connection successful"
        ((PASSED++))
        return 0
    else
        echo -e "  ${RED}✗${NC} Database connection failed"
        echo -e "  ${RED}→${NC} Check Supabase credentials in .env"
        ((FAILED++))
        return 1
    fi
}

# Function to test newsletter subscription
test_newsletter_subscription() {
    echo -e "\n${YELLOW}[8/10]${NC} Testing newsletter subscription API..."

    # Generate random email for testing
    RANDOM_EMAIL="test-$(date +%s)@example.com"

    RESPONSE=$(curl -s -X POST "${API_URL}/api/newsletter/subscribe" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${RANDOM_EMAIL}\",\"name\":\"Test User\",\"source\":\"verification_test\"}" \
        2>/dev/null || echo '{"success":false}')

    SUCCESS=$(echo "$RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2 | tr -d ' ')

    if [ "$SUCCESS" = "true" ]; then
        echo -e "  ${GREEN}✓${NC} Newsletter subscription API working"
        echo -e "    Test subscriber created: ${RANDOM_EMAIL}"
        echo -e "    ${YELLOW}Note:${NC} Check this email for confirmation"
        ((PASSED++))
        return 0
    else
        ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo -e "  ${RED}✗${NC} Newsletter subscription failed"
        echo -e "  ${RED}→${NC} Error: ${ERROR}"
        echo -e "  ${RED}→${NC} Check if newsletter tables exist in database"
        ((FAILED++))
        return 1
    fi
}

# Function to check Resend API key
check_resend_api() {
    echo -e "\n${YELLOW}[9/10]${NC} Checking Resend API configuration..."

    if grep -q "RESEND_API_KEY=re_" .env; then
        API_KEY=$(grep "RESEND_API_KEY" .env | cut -d'=' -f2)
        if [ ! -z "$API_KEY" ] && [ "$API_KEY" != "your_resend_api_key_here" ]; then
            echo -e "  ${GREEN}✓${NC} Resend API key is configured"
            echo -e "    Key: ${API_KEY:0:10}..."
            ((PASSED++))
            return 0
        fi
    fi

    echo -e "  ${YELLOW}⚠${NC} Resend API key may not be configured"
    echo -e "  ${YELLOW}→${NC} Check .env: RESEND_API_KEY=re_xxxxx"
    echo -e "  ${YELLOW}→${NC} Get key from: https://resend.com/api-keys"
    ((WARNINGS++))
    return 1
}

# Function to check OpenAI API key
check_openai_api() {
    echo -e "\n${YELLOW}[10/10]${NC} Checking OpenAI API configuration..."

    if grep -q "OPENAI_API_KEY=sk-" .env; then
        API_KEY=$(grep "OPENAI_API_KEY" .env | cut -d'=' -f2)
        if [ ! -z "$API_KEY" ] && [ "$API_KEY" != "your_openai_api_key_here" ]; then
            echo -e "  ${GREEN}✓${NC} OpenAI API key is configured"
            echo -e "    Key: ${API_KEY:0:10}..."
            ((PASSED++))
            return 0
        fi
    fi

    echo -e "  ${YELLOW}⚠${NC} OpenAI API key may not be configured"
    echo -e "  ${YELLOW}→${NC} Check .env: OPENAI_API_KEY=sk-xxxxx"
    echo -e "  ${YELLOW}→${NC} Required for: AI blog generation, natural search, newsletter content"
    echo -e "  ${YELLOW}→${NC} Get key from: https://platform.openai.com/api-keys"
    ((WARNINGS++))
    return 1
}

# Run all checks
check_server || true
check_frontend || true
check_scraper_scheduler || true
check_newsletter_scheduler || true
test_scraper_trigger || true
check_scraper_logs || true
check_database || true
test_newsletter_subscription || true
check_resend_api || true
check_openai_api || true

# Print summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 VERIFICATION SUMMARY               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}✓ Passed:${NC}   ${PASSED}/10 checks"
echo -e "  ${RED}✗ Failed:${NC}   ${FAILED}/10 checks"
echo -e "  ${YELLOW}⚠ Warnings:${NC} ${WARNINGS}/10 checks"
echo ""

# Overall status
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         ✓ ALL SYSTEMS OPERATIONAL! 🚀              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Your Hub platform is fully operational!"
    echo ""
    echo -e "Next steps:"
    echo -e "  1. Access frontend: ${BLUE}${FRONTEND_URL}${NC}"
    echo -e "  2. Scraper dashboard: ${BLUE}${FRONTEND_URL}/admin/scraper-debug${NC}"
    echo -e "  3. Newsletter dashboard: ${BLUE}${FRONTEND_URL}/newsletter/admin${NC}"
    echo -e "  4. Admin settings: ${BLUE}${FRONTEND_URL}/admin${NC}"
    echo ""
    exit 0
elif [ $FAILED -le 3 ]; then
    echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║      ⚠ SOME ISSUES DETECTED - REVIEW ABOVE       ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Most systems are working, but some issues need attention."
    echo -e "Review the failed checks above and fix as needed."
    echo ""
    exit 1
else
    echo -e "${RED}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║       ✗ SETUP INCOMPLETE - FOLLOW GUIDE          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Multiple critical issues detected."
    echo -e "Please review QUICK_START_GUIDE.md and complete all steps."
    echo ""
    exit 1
fi
