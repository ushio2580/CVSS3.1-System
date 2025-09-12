#!/bin/bash

# CVSS Scoring System - Installation Script
# This script sets up the complete CVSS system from scratch

set -e

echo "🚀 CVSS Scoring System - Installation Script"
echo "============================================="
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

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Python 3 is installed
check_python() {
    print_info "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_status "Python $PYTHON_VERSION found"
    else
        print_error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
}

# Check if Node.js is installed
check_node() {
    print_info "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js $NODE_VERSION found"
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_info "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm $NPM_VERSION found"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Setup backend
setup_backend() {
    print_info "Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    
    # Activate virtual environment
    print_info "Activating virtual environment..."
    source venv/bin/activate
    
    # Install dependencies
    print_info "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Create .env file from example
    if [ ! -f .env ]; then
        print_info "Creating .env file from example..."
        cp .env.example .env
        print_warning "Please edit backend/.env with your database credentials"
    fi
    
    cd ..
    print_status "Backend setup completed"
}

# Setup frontend
setup_frontend() {
    print_info "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_info "Installing Node.js dependencies..."
    npm install
    
    # Create .env file from example
    if [ ! -f .env ]; then
        print_info "Creating .env file from example..."
        cp .env.example .env
        print_warning "Please edit frontend/.env with your API URL"
    fi
    
    cd ..
    print_status "Frontend setup completed"
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    cd backend
    source venv/bin/activate
    
    # Initialize database
    print_info "Initializing database..."
    python init_db.py
    
    cd ..
    print_status "Database setup completed"
}

# Run tests
run_tests() {
    print_info "Running tests..."
    
    # Backend tests
    print_info "Running backend tests..."
    cd backend
    source venv/bin/activate
    python -m pytest tests/ -v
    cd ..
    
    # Frontend tests
    print_info "Running frontend tests..."
    cd frontend
    npm test -- --watchAll=false
    cd ..
    
    print_status "All tests completed"
}

# Main installation process
main() {
    echo "Starting installation process..."
    echo ""
    
    # Check prerequisites
    check_python
    check_node
    check_npm
    echo ""
    
    # Setup components
    setup_backend
    echo ""
    setup_frontend
    echo ""
    setup_database
    echo ""
    run_tests
    echo ""
    
    print_status "Installation completed successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Edit backend/.env with your database credentials"
    echo "2. Edit frontend/.env with your API URL"
    echo "3. Start the backend: cd backend && source venv/bin/activate && python run.py"
    echo "4. Start the frontend: cd frontend && npm run dev"
    echo ""
    echo "📚 For CodeArts deployment, see docs/CODEARTS_DEPLOYMENT_GUIDE.md"
    echo ""
    print_status "CVSS Scoring System is ready to use!"
}

# Run main function
main "$@"
