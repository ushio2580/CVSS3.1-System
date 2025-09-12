#!/bin/bash

# CVSS System Direct CodeArts Deployment Script
# This script runs directly in CodeArts without external dependencies

set -e

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

echo "🚀 CVSS System Direct CodeArts Deployment"
echo "=========================================="
echo ""

# Configuration variables
APP_NAME="cvss-system"
APP_DIR="/opt/cvss-system"
LOG_DIR="/var/log/cvss-system"
SERVICE_USER="cvss"

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="cvss_db"
DB_USER="cvss_user"
DB_PASSWORD="cvss_password"

# Application configuration
BACKEND_PORT="5000"
FRONTEND_PORT="3000"
BACKEND_HOST="0.0.0.0"
FRONTEND_HOST="0.0.0.0"

# Step 1: Update system packages
print_info "Updating system packages..."
yum update -y
print_status "System packages updated"

# Step 2: Install Python 3.12
print_info "Installing Python 3.12..."
yum install -y epel-release
yum install -y python3.12 python3.12-pip python3.12-devel
ln -sf /usr/bin/python3.12 /usr/bin/python3
python3 --version
print_status "Python 3.12 installed successfully"

# Step 3: Install Node.js 18
print_info "Installing Node.js 18..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
node --version
npm --version
print_status "Node.js 18 installed successfully"

# Step 4: Install PostgreSQL
print_info "Installing PostgreSQL..."
yum install -y postgresql postgresql-server postgresql-devel
postgresql-setup initdb
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF
print_status "PostgreSQL installed and configured"

# Step 5: Install build tools
print_info "Installing build tools..."
yum groupinstall -y "Development Tools"
yum install -y git curl wget unzip gcc gcc-c++ make
print_status "Build tools installed"

# Step 6: Create application user
print_info "Creating application user..."
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$APP_DIR" "$SERVICE_USER"
    print_status "User $SERVICE_USER created"
else
    print_info "User $SERVICE_USER already exists"
fi

# Step 7: Setup application directory
print_info "Setting up application directory..."
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" "$LOG_DIR"
print_status "Application directory setup completed"

# Step 8: Clone and deploy application
print_info "Cloning and deploying application..."
git clone https://github.com/ushio2580/CVSS3.1-System.git /tmp/cvss-system
cd /tmp/cvss-system

# Copy application files
cp -r backend "$APP_DIR/"
cp -r frontend "$APP_DIR/"
cp docker-compose.yml "$APP_DIR/"
cp install.sh "$APP_DIR/"

# Set ownership
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
print_status "Application deployed successfully"

# Step 9: Setup backend
print_info "Setting up backend..."
cd "$APP_DIR/backend"

# Create virtual environment
sudo -u "$SERVICE_USER" python3 -m venv venv

# Install dependencies
sudo -u "$SERVICE_USER" ./venv/bin/pip install --upgrade pip
sudo -u "$SERVICE_USER" ./venv/bin/pip install -r requirements.txt

# Create .env file
sudo -u "$SERVICE_USER" cat > .env << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
SQLALCHEMY_DATABASE_URI=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
JWT_SECRET_KEY=your-production-jwt-secret-key-here
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-production-secret-key-here
CORS_ORIGINS=http://$BACKEND_HOST:$BACKEND_PORT
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=uploads
API_VERSION=v1
EOF

# Initialize database
sudo -u "$SERVICE_USER" ./venv/bin/python init_db.py
print_status "Backend setup completed"

# Step 10: Setup frontend
print_info "Setting up frontend..."
cd "$APP_DIR/frontend"

# Install dependencies
sudo -u "$SERVICE_USER" npm ci

# Create .env file
sudo -u "$SERVICE_USER" cat > .env << EOF
VITE_API_URL=http://$BACKEND_HOST:$BACKEND_PORT/api
VITE_APP_NAME=CVSS Scoring System
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=false
EOF

# Build application
sudo -u "$SERVICE_USER" npm run build
print_status "Frontend setup completed"

# Step 11: Create systemd services
print_info "Creating systemd services..."

# Backend service
cat > /etc/systemd/system/cvss-backend.service << EOF
[Unit]
Description=CVSS System Backend
After=network.target postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$APP_DIR/backend
Environment=PATH=$APP_DIR/backend/venv/bin
ExecStart=$APP_DIR/backend/venv/bin/python run.py
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/backend.log
StandardError=append:$LOG_DIR/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
cat > /etc/systemd/system/cvss-frontend.service << EOF
[Unit]
Description=CVSS System Frontend
After=network.target cvss-backend.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$APP_DIR/frontend
Environment=PATH=/usr/bin:/usr/local/bin
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/frontend.log
StandardError=append:$LOG_DIR/frontend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload
print_status "Systemd services created"

# Step 12: Configure firewall
print_info "Configuring firewall..."
yum install -y firewalld
systemctl start firewalld
systemctl enable firewalld

# Open ports
firewall-cmd --permanent --add-port=$BACKEND_PORT/tcp
firewall-cmd --permanent --add-port=$FRONTEND_PORT/tcp
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp

# Reload firewall
firewall-cmd --reload
print_status "Firewall configured"

# Step 13: Start services
print_info "Starting services..."
systemctl start cvss-backend
systemctl enable cvss-backend

systemctl start cvss-frontend
systemctl enable cvss-frontend

# Check status
systemctl status cvss-backend --no-pager
systemctl status cvss-frontend --no-pager
print_status "Services started successfully"

# Step 14: Health check
print_info "Running health checks..."
sleep 30

# Check backend
if curl -f "http://$BACKEND_HOST:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
    print_status "Backend health check passed"
else
    print_error "Backend health check failed"
    echo "Backend logs:"
    tail -20 $LOG_DIR/backend.log
    exit 1
fi

# Check frontend
if curl -f "http://$FRONTEND_HOST:$FRONTEND_PORT" > /dev/null 2>&1; then
    print_status "Frontend health check passed"
else
    print_error "Frontend health check failed"
    echo "Frontend logs:"
    tail -20 $LOG_DIR/frontend.log
    exit 1
fi

# Step 15: Cleanup
print_info "Cleaning up temporary files..."
rm -rf /tmp/cvss-system
npm cache clean --force
print_status "Cleanup completed"

echo ""
print_status "CVSS System deployed successfully in CodeArts!"
echo ""
echo "🎯 Application URLs:"
echo "  Backend: http://$BACKEND_HOST:$BACKEND_PORT"
echo "  Frontend: http://$FRONTEND_HOST:$FRONTEND_PORT"
echo ""
echo "📊 Service Status:"
echo "  Backend: systemctl status cvss-backend"
echo "  Frontend: systemctl status cvss-frontend"
echo ""
echo "📝 Logs:"
echo "  Backend: tail -f $LOG_DIR/backend.log"
echo "  Frontend: tail -f $LOG_DIR/frontend.log"
echo ""
print_status "CodeArts deployment completed successfully!"
