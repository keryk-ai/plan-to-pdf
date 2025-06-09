#!/bin/bash

# Make scripts executable
chmod +x deploy.sh
chmod +x test-local.sh

echo "✅ Scripts are now executable"
echo ""
echo "Available commands:"
echo "  ./test-local.sh    - Test locally before deployment"
echo "  ./deploy.sh dev    - Deploy to development environment"
echo "  ./deploy.sh prod   - Deploy to production environment"
