#!/bin/bash

# Scheduler Testing Script
# Tests the automated scraper scheduler system

BASE_URL=${1:-"http://localhost:3000"}
echo "Testing scheduler at: $BASE_URL"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local expected_status=${4:-200}
  local data=$5

  echo -n "Testing: $name ... "

  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    if [ -z "$data" ]; then
      response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    else
      response=$(curl -s -w "\n%{http_code}" -X "$method" \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$BASE_URL$endpoint")
    fi
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" == "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))

    # Pretty print JSON response (first 200 chars)
    if [ ! -z "$body" ]; then
      echo "$body" | jq -C '.' 2>/dev/null | head -c 200
      echo "..."
    fi
  else
    echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "Response: $body"
  fi

  echo ""
}

# Test 1: Health Check
echo -e "${YELLOW}=== Basic Health Checks ===${NC}"
test_endpoint "API Health Check" "GET" "/health" 200
test_endpoint "Admin Scraper Health" "GET" "/admin/scraper/health" 200

# Test 2: Status Endpoints
echo -e "${YELLOW}=== Status Endpoints ===${NC}"
test_endpoint "Get Scraper Status" "GET" "/admin/scraper/status" 200
test_endpoint "Get Scraper Stats" "GET" "/admin/scraper/stats" 200

# Test 3: Control Operations
echo -e "${YELLOW}=== Control Operations ===${NC}"
test_endpoint "Pause Scraping" "POST" "/admin/scraper/pause" 200
sleep 2
test_endpoint "Resume Scraping" "POST" "/admin/scraper/resume" 200

# Test 4: Manual Triggers
echo -e "${YELLOW}=== Manual Triggers ===${NC}"
test_endpoint "Trigger Reddit Scraper" "POST" "/admin/scraper/run/reddit" 200
sleep 5
test_endpoint "Trigger All Scrapers" "POST" "/admin/scraper/run" 200

# Test 5: Source Management
echo -e "${YELLOW}=== Source Management ===${NC}"
# This will fail if source is already enabled, which is fine
test_endpoint "Enable Reddit Source" "POST" "/admin/scraper/enable/reddit" 200

# Test 6: Verify Data
echo -e "${YELLOW}=== Data Verification ===${NC}"
test_endpoint "Get Scraped Listings" "GET" "/scraper/listings?limit=5" 200
test_endpoint "Get Scraper Sources" "GET" "/scraper/sources" 200

# Summary
echo ""
echo "========================================"
echo -e "Test Results:"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo "========================================"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed! ✓${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. ✗${NC}"
  exit 1
fi
