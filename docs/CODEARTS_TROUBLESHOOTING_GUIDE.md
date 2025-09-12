# CodeArts Deployment Troubleshooting Guide

## 🚨 Problem Analysis

Based on your CodeArts deployment logs, the main issues were:

1. **File Not Found**: `config/ecs-deployment.sh` was not found
2. **Service Not Found**: `cvss-backend.service` and `cvss-frontend.service` were not found
3. **Connection Refused**: Backend and frontend services were not running
4. **Log Files Missing**: Log files were not created

## 🔧 Solution: Updated Pipeline Configuration

### Step 1: Use the Simplified Pipeline

Instead of the complex pipeline, use the simplified version:

**File**: `codearts-simple-pipeline.yml`

This pipeline:
- ✅ Runs directly in CodeArts without external dependencies
- ✅ Clones the repository automatically
- ✅ Sets up everything step by step
- ✅ Includes proper error handling and logging

### Step 2: Update Your CodeArts Pipeline

1. **Go to CodeArts Pipeline Configuration**
   - Navigate to your pipeline settings
   - Replace the current pipeline configuration

2. **Upload the New Pipeline File**
   ```
   File: codearts-simple-pipeline.yml
   Location: Pipeline → Configuration → Upload YAML
   ```

3. **Configure Pipeline Settings**
   ```
   Pipeline Name: CVSS-System-Simple-Deployment
   Source: GitHub Repository
   Branch: main
   Trigger: Push to main branch
   ```

### Step 3: Alternative: Use the Standalone Script

If the pipeline still fails, use the standalone deployment script:

**File**: `codearts-deploy.sh`

This script:
- ✅ Runs independently without pipeline dependencies
- ✅ Includes all necessary setup steps
- ✅ Handles errors gracefully
- ✅ Provides detailed logging

## 🛠️ Manual Deployment Steps

If CodeArts pipeline continues to fail, follow these manual steps:

### Step 1: Connect to Your ECS Instance
```bash
ssh root@your-ecs-ip-address
```

### Step 2: Run the Deployment Script
```bash
# Download the deployment script
curl -o codearts-deploy.sh https://raw.githubusercontent.com/ushio2580/CVSS3.1-System/main/codearts-deploy.sh

# Make it executable
chmod +x codearts-deploy.sh

# Run the deployment
./codearts-deploy.sh
```

### Step 3: Verify Deployment
```bash
# Check service status
systemctl status cvss-backend
systemctl status cvss-frontend

# Test endpoints
curl http://localhost:5000/api/health
curl http://localhost:3000

# Check logs
tail -f /var/log/cvss-system/backend.log
tail -f /var/log/cvss-system/frontend.log
```

## 🔍 Common Issues and Solutions

### Issue 1: File Not Found Errors
**Problem**: Scripts or configuration files not found
**Solution**: 
- Ensure all files are in the repository
- Check file paths in pipeline configuration
- Use absolute paths instead of relative paths

### Issue 2: Permission Denied
**Problem**: Scripts cannot be executed
**Solution**:
```bash
# Make scripts executable
chmod +x *.sh

# Check file ownership
ls -la *.sh
```

### Issue 3: Service Won't Start
**Problem**: systemd services fail to start
**Solution**:
```bash
# Check service status
systemctl status cvss-backend

# Check service logs
journalctl -u cvss-backend -n 50

# Check configuration
cat /etc/systemd/system/cvss-backend.service
```

### Issue 4: Database Connection Issues
**Problem**: Cannot connect to PostgreSQL
**Solution**:
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check database connection
sudo -u postgres psql -c "SELECT version();"

# Check database exists
sudo -u postgres psql -c "\l"
```

### Issue 5: Port Access Issues
**Problem**: Cannot access application ports
**Solution**:
```bash
# Check if ports are open
firewall-cmd --list-ports

# Check if services are listening
netstat -tlnp | grep :5000
netstat -tlnp | grep :3000

# Open ports if needed
firewall-cmd --permanent --add-port=5000/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

## 📊 Debugging Commands

### Check System Status
```bash
# Check system resources
top
htop
df -h
free -h

# Check network connections
netstat -tlnp
ss -tlnp

# Check running processes
ps aux | grep python
ps aux | grep node
```

### Check Application Logs
```bash
# Backend logs
tail -f /var/log/cvss-system/backend.log
tail -f /var/log/cvss-system/backend-error.log

# Frontend logs
tail -f /var/log/cvss-system/frontend.log
tail -f /var/log/cvss-system/frontend-error.log

# System logs
journalctl -u cvss-backend -f
journalctl -u cvss-frontend -f
```

### Check Configuration Files
```bash
# Backend configuration
cat /opt/cvss-system/backend/.env

# Frontend configuration
cat /opt/cvss-system/frontend/.env

# Service configurations
cat /etc/systemd/system/cvss-backend.service
cat /etc/systemd/system/cvss-frontend.service
```

## 🚀 Quick Fix Commands

If you need to quickly fix the deployment:

```bash
# Stop all services
systemctl stop cvss-backend cvss-frontend

# Remove old services
rm -f /etc/systemd/system/cvss-*.service
systemctl daemon-reload

# Clean up application directory
rm -rf /opt/cvss-system

# Run the deployment script again
./codearts-deploy.sh
```

## 📞 Support

If you continue to have issues:

1. **Check the logs** for specific error messages
2. **Verify your ECS instance** has sufficient resources
3. **Ensure network connectivity** to GitHub
4. **Check firewall settings** on your ECS instance
5. **Verify PostgreSQL** is running and accessible

## 🎯 Next Steps

1. **Update your CodeArts pipeline** with the simplified configuration
2. **Test the deployment** in a staging environment first
3. **Monitor the logs** during deployment
4. **Set up monitoring** for the production environment
5. **Create backup procedures** for the database and application

---

**Repository**: [CVSS3.1-System](https://github.com/ushio2580/CVSS3.1-System)  
**Last Updated**: September 2025  
**Version**: 1.0.0  
**Maintained by**: CVSS Development Team
