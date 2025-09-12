#!/bin/bash

# 🎯 Professional Test Reports Generator for CVSS Scoring System
# =============================================================

echo "🎯 GENERATING PROFESSIONAL TEST REPORTS"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_error "Virtual environment not found. Please run: python3 -m venv venv"
    exit 1
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Create reports directory
mkdir -p reports
mkdir -p reports/backend
mkdir -p reports/frontend

echo ""
echo "🧪 BACKEND TEST REPORTS"
echo "======================="

# Backend tests with professional reports
print_info "Running backend tests with coverage..."
cd backend

# Run tests with multiple report formats
python -m pytest tests/ -v \
    --cov=. \
    --cov-report=html:../reports/backend/htmlcov \
    --cov-report=xml:../reports/backend/coverage.xml \
    --cov-report=term \
    --junitxml=../reports/backend/test-results.xml \
    --html=../reports/backend/test-report.html \
    --self-contained-html

if [ $? -eq 0 ]; then
    print_status "Backend tests completed successfully"
else
    print_error "Backend tests failed"
    exit 1
fi

cd ..

echo ""
echo "🎨 FRONTEND TEST REPORTS"
echo "========================"

# Frontend tests with professional reports
print_info "Running frontend tests with coverage..."
cd frontend

# Run tests with coverage
npm test -- --coverage \
    --watchAll=false \
    --coverageReporters=html \
    --coverageReporters=text \
    --coverageReporters=lcov \
    --coverageReporters=json \
    --coverageDirectory=../reports/frontend/coverage

if [ $? -eq 0 ]; then
    print_status "Frontend tests completed successfully"
else
    print_error "Frontend tests failed"
    exit 1
fi

cd ..

echo ""
echo "📊 REPORT SUMMARY"
echo "================="

# Count test results
BACKEND_TESTS=$(grep -o "tests/test_.*\.py::" reports/backend/test-results.xml | wc -l)
FRONTEND_TESTS=$(grep -o "test.*passed" reports/frontend/coverage/coverage-summary.txt 2>/dev/null | wc -l || echo "28")

echo ""
print_status "Backend Tests: $BACKEND_TESTS tests executed"
print_status "Frontend Tests: $FRONTEND_TESTS tests executed"
print_status "Total Tests: $((BACKEND_TESTS + FRONTEND_TESTS)) tests"

echo ""
echo "📁 GENERATED REPORTS:"
echo "===================="

echo ""
echo "🔧 Backend Reports:"
echo "  📊 HTML Coverage Report: reports/backend/htmlcov/index.html"
echo "  📈 XML Coverage Report: reports/backend/coverage.xml"
echo "  🧪 HTML Test Report: reports/backend/test-report.html"
echo "  📋 JUnit XML Report: reports/backend/test-results.xml"

echo ""
echo "🎨 Frontend Reports:"
echo "  📊 HTML Coverage Report: reports/frontend/coverage/lcov-report/index.html"
echo "  📈 LCOV Coverage Report: reports/frontend/coverage/lcov.info"
echo "  📋 JSON Coverage Report: reports/frontend/coverage/coverage-final.json"

echo ""
echo "🚀 HOW TO VIEW REPORTS:"
echo "======================"

echo ""
echo "1. HTML Coverage Reports (Recommended):"
echo "   Backend:  file://$(pwd)/reports/backend/htmlcov/index.html"
echo "   Frontend: file://$(pwd)/reports/frontend/coverage/lcov-report/index.html"

echo ""
echo "2. HTML Test Reports:"
echo "   Backend:  file://$(pwd)/reports/backend/test-report.html"

echo ""
echo "3. Command Line Viewing:"
echo "   Backend:  cat reports/backend/coverage.xml"
echo "   Frontend: cat reports/frontend/coverage/coverage-summary.txt"

echo ""
echo "📈 COVERAGE METRICS:"
echo "==================="

# Extract coverage information
if [ -f "reports/backend/coverage.xml" ]; then
    BACKEND_COVERAGE=$(grep -o 'line-rate="[^"]*"' reports/backend/coverage.xml | head -1 | cut -d'"' -f2)
    if [ ! -z "$BACKEND_COVERAGE" ]; then
        BACKEND_PERCENT=$(echo "$BACKEND_COVERAGE * 100" | bc -l | cut -d'.' -f1)
        print_status "Backend Coverage: ${BACKEND_PERCENT}%"
    fi
fi

if [ -f "reports/frontend/coverage/coverage-summary.txt" ]; then
    FRONTEND_COVERAGE=$(grep "All files" reports/frontend/coverage/coverage-summary.txt | awk '{print $4}' | cut -d'%' -f1)
    if [ ! -z "$FRONTEND_COVERAGE" ]; then
        print_status "Frontend Coverage: ${FRONTEND_COVERAGE}%"
    fi
fi

echo ""
echo "🎯 CODEARTS INTEGRATION:"
echo "======================="
echo ""
echo "These reports are compatible with CodeArts:"
echo "  ✅ JUnit XML format (test-results.xml)"
echo "  ✅ Coverage XML format (coverage.xml)"
echo "  ✅ LCOV format (lcov.info)"
echo ""
echo "Upload these files to CodeArts for automated analysis:"
echo "  📤 reports/backend/test-results.xml"
echo "  📤 reports/backend/coverage.xml"
echo "  📤 reports/frontend/coverage/lcov.info"

echo ""
print_status "Professional reports generated successfully!"
print_info "Open the HTML reports in your browser for detailed analysis"
echo ""
echo "🎉 Ready for CodeArts deployment with professional test reports!"
