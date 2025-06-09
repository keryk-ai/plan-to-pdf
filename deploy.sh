#!/bin/bash

# FDOT Plan Generator - Google Cloud Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: dev, staging, prod (default: dev)

set -e

ENVIRONMENT=${1:-dev}
PROJECT_ID="sme-interview-platform"
SERVICE_NAME="fdot-plan-generator"
REGION="us-central1"

echo "🚀 Deploying FDOT Plan Generator to Google Cloud"
echo "=================================================="
echo "Environment: $ENVIRONMENT"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Verify gcloud is configured
echo "🔍 Verifying Google Cloud configuration..."
if ! gcloud config get-value project &>/dev/null; then
    echo "❌ Google Cloud SDK not configured. Run: gcloud auth login"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy based on environment
case $ENVIRONMENT in
    "dev"|"development")
        echo "📦 Building for development environment..."
        
        # Deploy to Cloud Run with development settings
        gcloud run deploy $SERVICE_NAME-dev \
            --source . \
            --platform managed \
            --region $REGION \
            --allow-unauthenticated \
            --memory 2Gi \
            --cpu 1 \
            --max-instances 5 \
            --set-env-vars "NODE_ENV=development,PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true,PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable" \
            --timeout 900
        
        SERVICE_URL=$(gcloud run services describe $SERVICE_NAME-dev --platform managed --region $REGION --format 'value(status.url)')
        echo "✅ Development deployment complete!"
        echo "🌐 Service URL: $SERVICE_URL"
        ;;
        
    "staging")
        echo "📦 Building for staging environment..."
        
        # Use Cloud Build for staging
        gcloud builds submit --config cloudbuild.yaml \
            --substitutions _SERVICE_NAME=$SERVICE_NAME-staging,_ENVIRONMENT=staging
        
        SERVICE_URL=$(gcloud run services describe $SERVICE_NAME-staging --platform managed --region $REGION --format 'value(status.url)')
        echo "✅ Staging deployment complete!"
        echo "🌐 Service URL: $SERVICE_URL"
        ;;
        
    "prod"|"production")
        echo "📦 Building for production environment..."
        
        # Confirm production deployment
        read -p "⚠️  Deploy to PRODUCTION? (y/N): " confirm
        if [[ $confirm != [yY] ]]; then
            echo "❌ Production deployment cancelled"
            exit 1
        fi
        
        # Use Cloud Build for production
        gcloud builds submit --config cloudbuild.yaml \
            --substitutions _SERVICE_NAME=$SERVICE_NAME,_ENVIRONMENT=production
        
        SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
        echo "✅ Production deployment complete!"
        echo "🌐 Service URL: $SERVICE_URL"
        ;;
        
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: dev, staging, prod"
        exit 1
        ;;
esac

# Test the deployment
echo ""
echo "🧪 Testing deployment..."
if curl -s -f "$SERVICE_URL/health" > /dev/null; then
    echo "✅ Health check passed"
    echo "🎉 Deployment successful!"
else
    echo "❌ Health check failed"
    echo "🔍 Check logs: gcloud logs read --service=$SERVICE_NAME-$ENVIRONMENT"
fi

echo ""
echo "📋 Useful commands:"
echo "   View logs: gcloud logs read --service=$SERVICE_NAME-$ENVIRONMENT"
echo "   View service: gcloud run services describe $SERVICE_NAME-$ENVIRONMENT --region $REGION"
echo "   Delete service: gcloud run services delete $SERVICE_NAME-$ENVIRONMENT --region $REGION"
echo "   API Docs: $SERVICE_URL/health"
