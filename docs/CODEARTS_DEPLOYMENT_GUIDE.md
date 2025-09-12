# CVSS Scoring System - CodeArts Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [CodeArts Setup](#codearts-setup)
3. [Project Configuration](#project-configuration)
4. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
5. [Quality Gates Configuration](#quality-gates-configuration)
6. [Deployment Process](#deployment-process)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

## 🎯 Prerequisites

### Required Accounts
- **Huawei Cloud Account** with CodeArts access
- **GitHub Account** for source code repository
- **Render.com Account** for backend deployment
- **Netlify Account** for frontend deployment

### Required Tools
- Git client
- Docker (optional, for containerized deployment)
- CodeArts CLI (optional)

## 🚀 CodeArts Setup

### Step 1: Create CodeArts Project

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

### Step 2: Connect Repository

1. **Import Source Code**
   - Go to Code → Repositories
   - Click "Import Repository"
   - Select "GitHub" as source
   - Enter repository URL: `https://github.com/your-username/cvss-scoring-system`

2. **Configure Branch Protection**
   - Go to Code → Branches
   - Set main branch as protected
   - Require pull request reviews

## ⚙️ Project Configuration

### Step 1: Environment Variables

1. **Backend Environment Variables**
   ```bash
   # Database Configuration
   DATABASE_URL=postgresql://username:password@host:port/database
   SQLALCHEMY_DATABASE_URI=postgresql://username:password@host:port/database
   
   # JWT Configuration
   JWT_SECRET_KEY=your-super-secret-jwt-key-here
   JWT_ACCESS_TOKEN_EXPIRES=3600
   
   # Flask Configuration
   FLASK_ENV=production
   FLASK_DEBUG=False
   SECRET_KEY=your-flask-secret-key-here
   
   # CORS Configuration
   CORS_ORIGINS=https://your-frontend-domain.com
   
   # File Upload Configuration
   MAX_CONTENT_LENGTH=16777216
   UPLOAD_FOLDER=uploads
   ```

2. **Frontend Environment Variables**
   ```bash
   # API Configuration
   VITE_API_URL=https://your-backend-domain.com/api
   
   # Application Configuration
   VITE_APP_NAME=CVSS Scoring System
   VITE_APP_VERSION=1.0.0
   
   # Production Configuration
   VITE_DEV_MODE=false
   ```

### Step 2: Build Configuration

1. **Backend Build Configuration**
   ```yaml
   # config/build-backend.yml
   version: '3.8'
   steps:
     - name: Setup Python
       uses: actions/setup-python@v4
       with:
         python-version: '3.12'
     
     - name: Install Dependencies
       run: |
         python -m pip install --upgrade pip
         pip install -r requirements.txt
     
     - name: Run Tests
       run: |
         python -m pytest tests/ -v --cov=. --cov-report=xml
     
     - name: Build Application
       run: |
         python -m py_compile app/*.py
   ```

2. **Frontend Build Configuration**
   ```yaml
   # config/build-frontend.yml
   version: '3.8'
   steps:
     - name: Setup Node.js
       uses: actions/setup-node@v4
       with:
         node-version: '18'
         cache: 'npm'
     
     - name: Install Dependencies
       run: npm ci
     
     - name: Run Tests
       run: npm test -- --watchAll=false --coverage
     
     - name: Build Application
       run: npm run build
   ```

## 🔄 CI/CD Pipeline Setup

### Step 1: Create Pipeline

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

### Step 2: Pipeline Stages

1. **Build Stage**
   ```yaml
   stages:
     - name: Build
       jobs:
         - name: Build Backend
           steps:
             - checkout
             - setup-python
             - install-dependencies
             - run-tests
             - build-backend
         
         - name: Build Frontend
           steps:
             - checkout
             - setup-node
             - install-dependencies
             - run-tests
             - build-frontend
   ```

2. **Test Stage**
   ```yaml
   - name: Test
     jobs:
       - name: Backend Tests
         steps:
           - run-backend-tests
           - generate-coverage-report
       
       - name: Frontend Tests
         steps:
           - run-frontend-tests
           - generate-coverage-report
   ```

3. **Deploy Stage**
   ```yaml
   - name: Deploy
     jobs:
       - name: Deploy Backend
         steps:
           - deploy-to-render
       
       - name: Deploy Frontend
         steps:
           - deploy-to-netlify
   ```

## 🛡️ Quality Gates Configuration

### Step 1: Configure Quality Gates

1. **Navigate to Quality Gates**
   - Go to Quality → Quality Gates
   - Click "Create Quality Gate"

2. **Set Quality Criteria**
   ```yaml
   # config/quality-gate.yml
   quality_gate:
     name: CVSS-System-Quality-Gate
     conditions:
       - metric: coverage
         operator: GREATER_THAN
         threshold: 80
       - metric: duplicated_lines_density
         operator: LESS_THAN
         threshold: 5
       - metric: security_hotspots
         operator: EQUALS
         threshold: 0
       - metric: bugs
         operator: EQUALS
         threshold: 0
       - metric: vulnerabilities
         operator: EQUALS
         threshold: 0
   ```

### Step 2: Code Analysis

1. **Configure SonarQube**
   ```yaml
   # config/sonar-project.properties
   sonar.projectKey=cvss-scoring-system
   sonar.projectName=CVSS Scoring System
   sonar.projectVersion=1.0.0
   
   sonar.sources=backend/app,frontend/src
   sonar.tests=backend/tests,frontend/src/__tests__
   sonar.python.coverage.reportPaths=backend/coverage.xml
   sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info
   ```

## 🚀 Deployment Process

### Step 1: Backend Deployment (Render.com)

1. **Create Render Service**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect GitHub repository

2. **Configure Backend Service**
   ```
   Name: cvss-backend
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python run.py
   Environment Variables: (from backend .env)
   ```

### Step 2: Frontend Deployment (Netlify)

1. **Create Netlify Site**
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Connect GitHub repository

2. **Configure Frontend Build**
   ```
   Build Command: npm run build
   Publish Directory: dist
   Environment Variables: (from frontend .env)
   ```

### Step 3: Database Setup

1. **Create PostgreSQL Database**
   - Use Render PostgreSQL or external service
   - Configure connection string
   - Run database migrations

2. **Initialize Database**
   ```bash
   python init_db.py
   ```

## 📊 Monitoring and Maintenance

### Step 1: Set Up Monitoring

1. **Application Monitoring**
   - Configure logging
   - Set up error tracking
   - Monitor performance metrics

2. **Infrastructure Monitoring**
   - Monitor server resources
   - Track deployment status
   - Set up alerts

### Step 2: Maintenance Tasks

1. **Regular Updates**
   - Update dependencies
   - Apply security patches
   - Monitor for vulnerabilities

2. **Backup Strategy**
   - Database backups
   - Configuration backups
   - Disaster recovery plan

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check logs
   tail -f logs/build.log
   
   # Verify dependencies
   pip list
   npm list
   ```

2. **Deployment Issues**
   ```bash
   # Check environment variables
   echo $DATABASE_URL
   
   # Verify database connection
   python -c "from app import db; db.create_all()"
   ```

3. **Test Failures**
   ```bash
   # Run tests individually
   python -m pytest tests/test_auth.py -v
   npm test -- --testNamePattern="Auth"
   ```

### Support Resources

- **CodeArts Documentation**: https://support.huaweicloud.com/codearts/
- **Render Documentation**: https://render.com/docs
- **Netlify Documentation**: https://docs.netlify.com/

## 📞 Contact and Support

For issues with this deployment guide:
- Create an issue in the GitHub repository
- Contact the development team
- Check the troubleshooting section above

---

**Last Updated**: September 2025
**Version**: 1.0.0
**Maintained by**: CVSS Development Team
