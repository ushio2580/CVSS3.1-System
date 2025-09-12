# SWR Deployment Guide for CVSS System

## 📋 Overview

This guide provides step-by-step instructions for deploying the CVSS System using **SWR (Software Repository)** + **CodeArts Build Task** + **Shell Commands** on ECS CentOS 7.6.

## 🚀 Strategy: SWR Build + CodeArts Deploy

### Phase 1: SWR Build
- Build Docker images in SWR
- Push images to SWR registry
- Images are ready for deployment

### Phase 2: CodeArts Deploy
- Use Build Task + Shell Commands
- Pull images from SWR
- Deploy on ECS CentOS 7.6

## 📁 Files Created

### SWR Configuration
- `swr-build-config.yml` - SWR build configuration
- `docker/Dockerfile.backend.swr` - SWR-optimized backend Dockerfile
- `docker/Dockerfile.frontend.swr` - SWR-optimized frontend Dockerfile

### CodeArts Deploy
- `codearts-swr-deploy.yml` - CodeArts deployment from SWR

## 🔧 Step-by-Step Instructions

### Phase 1: SWR Build

#### Step 1: Configure SWR Repository

1. **In Huawei Cloud Console:**
   - Go to "SWR" (Software Repository)
   - Create a new organization: `cvss-system`
   - Create repositories:
     - `cvss-backend`
     - `cvss-frontend`

2. **Configure SWR Access:**
   - Get your SWR credentials
   - Note your SWR URL: `swr.cn-north-4.myhuaweicloud.com`

#### Step 2: Build Images in SWR

1. **Using SWR Console:**
   - Go to your organization
   - Create build tasks for each repository
   - Configure build sources (GitHub repository)
   - Set build triggers

2. **Or Using Docker CLI:**
   ```bash
   # Login to SWR
   docker login swr.cn-north-4.myhuaweicloud.com
   
   # Build and push backend
   docker build -f docker/Dockerfile.backend.swr -t swr.cn-north-4.myhuaweicloud.com/cvss-system/cvss-backend:latest .
   docker push swr.cn-north-4.myhuaweicloud.com/cvss-system/cvss-backend:latest
   
   # Build and push frontend
   docker build -f docker/Dockerfile.frontend.swr -t swr.cn-north-4.myhuaweicloud.com/cvss-system/cvss-frontend:latest .
   docker push swr.cn-north-4.myhuaweicloud.com/cvss-system/cvss-frontend:latest
   ```

### Phase 2: CodeArts Deploy

#### Step 1: Create Build Task in CodeArts

1. **In CodeArts:**
   - Go to "Pipelines" → "New Pipeline"
   - Select "Create from Scratch"
   - Choose "CodeArts Repo"

2. **Configure Build Task:**
   - Name: "CVSS-SWR-Deploy"
   - Copy content from `codearts-swr-deploy.yml`
   - Paste in the YAML editor

3. **Configure SWR Credentials:**
   - Add SWR login credentials
   - Configure image pull secrets

#### Step 2: Execute Deployment

1. **Run Build Task:**
   - Execute the deployment task
   - Monitor the progress
   - Check logs for any issues

2. **Verify Deployment:**
   - Check service status
   - Run health checks
   - Test application access

## 🎯 Using CodeArts Interface (Alternative)

If YAML continues to fail, use the CodeArts interface:

### Step 1: Create Build Task

1. **In CodeArts:**
   - Go to "Pipelines" → "New Pipeline"
   - Select "Create from Scratch"

2. **Add Steps Using Interface:**
   - Step 1: "ExecuteShellCommand" - Install Docker
   - Step 2: "ExecuteShellCommand" - Login to SWR
   - Step 3: "ExecuteShellCommand" - Pull Images
   - Step 4: "ExecuteShellCommand" - Deploy with Docker Compose
   - Step 5: "ExecuteShellCommand" - Configure Firewall

### Step 2: Configure Each Step

1. **Install Docker Step:**
   ```bash
   #!/bin/bash
   yum update -y
   yum install -y yum-utils
   yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
   yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   systemctl start docker
   systemctl enable docker
   ```

2. **Login to SWR Step:**
   ```bash
   #!/bin/bash
   docker login swr.cn-north-4.myhuaweicloud.com
   ```

3. **Pull Images Step:**
   ```bash
   #!/bin/bash
   docker pull swr.cn-north-4.myhuaweicloud.com/cvss-system/cvss-backend:latest
   docker pull swr.cn-north-4.myhuaweicloud.com/cvss-system/cvss-frontend:latest
   docker tag swr.cn-north-4.myhuaweicloud.com/cvss-system/cvss-backend:latest cvss-backend:latest
   docker tag swr.cn-north-4.myhuaweicloud.com/cvss-system/cvss-frontend:latest cvss-frontend:latest
   ```

4. **Deploy Step:**
   ```bash
   #!/bin/bash
   mkdir -p /opt/cvss-system
   cd /opt/cvss-system
   # Create docker-compose.yml (copy from codearts-swr-deploy.yml)
   docker-compose up -d
   ```

5. **Configure Firewall Step:**
   ```bash
   #!/bin/bash
   yum install -y firewalld
   systemctl start firewalld
   systemctl enable firewalld
   firewall-cmd --permanent --add-port=5000/tcp
   firewall-cmd --permanent --add-port=3000/tcp
   firewall-cmd --permanent --add-port=5432/tcp
   firewall-cmd --reload
   ```

## 🔍 Troubleshooting

### Common Issues

1. **SWR Login Fails:**
   - Check SWR credentials
   - Verify SWR URL
   - Check network connectivity

2. **Image Pull Fails:**
   - Verify image names
   - Check SWR permissions
   - Ensure images exist in SWR

3. **Docker Compose Fails:**
   - Check Docker installation
   - Verify docker-compose.yml syntax
   - Check port conflicts

### Debugging Commands

```bash
# Check Docker status
systemctl status docker

# Check SWR login
docker login swr.cn-north-4.myhuaweicloud.com

# List local images
docker images

# Check running containers
docker ps

# Check Docker Compose status
docker-compose ps

# Check logs
docker-compose logs
```

## 📊 Expected Results

### Successful Deployment

- **Backend**: http://your_ecs_ip:5000
- **Frontend**: http://your_ecs_ip:3000
- **Database**: PostgreSQL running in container
- **Docker**: All containers running and healthy

### Health Checks

- Backend health check: `curl http://your_ecs_ip:5000/api/health`
- Frontend health check: `curl http://your_ecs_ip:3000`
- Database health check: `docker exec cvss-postgres pg_isready -U cvss_user -d cvss_db`

## 🎯 Advantages of SWR Strategy

1. **Separation of Concerns**: Build in SWR, Deploy in CodeArts
2. **Image Reusability**: Images can be used across multiple deployments
3. **Version Control**: Images are versioned in SWR
4. **Scalability**: Easy to scale deployments
5. **Rollback**: Easy to rollback to previous image versions

## 📝 Next Steps

1. **Configure SWR repository**
2. **Build images in SWR**
3. **Create CodeArts Build Task**
4. **Configure SWR credentials**
5. **Execute deployment**
6. **Test the application**

## 🆘 Support

If you encounter issues:

1. **Check SWR configuration**
2. **Verify CodeArts credentials**
3. **Review deployment logs**
4. **Test each step individually**

---

**Ready to deploy with SWR + CodeArts! 🚀**
