#!/bin/bash

# HSC Power - Run All Tests Script
# This script runs both backend and frontend tests

echo "HSC Power - Running All Tests"
echo "================================="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Backend Tests
echo ""
echo "${YELLOW}Running Backend Tests...${NC}"
cd backend
if npm test; then
    echo "${GREEN}Backend tests passed${NC}"
else
    echo "${RED}Backend tests failed${NC}"
    FAILURES=$((FAILURES + 1))
fi
cd ..

# Frontend Tests
echo ""
echo "${YELLOW}Running Frontend Tests...${NC}"
cd frontend
if npm test run; then
    echo "${GREEN}Frontend tests passed${NC}"
else
    echo "${RED}Frontend tests failed${NC}"
    FAILURES=$((FAILURES + 1))
fi
cd ..

# Summary
echo ""
echo "================================="
if [ $FAILURES -eq 0 ]; then
    echo "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo "${RED}$FAILURES test suite(s) failed${NC}"
    exit 1
fi

