# CodeArts Build + Deploy Guide for CVSS System

## 📋 Overview

This guide provides step-by-step instructions for deploying the CVSS System using CodeArts with a **BUILD + DEPLOY** strategy. This approach separates the build process from the deployment process, making it more robust and easier to debug.

## 🚀 Deployment Strategies

### Strategy 1: Build Task + Deploy Task (Recommended)
- **Build Task**: Installs dependencies, builds application, creates artifacts
- **Deploy Task**: Deploys the built application to ECS

### Strategy 2: Docker Build + Deploy
- **Docker Build**: Creates Docker images and deploys with Docker Compose
- **More portable and reproducible**

## 📁 Files Created

### Build and Deploy Tasks
- `codearts-build-task.yml` - Build task configuration
- `codearts-deploy-task.yml` - Deploy task configuration
- `codearts-docker-build.yml` - Docker build and deploy configuration

### Docker Configuration
- `docker/Dockerfile.backend` - Backend Docker image
- `docker/Dockerfile.frontend` - Frontend Docker image
- `docker/docker-compose.prod.yml` - Production Docker Compose

## 🔧 Step-by-Step Instructions

### Option 1: Build Task + Deploy Task

#### Step 1: Create Build Task

1. **In CodeArts:**
   - Go to "Pipelines" → "New Pipeline"
   - Select "Create from Scratch"
   - Choose "CodeArts Repo" (not GitHub)

2. **Configure Build Task:**
   - Name: "CVSS-Build-Task"
   - Copy content from `codearts-build-task.yml`
   - Paste in the YAML editor

3. **Run Build Task:**
   - Execute the build task
   - Wait for completion
   - Verify artifacts are created

#### Step 2: Create Deploy Task

1. **In CodeArts:**
   - Go to "Pipelines" → "New Pipeline"
   - Select "Create from Scratch"
   - Choose "CodeArts Repo"

2. **Configure Deploy Task:**
   - Name: "CVSS-Deploy-Task"
   - Copy content from `codearts-deploy-task.yml`
   - Paste in the YAML editor

3. **Run Deploy Task:**
   - Execute the deploy task
   - Wait for completion
   - Verify services are running

### Option 2: Docker Build + Deploy

#### Step 1: Create Docker Build Task

1. **In CodeArts:**
   - Go to "Pipelines" → "New Pipeline"
   - Select "Create from Scratch"
   - Choose "CodeArts Repo"

2. **Configure Docker Build Task:**
   - Name: "CVSS-Docker-Build"
   - Copy content from `codearts-docker-build.yml`
   - Paste in the YAML editor

3. **Run Docker Build Task:**
   - Execute the Docker build task
   - Wait for completion
   - Verify Docker containers are running

## 🎯 Using CodeArts Interface (Alternative)

If YAML continues to give errors, use the CodeArts interface:

### Build Task Interface

1. **Create New Pipeline:**
   - Go to "Pipelines" → "New Pipeline"
   - Select "Create from Scratch"

2. **Add Steps Using Interface:**
   - Add "ExecuteShellCommand" for each command
   - Configure each step individually
   - No YAML needed

3. **Build Task Steps:**
   - Step 1: "Install System Dependencies"
   - Step 2: "Setup Database"
   - Step 3: "Build Backend"
   - Step 4: "Build Frontend"
   - Step 5: "Create Build Artifacts"

### Deploy Task Interface

1. **Create New Pipeline:**
   - Go to "Pipelines" → "New Pipeline"
   - Select "Create from Scratch"

2. **Add Steps Using Interface:**
   - Add "ExecuteShellCommand" for each command
   - Configure each step individually

3. **Deploy Task Steps:**
   - Step 1: "Deploy Application"
   - Step 2: "Cleanup Build Artifacts"

## 🔍 Troubleshooting

### Common Issues

1. **Build Task Fails:**
   - Check system dependencies installation
   - Verify database setup
   - Check file permissions

2. **Deploy Task Fails:**
   - Ensure build artifacts exist
   - Check systemd service configuration
   - Verify firewall settings

3. **Docker Build Fails:**
   - Check Docker installation
   - Verify Dockerfile syntax
   - Check image build logs

### Debugging Commands

```bash
# Check service status
systemctl status cvss-backend
systemctl status cvss-frontend

# Check logs
tail -f /var/log/cvss-system/backend.log
tail -f /var/log/cvss-system/frontend.log

# Check Docker containers
docker-compose -f docker/docker-compose.prod.yml ps
docker-compose -f docker/docker-compose.prod.yml logs

# Check build artifacts
ls -la /tmp/cvss-system-build.tar.gz
ls -la /tmp/deploy.sh
```

## 📊 Expected Results

### Successful Deployment

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **Database**: PostgreSQL running on port 5432
- **Services**: systemd services running and enabled

### Health Checks

- Backend health check: `curl http://localhost:5000/api/health`
- Frontend health check: `curl http://localhost:3000`
- Database health check: `pg_isready -U cvss_user -d cvss_db`

## 🎯 Recommendations

1. **Start with Build Task + Deploy Task** (Strategy 1)
2. **Use CodeArts interface** if YAML continues to fail
3. **Test each step individually** before running full pipeline
4. **Check logs** if any step fails
5. **Use Docker approach** for more portable deployment

## 📝 Next Steps

1. **Choose your deployment strategy**
2. **Create the first task (Build or Docker Build)**
3. **Run and verify the task**
4. **Create the second task (Deploy)**
5. **Run and verify the deployment**
6. **Test the application**

## 🆘 Support

If you encounter issues:

1. **Check the troubleshooting section**
2. **Review the logs**
3. **Verify each step individually**
4. **Use the CodeArts interface as fallback**

---

**Ready to deploy your CVSS System! 🚀**
