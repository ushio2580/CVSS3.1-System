#!/bin/bash
# SWR Build Script for CVSS System
# This script builds and pushes Docker images to SWR

set -e

# Configuration
SWR_REGISTRY="swr.cn-north-4.myhuaweicloud.com"
ORGANIZATION="cvss-system"
BACKEND_IMAGE="cvss-backend"
FRONTEND_IMAGE="cvss-frontend"
VERSION="latest"

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

echo "🚀 SWR Build Script for CVSS System"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if user is logged in to SWR
print_info "Checking SWR login status..."
if ! docker info | grep -q "Username"; then
    print_warning "Not logged in to SWR. Please login first:"
    echo "docker login $SWR_REGISTRY"
    echo ""
    read -p "Press Enter after logging in to SWR..."
fi

# Build backend image
print_info "Building backend image..."
docker build -f docker/Dockerfile.backend.swr -t $SWR_REGISTRY/$ORGANIZATION/$BACKEND_IMAGE:$VERSION .
print_status "Backend image built successfully"

# Build frontend image
print_info "Building frontend image..."
docker build -f docker/Dockerfile.frontend.swr -t $SWR_REGISTRY/$ORGANIZATION/$FRONTEND_IMAGE:$VERSION .
print_status "Frontend image built successfully"

# Push backend image
print_info "Pushing backend image to SWR..."
docker push $SWR_REGISTRY/$ORGANIZATION/$BACKEND_IMAGE:$VERSION
print_status "Backend image pushed successfully"

# Push frontend image
print_info "Pushing frontend image to SWR..."
docker push $SWR_REGISTRY/$ORGANIZATION/$FRONTEND_IMAGE:$VERSION
print_status "Frontend image pushed successfully"

echo ""
print_status "SWR build completed successfully!"
echo ""
echo "📊 Images pushed to SWR:"
echo "  Backend: $SWR_REGISTRY/$ORGANIZATION/$BACKEND_IMAGE:$VERSION"
echo "  Frontend: $SWR_REGISTRY/$ORGANIZATION/$FRONTEND_IMAGE:$VERSION"
echo ""
echo "🎯 Next steps:"
echo "  1. Configure CodeArts Build Task"
echo "  2. Set up SWR credentials in CodeArts"
echo "  3. Execute deployment task"
echo ""
echo "✅ Ready for CodeArts deployment!"
