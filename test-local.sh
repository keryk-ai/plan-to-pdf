#!/bin/bash

# Local testing script for FDOT Plan Generator
# This script helps test the application before deploying to Google Cloud

set -e

echo "🧪 FDOT Plan Generator - Local Testing"
echo "====================================="

# Check if Docker is running (for container testing)
if command -v docker &> /dev/null && docker info &> /dev/null; then
    DOCKER_AVAILABLE=true
    echo "🐳 Docker is available"
else
    DOCKER_AVAILABLE=false
    echo "⚠️  Docker not available - skipping container tests"
fi

# Test 1: Environment check
echo ""
echo "1️⃣  Environment Check"
echo "--------------------"
node --version
npm --version

# Test 2: Install dependencies
echo ""
echo "2️⃣  Installing Dependencies"
echo "-------------------------"
npm install

# Test 3: Run diagnostics
echo ""
echo "3️⃣  Running Diagnostics"
echo "---------------------"
npm run test:diagnose

# Test 4: Basic functionality test
echo ""
echo "4️⃣  Basic Functionality Test"
echo "---------------------------"
npm test

# Test 5: API server test
echo ""
echo "5️⃣  API Server Test"
echo "-----------------"
echo "Starting API server in background..."

# Start server in background
npm run server &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
if curl -s -f "http://localhost:8080/health" > /dev/null; then
    echo "✅ API server health check passed"
    
    # Test API endpoints
    echo "Testing validation endpoint..."
    curl -s -X POST http://localhost:8080/api/validate \
        -H "Content-Type: application/json" \
        -d '{"projectName":"Test","speedLimit":35,"workZoneLength":1000,"siteLocation":"Test, NC"}' \
        | grep -q "isValid" && echo "✅ Validation endpoint works"
    
else
    echo "❌ API server health check failed"
fi

# Stop server
kill $SERVER_PID 2>/dev/null || true

# Test 6: Docker container test (if available)
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    echo "6️⃣  Docker Container Test"
    echo "------------------------"
    
    echo "Building Docker image..."
    docker build -t fdot-plan-generator:test .
    
    echo "Running container..."
    docker run -d -p 8081:8080 --name fdot-test fdot-plan-generator:test
    
    # Wait for container to start
    sleep 10
    
    # Test container
    if curl -s -f "http://localhost:8081/health" > /dev/null; then
        echo "✅ Docker container test passed"
    else
        echo "❌ Docker container test failed"
    fi
    
    # Cleanup
    docker stop fdot-test
    docker rm fdot-test
    docker rmi fdot-plan-generator:test
fi

echo ""
echo "🎉 Local testing complete!"
echo ""
echo "Next steps:"
echo "  1. If all tests passed, you can deploy: ./deploy.sh dev"
echo "  2. For production: ./deploy.sh prod"
echo "  3. Monitor logs: gcloud logs read --service=fdot-plan-generator"
