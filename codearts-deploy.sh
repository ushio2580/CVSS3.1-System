#!/bin/bash

# CVSS System CodeArts Deployment Script
# This script is designed to run directly in CodeArts pipeline

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

# Configuration variables
APP_NAME="cvss-system"
APP_DIR="/opt/cvss-system"
LOG_DIR="/var/log/cvss-system"
SERVICE_USER="cvss"
PYTHON_VERSION="3.12"
NODE_VERSION="18"

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

echo "🚀 CVSS System CodeArts Deployment Script"
echo "=========================================="
echo ""

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. This is expected in CodeArts."
    else
        print_warning "Not running as root. Some operations may require sudo."
    fi
}

# Update system packages
update_system() {
    print_info "Updating system packages..."
    yum update -y
    print_status "System packages updated"
}

# Install Python 3.12
install_python() {
    print_info "Installing Python 3.12..."
    
    # Install EPEL repository
    yum install -y epel-release
    
    # Install Python 3.12
    yum install -y python3.12 python3.12-pip python3.12-devel
    
    # Create symlink
    ln -sf /usr/bin/python3.12 /usr/bin/python3
    
    # Verify installation
    python3 --version
    print_status "Python 3.12 installed successfully"
}

# Install Node.js 18
install_nodejs() {
    print_info "Installing Node.js 18..."
    
    # Install NodeSource repository
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    
    # Install Node.js
    yum install -y nodejs
    
    # Verify installation
    node --version
    npm --version
    print_status "Node.js 18 installed successfully"
}

# Install PostgreSQL
install_postgresql() {
    print_info "Installing PostgreSQL..."
    
    # Install PostgreSQL
    yum install -y postgresql postgresql-server postgresql-devel
    
    # Initialize database
    postgresql-setup initdb
    
    # Start and enable PostgreSQL
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
}

# Install system dependencies
install_dependencies() {
    print_info "Installing system dependencies..."
    
    # Install development tools
    yum groupinstall -y "Development Tools"
    
    # Install additional packages
    yum install -y git curl wget unzip
    
    # Install build dependencies
    yum install -y gcc gcc-c++ make
    
    print_status "System dependencies installed"
}

# Create application user
create_user() {
    print_info "Creating application user..."
    
    # Create user if it doesn't exist
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d "$APP_DIR" "$SERVICE_USER"
        print_status "User $SERVICE_USER created"
    else
        print_info "User $SERVICE_USER already exists"
    fi
}

# Setup application directory
setup_app_directory() {
    print_info "Setting up application directory..."
    
    # Create directories
    mkdir -p "$APP_DIR"
    mkdir -p "$LOG_DIR"
    
    # Set ownership
    chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$LOG_DIR"
    
    print_status "Application directory setup completed"
}

# Clone and deploy application
deploy_application() {
    print_info "Cloning and deploying application..."
    
    # Clone repository
    git clone https://github.com/ushio2580/CVSS3.1-System.git /tmp/cvss-system
    cd /tmp/cvss-system
    
    # Copy application files
    cp -r backend "$APP_DIR/"
    cp -r frontend "$APP_DIR/"
    cp docker-compose.yml "$APP_DIR/"
    cp install.sh "$APP_DIR/"
    
    # Set ownership
    chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
    
    # Clean up
    rm -rf /tmp/cvss-system
    
    print_status "Application deployed successfully"
}

# Setup backend
setup_backend() {
    print_info "Setting up backend..."
    
    cd "$APP_DIR/backend"
    
    # Create virtual environment
    sudo -u "$SERVICE_USER" python3 -m venv venv
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    sudo -u "$SERVICE_USER" pip install --upgrade pip
    sudo -u "$SERVICE_USER" pip install -r requirements.txt
    
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
    sudo -u "$SERVICE_USER" python init_db.py
    
    print_status "Backend setup completed"
}

# Setup frontend
setup_frontend() {
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
}

# Create systemd services
create_services() {
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
}

# Configure firewall
configure_firewall() {
    print_info "Configuring firewall..."
    
    # Install firewalld if not present
    yum install -y firewalld
    
    # Start and enable firewalld
    systemctl start firewalld
    systemctl enable firewalld
    
    # Open ports
    firewall-cmd --permanent --add-port=$BACKEND_PORT/tcp
    firewall-cmd --permanent --add-port=$FRONTEND_PORT/tcp
    firewall-cmd --permanent --add-port=22/tcp  # SSH
    firewall-cmd --permanent --add-port=80/tcp  # HTTP
    firewall-cmd --permanent --add-port=443/tcp # HTTPS
    
    # Reload firewall
    firewall-cmd --reload
    
    print_status "Firewall configured"
}

# Start services
start_services() {
    print_info "Starting services..."
    
    # Start and enable services
    systemctl start cvss-backend
    systemctl enable cvss-backend
    
    systemctl start cvss-frontend
    systemctl enable cvss-frontend
    
    # Check status
    systemctl status cvss-backend --no-pager
    systemctl status cvss-frontend --no-pager
    
    print_status "Services started successfully"
}

# Health check
health_check() {
    print_info "Running health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend
    if curl -f "http://$BACKEND_HOST:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
        print_status "Backend health check passed"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -f "http://$FRONTEND_HOST:$FRONTEND_PORT" > /dev/null 2>&1; then
        print_status "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        return 1
    fi
    
    print_status "All health checks passed"
}

# Main deployment function
main() {
    echo "Starting CVSS System deployment in CodeArts..."
    echo ""
    
    # Run deployment steps
    check_root
    update_system
    install_python
    install_nodejs
    install_postgresql
    install_dependencies
    create_user
    setup_app_directory
    deploy_application
    setup_backend
    setup_frontend
    create_services
    configure_firewall
    start_services
    health_check
    
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
}

# Run main function
main "$@"
