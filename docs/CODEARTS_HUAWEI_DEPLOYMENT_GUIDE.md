# CVSS System - CodeArts Huawei Cloud Deployment Guide

## 🎯 Overview

This comprehensive guide will walk you through deploying the CVSS Scoring System to Huawei Cloud using CodeArts CI/CD on CentOS ECS instances.

## 📋 Prerequisites

### Required Accounts
- **Huawei Cloud Account** with CodeArts access
- **ECS Instance** running CentOS 7.9
- **GitHub Repository** access: [CVSS3.1-System](https://github.com/ushio2580/CVSS3.1-System)

### Required Tools
- Git client
- SSH access to ECS instance
- CodeArts CLI (optional)

## 🚀 Step-by-Step Deployment

### Step 1: Prepare ECS Instance

#### 1.1 Connect to Your ECS Instance
```bash
# SSH to your ECS instance
ssh root@your-ecs-ip-address

# Or if using key pair
ssh -i your-key.pem centos@your-ecs-ip-address
```

#### 1.2 Update System
```bash
# Update CentOS packages
sudo yum update -y

# Install essential tools
sudo yum install -y git curl wget unzip
```

#### 1.3 Configure Firewall
```bash
# Install and start firewalld
sudo yum install -y firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Open required ports
sudo firewall-cmd --permanent --add-port=5000/tcp  # Backend
sudo firewall-cmd --permanent --add-port=3000/tcp  # Frontend
sudo firewall-cmd --permanent --add-port=22/tcp    # SSH
sudo firewall-cmd --permanent --add-port=80/tcp    # HTTP
sudo firewall-cmd --permanent --add-port=443/tcp   # HTTPS

# Reload firewall
sudo firewall-cmd --reload
```

### Step 2: Setup CodeArts Project

#### 2.1 Create CodeArts Project
1. **Login to Huawei Cloud Console**
   ```
   https://console.huaweicloud.com/
   ```

2. **Navigate to CodeArts**
   - Go to Services → Development → CodeArts
   - Click "Create Project"

3. **Configure Project Settings**
   ```
   Project Name: CVSS-Scoring-System
   Project Type: DevOps
   Template: Custom
   Description: CVSS Scoring System with Document Analysis
   ```

#### 2.2 Connect Repository
1. **Import Source Code**
   - Go to Code → Repositories
   - Click "Import Repository"
   - Select "GitHub" as source
   - Enter repository URL: `https://github.com/ushio2580/CVSS3.1-System.git`

2. **Configure Branch Protection**
   - Go to Code → Branches
   - Set main branch as protected
   - Require pull request reviews

### Step 3: Configure CI/CD Pipeline

#### 3.1 Create Pipeline
1. **Navigate to Pipelines**
   - Go to CI/CD → Pipelines
   - Click "Create Pipeline"

2. **Configure Pipeline**
   ```
   Pipeline Name: CVSS-System-Deployment
   Source: GitHub Repository
   Branch: main
   Trigger: Push to main branch
   ```

#### 3.2 Upload Pipeline Configuration
1. **Upload Pipeline File**
   - Go to Pipeline → Configuration
   - Upload `config/codearts-pipeline.yml`
   - Review and save configuration

#### 3.3 Configure Quality Gates
1. **Upload Quality Gate**
   - Go to Quality → Quality Gates
   - Upload `config/codearts-quality-gate-huawei.yml`
   - Configure quality criteria

### Step 4: Setup Environment Variables

#### 4.1 Backend Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://cvss_user:cvss_password@localhost:5432/cvss_db
SQLALCHEMY_DATABASE_URI=postgresql://cvss_user:cvss_password@localhost:5432/cvss_db

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ACCESS_TOKEN_EXPIRES=3600

# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-flask-secret-key-here

# CORS Configuration
CORS_ORIGINS=http://your-ecs-ip:5000,http://your-ecs-ip:3000

# File Upload Configuration
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=uploads

# API Configuration
API_VERSION=v1
```

#### 4.2 Frontend Environment Variables
```bash
# API Configuration
VITE_API_URL=http://your-ecs-ip:5000/api

# Application Configuration
VITE_APP_NAME=CVSS Scoring System
VITE_APP_VERSION=1.0.0

# Production Configuration
VITE_DEV_MODE=false
```

### Step 5: Deploy to ECS

#### 5.1 Manual Deployment (Option A)
```bash
# Clone repository to ECS
git clone https://github.com/ushio2580/CVSS3.1-System.git
cd CVSS3.1-System

# Run deployment script
sudo chmod +x config/ecs-deployment.sh
sudo ./config/ecs-deployment.sh
```

#### 5.2 Automated Deployment (Option B)
1. **Configure CodeArts Deployment**
   - Go to Pipeline → Deployment
   - Add ECS deployment step
   - Configure SSH connection to ECS
   - Upload deployment script

2. **Run Pipeline**
   - Trigger pipeline manually or on push
   - Monitor deployment progress
   - Check deployment logs

### Step 6: Verify Deployment

#### 6.1 Check Service Status
```bash
# Check backend service
sudo systemctl status cvss-backend

# Check frontend service
sudo systemctl status cvss-frontend

# Check PostgreSQL
sudo systemctl status postgresql
```

#### 6.2 Test Application
```bash
# Test backend API
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:3000

# Test from external IP
curl http://your-ecs-ip:5000/api/health
curl http://your-ecs-ip:3000
```

#### 6.3 Check Logs
```bash
# Backend logs
tail -f /var/log/cvss-system/backend.log

# Frontend logs
tail -f /var/log/cvss-system/frontend.log

# System logs
journalctl -u cvss-backend -f
journalctl -u cvss-frontend -f
```

## 🔧 Configuration Files

### Pipeline Configuration
- **File**: `config/codearts-pipeline.yml`
- **Purpose**: Defines CI/CD pipeline stages
- **Includes**: Build, test, security scan, deployment

### Quality Gate Configuration
- **File**: `config/codearts-quality-gate-huawei.yml`
- **Purpose**: Defines quality standards
- **Includes**: Coverage, security, performance requirements

### Deployment Script
- **File**: `config/ecs-deployment.sh`
- **Purpose**: Automated ECS deployment
- **Includes**: System setup, application deployment, service configuration

## 📊 Monitoring and Maintenance

### Application Monitoring
```bash
# Check service status
sudo systemctl status cvss-backend cvss-frontend

# Check resource usage
top
htop
df -h
free -h

# Check network connections
netstat -tlnp
ss -tlnp
```

### Log Management
```bash
# Rotate logs
sudo logrotate -f /etc/logrotate.d/cvss-system

# Clean old logs
sudo find /var/log/cvss-system -name "*.log" -mtime +30 -delete
```

### Backup Strategy
```bash
# Database backup
sudo -u postgres pg_dump cvss_db > /backup/cvss_db_$(date +%Y%m%d).sql

# Application backup
sudo tar -czf /backup/cvss-system_$(date +%Y%m%d).tar.gz /opt/cvss-system
```

## 🛡️ Security Considerations

### System Security
```bash
# Update system regularly
sudo yum update -y

# Configure SSH security
sudo vim /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# Install fail2ban
sudo yum install -y epel-release
sudo yum install -y fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### Application Security
- Use strong passwords for database
- Rotate JWT secrets regularly
- Enable HTTPS with SSL certificates
- Implement rate limiting
- Regular security updates

## 🆘 Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check service status
sudo systemctl status cvss-backend

# Check logs
journalctl -u cvss-backend -n 50

# Check configuration
sudo -u cvss cat /opt/cvss-system/backend/.env
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connection
sudo -u postgres psql -c "SELECT version();"

# Check database exists
sudo -u postgres psql -c "\l"
```

#### 3. Port Access Issues
```bash
# Check if ports are open
sudo firewall-cmd --list-ports

# Check if services are listening
sudo netstat -tlnp | grep :5000
sudo netstat -tlnp | grep :3000
```

#### 4. Permission Issues
```bash
# Check file ownership
ls -la /opt/cvss-system/

# Fix ownership
sudo chown -R cvss:cvss /opt/cvss-system/
sudo chown -R cvss:cvss /var/log/cvss-system/
```

### Support Resources
- **CodeArts Documentation**: https://support.huaweicloud.com/codearts/
- **ECS Documentation**: https://support.huaweicloud.com/ecs/
- **CentOS Documentation**: https://www.centos.org/docs/

## 📞 Contact and Support

- **Repository**: [CVSS3.1-System](https://github.com/ushio2580/CVSS3.1-System)
- **Issues**: Create GitHub issues for bugs/features
- **Documentation**: Check the `docs/` folder
- **Deployment Scripts**: Check the `config/` folder

---

**Repository**: [CVSS3.1-System](https://github.com/ushio2580/CVSS3.1-System)  
**Last Updated**: September 2025  
**Version**: 1.0.0  
**Maintained by**: CVSS Development Team
