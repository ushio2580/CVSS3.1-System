# CVSS Scoring System - Project Configuration

## 🎯 Project Overview

**Repository**: [CVSS3.1-System](https://github.com/ushio2580/CVSS3.1-System)  
**Project Name**: CVSS Scoring System with Document Analysis  
**Version**: 1.0.0  
**Status**: Production Ready  

## 🏗️ Architecture

### Backend (Flask)
- **Framework**: Flask 2.3+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT-based with Flask-JWT-Extended
- **API**: RESTful API with Blueprint architecture
- **Document Processing**: PyPDF2, python-docx
- **Testing**: pytest with coverage reporting

### Frontend (React)
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Testing**: Jest with React Testing Library
- **HTTP Client**: Fetch API with custom service layer

## 📊 Features

### Core Functionality
- ✅ CVSS v3.1 Calculator with all metrics
- ✅ Document Analysis (PDF/Word processing)
- ✅ Vulnerability Management (CRUD operations)
- ✅ User Authentication & Authorization
- ✅ Dashboard with Analytics
- ✅ Audit Logging
- ✅ Bulk Upload (CSV/JSON)
- ✅ Professional Reports

### Advanced Features
- ✅ Hybrid Architecture (Document + Vulnerability tracking)
- ✅ Real-time CVSS scoring
- ✅ Responsive Design
- ✅ API Documentation
- ✅ Security Features (CORS, Input validation)
- ✅ Error Handling & Logging

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database
SQLALCHEMY_DATABASE_URI=postgresql://username:password@host:port/database

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ACCESS_TOKEN_EXPIRES=3600

# Flask
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-flask-secret-key-here

# CORS
CORS_ORIGINS=https://your-frontend-domain.com

# File Upload
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=uploads

# API
API_VERSION=v1
```

#### Frontend (.env)
```bash
# API
VITE_API_URL=https://your-backend-domain.com/api

# App
VITE_APP_NAME=CVSS Scoring System
VITE_APP_VERSION=1.0.0

# Production
VITE_DEV_MODE=false
```

## 🚀 Deployment

### Production URLs
- **Backend**: https://cvss-scoring-system.onrender.com
- **Frontend**: https://gleeful-vacherin-0740fc.netlify.app
- **Repository**: https://github.com/ushio2580/CVSS3.1-System

### Deployment Platforms
- **Backend**: Render.com (Python/Flask)
- **Frontend**: Netlify (React/Vite)
- **Database**: PostgreSQL (Render/External)
- **CI/CD**: GitHub Actions + CodeArts

## 🧪 Testing

### Test Coverage
- **Backend**: 96% coverage (26 tests)
- **Frontend**: 28 tests passed
- **Total**: 54 tests covering all functionality

### Test Commands
```bash
# Backend tests
cd backend
source venv/bin/activate
python -m pytest tests/ -v --cov=. --cov-report=html

# Frontend tests
cd frontend
npm test -- --watchAll=false --coverage
```

## 📈 Quality Metrics

### Code Quality
- **Security**: 0 vulnerabilities, 0 security hotspots
- **Coverage**: 96% backend, comprehensive frontend
- **Performance**: <2s response time
- **Reliability**: 99.9% uptime target

### Quality Gates
- Minimum 80% test coverage
- 0 security vulnerabilities
- 0 bugs in production
- All tests must pass

## 🔒 Security

### Authentication
- JWT-based authentication
- Role-based access control (Admin/Analyst/Viewer)
- Secure password hashing
- Session management

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- File upload security

## 📚 Documentation

### Available Documentation
- [README.md](README.md) - Main project documentation
- [CODEARTS_DEPLOYMENT_GUIDE.md](docs/CODEARTS_DEPLOYMENT_GUIDE.md) - CodeArts deployment
- [GITHUB_DEPLOYMENT_TUTORIAL.md](docs/GITHUB_DEPLOYMENT_TUTORIAL.md) - GitHub deployment
- [install.sh](install.sh) - Installation script

### API Documentation
- RESTful API endpoints
- Authentication endpoints
- Document analysis endpoints
- Vulnerability management endpoints

## 🛠️ Development

### Local Development
```bash
# Clone repository
git clone https://github.com/ushio2580/CVSS3.1-System.git
cd CVSS3.1-System

# Run installation
./install.sh

# Start development servers
# Terminal 1 - Backend
cd backend && source venv/bin/activate && python run.py

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Development Workflow
1. Create feature branch
2. Make changes
3. Run tests locally
4. Create pull request
5. Code review
6. Merge to main
7. Automatic deployment

## 📊 Monitoring

### Application Monitoring
- Real-time performance metrics
- Error tracking and logging
- User activity monitoring
- System health checks

### Infrastructure Monitoring
- Server resource usage
- Database performance
- Network connectivity
- Deployment status

## 🆘 Support

### Contact Information
- **Repository**: [CVSS3.1-System](https://github.com/ushio2580/CVSS3.1-System)
- **Issues**: Create GitHub issues for bugs/features
- **Documentation**: Check the `docs/` folder
- **Deployment**: See deployment guides

### Troubleshooting
- Check GitHub Actions logs
- Verify environment variables
- Check database connectivity
- Review application logs

---

**Last Updated**: September 2025  
**Maintained by**: CVSS Development Team  
**Repository**: [CVSS3.1-System](https://github.com/ushio2580/CVSS3.1-System)
