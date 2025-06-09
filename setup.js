#!/usr/bin/env node

/**
 * Setup script for FDOT Plan Generator
 * This script helps with initial setup and dependency installation
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function setupProject() {
  console.log('🚀 Setting up FDOT Plan Generator...\n');

  try {
    // Step 1: Run basic tests
    console.log('📋 Step 1: Running basic tests...');
    execSync('node src/basic-test.js', { stdio: 'inherit' });
    console.log('\n✅ Basic tests completed successfully!\n');

    // Step 2: Install dependencies
    console.log('📦 Step 2: Installing dependencies...');
    console.log('This may take a few minutes as Puppeteer downloads Chromium...\n');
    
    execSync('npm install', { stdio: 'inherit' });
    console.log('\n✅ Dependencies installed successfully!\n');

    // Step 3: Create upload directory
    console.log('📁 Step 3: Creating directories...');
    await createDirectories();
    console.log('✅ Directories created successfully!\n');

    // Step 4: Run full test
    console.log('🧪 Step 4: Running full test suite...');
    execSync('npm test', { stdio: 'inherit' });
    console.log('\n✅ Full tests completed successfully!\n');

    // Step 5: Display success message
    displaySuccessMessage();

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you have Node.js 16+ installed');
    console.log('2. Try running: npm cache clean --force');
    console.log('3. Try running: rm -rf node_modules && npm install');
    console.log('4. Check your internet connection (Puppeteer downloads ~300MB)');
    process.exit(1);
  }
}

async function createDirectories() {
  const directories = [
    'output/uploads',
    'output/temp',
    'assets/fonts',
    'assets/images'
  ];

  for (const dir of directories) {
    const dirPath = path.join(__dirname, '..', dir);
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`   Created: ${dir}`);
    } catch (error) {
      console.log(`   Exists: ${dir}`);
    }
  }
}

function displaySuccessMessage() {
  console.log('🎉 Setup completed successfully!\n');
  console.log('📚 Available commands:');
  console.log('   npm test:basic    - Run basic tests (no dependencies)');
  console.log('   npm test          - Run full test suite');
  console.log('   npm start         - Generate sample plans');
  console.log('   npm run server    - Start API server');
  console.log('   npm run integration - Run integration examples\n');
  
  console.log('🔗 Quick start:');
  console.log('1. npm test          (verify everything works)');
  console.log('2. npm run server    (start API on http://localhost:3001)');
  console.log('3. Check README.md for detailed usage examples\n');
  
  console.log('📁 Generated files will be saved to: output/');
  console.log('🌐 API documentation: http://localhost:3001/health\n');
  
  console.log('🚀 Ready to generate FDOT traffic control plans!');
}

// Check if running as main module
if (require.main === module) {
  setupProject().catch(console.error);
}

module.exports = { setupProject };
