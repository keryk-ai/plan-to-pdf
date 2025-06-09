#!/bin/bash

echo "🛰️  FDOT Traffic Control Plan - Real Image Test"
echo "================================================"

# Check if the satellite image exists
if [ -f "./assets/images/airport-road-satellite.png" ]; then
    echo "✅ Found satellite image: airport-road-satellite.png"
    echo "📊 Image info:"
    ls -lh ./assets/images/airport-road-satellite.png
    echo ""
    echo "🚀 Generating traffic control plan..."
    node example-with-real-image.js
else
    echo "❌ Satellite image not found!"
    echo ""
    echo "Please save your Airport Road satellite image as:"
    echo "   ./assets/images/airport-road-satellite.png"
    echo ""
    echo "Supported formats: PNG, JPG, JPEG, SVG, GIF"
    echo "Recommended: PNG format for best quality"
    echo ""
    echo "After saving the image, run this script again:"
    echo "   ./quick-test-with-image.sh"
fi