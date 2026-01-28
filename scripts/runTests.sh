#!/bin/bash

# Automated Test Runner
# Runs all tests and generates reports

set -e

echo "=================================="
echo "  The Hub - Test Runner"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RUN_BACKEND_TESTS=${RUN_BACKEND_TESTS:-true}
RUN_FRONTEND_TESTS=${RUN_FRONTEND_TESTS:-true}
GENERATE_COVERAGE=${GENERATE_COVERAGE:-false}

echo -e "${BLUE}📋 Test Configuration${NC}"
echo "  Backend Tests: $RUN_BACKEND_TESTS"
echo "  Frontend Tests: $RUN_FRONTEND_TESTS"
echo "  Coverage Report: $GENERATE_COVERAGE"
echo ""

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if [ ! -f ".env.test" ]; then
  echo -e "${YELLOW}⚠️  .env.test not found, creating from template${NC}"
  cp .env.test.example .env.test || {
    echo -e "${RED}❌ Failed to create .env.test${NC}"
    exit 1
  }
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Install test dependencies
echo -e "${BLUE}📦 Installing test dependencies...${NC}"
npm install --include=dev || {
  echo -e "${RED}❌ Failed to install dependencies${NC}"
  exit 1
}
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Backend tests
if [ "$RUN_BACKEND_TESTS" = "true" ]; then
  echo -e "${BLUE}🧪 Running Backend Tests...${NC}"
  echo "=================================="

  if [ "$GENERATE_COVERAGE" = "true" ]; then
    npm run test:coverage || {
      echo -e "${RED}❌ Backend tests failed${NC}"
      exit 1
    }
  else
    npm run test:api || {
      echo -e "${RED}❌ Backend tests failed${NC}"
      exit 1
    }
  fi

  echo -e "${GREEN}✅ Backend tests passed${NC}"
  echo ""
fi

# Frontend tests
if [ "$RUN_FRONTEND_TESTS" = "true" ]; then
  echo -e "${BLUE}🧪 Running Frontend Tests...${NC}"
  echo "=================================="

  cd the-hub
  npm run test || {
    echo -e "${RED}❌ Frontend tests failed${NC}"
    exit 1
  }
  cd ..

  echo -e "${GREEN}✅ Frontend tests passed${NC}"
  echo ""
fi

# Integration tests
echo -e "${BLUE}🧪 Running Integration Tests...${NC}"
echo "=================================="

# Start test server in background
PORT=3001 NODE_ENV=test node src/api/server.js &
SERVER_PID=$!
echo "  Server started (PID: $SERVER_PID)"

# Wait for server to be ready
echo -n "  Waiting for server"
for i in {1..10}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}  ✅ Server ready${NC}"
    break
  fi
  echo -n "."
  sleep 1
done

# Run integration tests
npm run test || {
  echo -e "${RED}❌ Integration tests failed${NC}"
  kill $SERVER_PID 2>/dev/null
  exit 1
}

# Stop test server
kill $SERVER_PID 2>/dev/null || true
echo -e "${GREEN}✅ Integration tests passed${NC}"
echo ""

# Generate coverage report
if [ "$GENERATE_COVERAGE" = "true" ]; then
  echo -e "${BLUE}📊 Coverage Report:${NC}"
  echo "=================================="

  if [ -d "coverage" ]; then
    echo ""
    cat coverage/coverage-summary.txt 2>/dev/null || {
      echo "  HTML Report: ./coverage/index.html"
    }
  fi

  echo ""
fi

# Summary
echo "=================================="
echo -e "${GREEN}✅ All Tests Passed!${NC}"
echo "=================================="
echo ""

if [ "$GENERATE_COVERAGE" = "true" ]; then
  echo "📊 Coverage report: ./coverage/index.html"
fi

echo ""
echo "🎉 Testing complete!"

exit 0
