# CVSS Scoring System - GitHub Deployment Tutorial

## 🎯 Overview

This tutorial will guide you through deploying the CVSS Scoring System to your GitHub repository: [CVSS3.1-System](https://github.com/ushio2580/CVSS3.1-System)

## 📋 Prerequisites

- GitHub account with repository access
- Git installed locally
- Python 3.8+ and Node.js 16+ installed
- CodeArts account (optional, for CI/CD)

## 🚀 Step-by-Step Deployment

### Step 1: Initialize Git Repository

```bash
# Navigate to the clean project folder
cd cvss-system-clean

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: CVSS Scoring System clean installation

- Complete Flask backend with CVSS v3.1 calculator
- React frontend with Document Analyzer
- Database models and API routes
- Authentication and security features
- Professional documentation and deployment guides
- Ready for production deployment"
```

### Step 2: Connect to GitHub Repository

```bash
# Add remote origin (replace with your actual repository URL)
git remote add origin https://github.com/ushio2580/CVSS3.1-System.git

# Verify remote connection
git remote -v

# Push to GitHub
git push -u origin main
```

### Step 3: Configure Repository Settings

1. **Go to GitHub Repository Settings**
   - Navigate to [CVSS3.1-System](https://github.com/ushio2580/CVSS3.1-System)
   - Click "Settings" tab

2. **Configure Repository Details**
   ```
   Description: CVSS v3.1 Scoring System with Document Analysis
   Website: https://cvss-scoring-system.onrender.com
   Topics: cvss, vulnerability, security, flask, react, document-analysis
   ```

3. **Enable GitHub Pages** (Optional)
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / docs folder

### Step 4: Set Up GitHub Actions (CI/CD)

Create `.github/workflows/main.yml`:

```yaml
name: CVSS System CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.12'
    
    - name: Install dependencies
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        cd backend
        python -m pytest tests/ -v --cov=. --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run tests
      run: |
        cd frontend
        npm test -- --watchAll=false --coverage
    
    - name: Build
      run: |
        cd frontend
        npm run build

  deploy:
    needs: [backend-tests, frontend-tests]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Render
      run: |
        echo "Deploying backend to Render..."
        # Add Render deployment commands here
    
    - name: Deploy to Netlify
      run: |
        echo "Deploying frontend to Netlify..."
        # Add Netlify deployment commands here
```

### Step 5: Configure Environment Variables

1. **Backend Environment Variables**
   ```bash
   # For production deployment
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET_KEY=your-production-secret-key
   FLASK_ENV=production
   SECRET_KEY=your-production-flask-secret
   CORS_ORIGINS=https://your-frontend-domain.com
   ```

2. **Frontend Environment Variables**
   ```bash
   # For production deployment
   VITE_API_URL=https://your-backend-domain.com/api
   VITE_APP_NAME=CVSS Scoring System
   VITE_APP_VERSION=1.0.0
   VITE_DEV_MODE=false
   ```

### Step 6: Deploy to Production

#### Option A: Render.com (Backend)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New" → "Web Service"
   - Connect GitHub repository
   - Select `CVSS3.1-System` repository
   - Configure:
     ```
     Name: cvss-backend
     Environment: Python 3
     Build Command: cd backend && pip install -r requirements.txt
     Start Command: cd backend && python run.py
     ```

3. **Configure Environment Variables**
   - Add all backend environment variables
   - Set `FLASK_ENV=production`

#### Option B: Netlify (Frontend)

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "New site from Git"
   - Connect GitHub repository
   - Select `CVSS3.1-System` repository
   - Configure:
     ```
     Build Command: cd frontend && npm run build
     Publish Directory: frontend/dist
     ```

3. **Configure Environment Variables**
   - Add all frontend environment variables
   - Set `VITE_API_URL` to your backend URL

### Step 7: Database Setup

1. **Create PostgreSQL Database**
   - Use Render PostgreSQL or external service
   - Get connection string

2. **Initialize Database**
   ```bash
   # Connect to your production database
   python backend/init_db.py
   ```

### Step 8: CodeArts Integration (Optional)

1. **Connect CodeArts to GitHub**
   - Go to [CodeArts Console](https://console.huaweicloud.com/codearts/)
   - Import GitHub repository
   - Select `CVSS3.1-System`

2. **Configure Quality Gates**
   - Use the provided `config/codearts-quality-gate.yml`
   - Set up automated testing
   - Configure deployment pipeline

## 🔧 Local Development Setup

### Quick Start

```bash
# Clone your repository
git clone https://github.com/ushio2580/CVSS3.1-System.git
cd CVSS3.1-System

# Run installation script
./install.sh

# Start development servers
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python run.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Development Workflow

```bash
# Make changes to code
git add .
git commit -m "Add new feature: description"
git push origin main

# GitHub Actions will automatically:
# 1. Run tests
# 2. Check code quality
# 3. Deploy to production (if tests pass)
```

## 📊 Monitoring and Maintenance

### GitHub Repository Features

1. **Issues**: Track bugs and feature requests
2. **Projects**: Manage development workflow
3. **Actions**: Monitor CI/CD pipeline
4. **Security**: Vulnerability scanning
5. **Insights**: Code statistics and trends

### Production Monitoring

1. **Application Health**
   - Monitor API endpoints
   - Track error rates
   - Monitor response times

2. **Database Performance**
   - Monitor query performance
   - Track connection usage
   - Set up alerts

## 🛡️ Security Considerations

### Repository Security

1. **Enable Security Features**
   - Dependabot alerts
   - Code scanning
   - Secret scanning
   - Branch protection rules

2. **Access Control**
   - Limit repository access
   - Use team-based permissions
   - Enable two-factor authentication

### Application Security

1. **Environment Variables**
   - Never commit secrets to repository
   - Use GitHub Secrets for CI/CD
   - Rotate keys regularly

2. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check GitHub Actions logs
   # Verify environment variables
   # Check dependency versions
   ```

2. **Deployment Issues**
   ```bash
   # Check Render/Netlify logs
   # Verify environment variables
   # Check database connectivity
   ```

3. **Local Development Issues**
   ```bash
   # Check Python/Node.js versions
   # Verify database connection
   # Check environment variables
   ```

### Support Resources

- **GitHub Documentation**: [docs.github.com](https://docs.github.com)
- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Netlify Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **CodeArts Documentation**: [support.huaweicloud.com/codearts](https://support.huaweicloud.com/codearts/)

## 📞 Contact and Support

- **Repository**: [CVSS3.1-System](https://github.com/ushio2580/CVSS3.1-System)
- **Issues**: Create GitHub issues for bugs/features
- **Documentation**: Check the `docs/` folder
- **Deployment Guide**: See `CODEARTS_DEPLOYMENT_GUIDE.md`

---

**Repository**: [CVSS3.1-System](https://github.com/ushio2580/CVSS3.1-System)  
**Last Updated**: September 2025  
**Version**: 1.0.0  
**Maintained by**: CVSS Development Team
