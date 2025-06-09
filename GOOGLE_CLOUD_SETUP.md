# 🚀 Google Cloud Deployment Guide

Deploy your FDOT Plan Generator to Google Cloud Platform with project ID `sme-interview-platform`.

## 📋 Prerequisites

1. **Google Cloud SDK installed**
   ```bash
   # macOS
   brew install --cask google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Docker installed** (optional, for local testing)
   ```bash
   # macOS
   brew install --cask docker
   ```

3. **Google Cloud Project Access**
   - Ensure you have access to project `sme-interview-platform`
   - Required roles: Cloud Run Admin, Cloud Build Editor, Storage Admin

## 🔧 Initial Setup

### 1. Authenticate with Google Cloud
```bash
# Login to Google Cloud
gcloud auth login

# Set application default credentials
gcloud auth application-default login

# Set the project
gcloud config set project sme-interview-platform

# Verify project is set
gcloud config get-value project
```

### 2. Enable Required APIs
```bash
# Enable necessary Google Cloud APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable storage.googleapis.com
```

### 3. Setup Project Scripts
```bash
# Make deployment scripts executable
npm run gcloud:setup
```

## 🧪 Local Testing (Recommended)

Before deploying to the cloud, test your application locally:

```bash
# Run comprehensive local tests
npm run gcloud:test-local
```

This will:
- ✅ Check your environment
- ✅ Install dependencies  
- ✅ Run diagnostics
- ✅ Test basic functionality
- ✅ Test API server
- ✅ Test Docker container (if Docker available)

## 🚀 Deployment Options

### Development Environment
```bash
# Deploy to development environment
npm run gcloud:deploy-dev

# Or manually:
./deploy.sh dev
```

**Development features:**
- Fast deployment with source-based builds
- Lower resource allocation (1 CPU, 2GB RAM)
- Maximum 5 instances
- Debug logging enabled

### Staging Environment
```bash
# Deploy to staging environment
npm run gcloud:deploy-staging

# Or manually:
./deploy.sh staging
```

**Staging features:**
- Cloud Build pipeline
- Production-like configuration
- Maximum 10 instances
- Info-level logging

### Production Environment
```bash
# Deploy to production environment (requires confirmation)
npm run gcloud:deploy-prod

# Or manually:
./deploy.sh prod
```

**Production features:**
- Cloud Build pipeline with optimizations
- High-performance configuration (2 CPU, 4GB RAM)
- Auto-scaling up to 20 instances
- Minimum 1 instance for zero cold starts
- Warning-level logging only

## 📡 Service URLs

After deployment, your services will be available at:

- **Development**: `https://fdot-plan-generator-dev-[hash]-uc.a.run.app`
- **Staging**: `https://fdot-plan-generator-staging-[hash]-uc.a.run.app`
- **Production**: `https://fdot-plan-generator-[hash]-uc.a.run.app`

## 🔍 Testing Your Deployment

### Health Check
```bash
curl https://your-service-url/health
```

### API Test
```bash
# Test validation endpoint
curl -X POST https://your-service-url/api/validate \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectName": "Test Project",
    "siteLocation": "CARY, NC",
    "speedLimit": 35,
    "workZoneLength": 1000
  }'
```

### Generate PDF Test
```bash
# Test PDF generation
curl -X POST https://your-service-url/api/generate/fdot-pages \\
  -H "Content-Type: application/json" \\
  -d '{
    "projectName": "Cloud Test",
    "siteLocation": "CARY, NC", 
    "speedLimit": 45,
    "workZoneLength": 2000,
    "indexNumber": "102-603"
  }'
```

## 📊 Monitoring and Logging

### View Logs
```bash
# Development environment
gcloud logs read --service=fdot-plan-generator-dev --limit=50

# Production environment  
gcloud logs read --service=fdot-plan-generator --limit=50

# Follow logs in real-time
gcloud logs tail --service=fdot-plan-generator
```

### Service Information
```bash
# Get service details
gcloud run services describe fdot-plan-generator --region=us-central1

# List all services
gcloud run services list
```

### Performance Monitoring
- **Google Cloud Console**: Navigate to Cloud Run → your service
- **Metrics**: CPU utilization, memory usage, request count
- **Logs**: Application logs and error tracking

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   gcloud builds list --limit=5
   gcloud builds log [BUILD_ID]
   ```

2. **Service Not Responding**
   ```bash
   # Check service status
   gcloud run services describe fdot-plan-generator --region=us-central1
   
   # Check logs for errors
   gcloud logs read --service=fdot-plan-generator --severity=ERROR
   ```

3. **Memory Issues**
   ```bash
   # Increase memory allocation
   gcloud run services update fdot-plan-generator \\
     --memory=4Gi --region=us-central1
   ```

4. **Timeout Issues**
   ```bash
   # Increase timeout (max 3600 seconds)
   gcloud run services update fdot-plan-generator \\
     --timeout=1800 --region=us-central1
   ```

### Debug Commands
```bash
# Test locally with Docker
docker build -t fdot-test .
docker run -p 8080:8080 fdot-test

# Access container shell
docker run -it fdot-test /bin/bash

# Check Chrome installation in container
docker run fdot-test /usr/bin/google-chrome-stable --version
```

## 🔧 Configuration Management

### Environment Variables
Modify environment variables in `cloudbuild.yaml` or during deployment:

```bash
gcloud run services update fdot-plan-generator \\
  --set-env-vars="NODE_ENV=production,CUSTOM_VAR=value" \\
  --region=us-central1
```

### Resource Limits
```bash
# Scale configuration
gcloud run services update fdot-plan-generator \\
  --cpu=2 \\
  --memory=4Gi \\
  --max-instances=20 \\
  --min-instances=1 \\
  --region=us-central1
```

## 💰 Cost Optimization

### Development
- Use `--min-instances=0` for development
- Set appropriate resource limits
- Clean up unused services

### Production
- Set `--min-instances=1` to avoid cold starts
- Monitor usage and adjust scaling
- Use Cloud Scheduler for cleanup tasks

## 🔒 Security

### Access Control
```bash
# Require authentication (remove --allow-unauthenticated)
gcloud run services update fdot-plan-generator \\
  --no-allow-unauthenticated \\
  --region=us-central1

# Create service account for internal access
gcloud iam service-accounts create fdot-service-account
```

### CORS Configuration
Modify CORS settings in `src/api-server.js` for production:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
```

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs) 
- [Container Registry Documentation](https://cloud.google.com/container-registry/docs)
- [Puppeteer in Cloud Run](https://cloud.google.com/run/docs/tutorials/puppeteer)

---

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Cloud Run logs: `gcloud logs read --service=fdot-plan-generator`
3. Test locally first: `npm run gcloud:test-local`
4. Verify project permissions and API enablement

**Ready to deploy?** Start with: `npm run gcloud:deploy-dev`
