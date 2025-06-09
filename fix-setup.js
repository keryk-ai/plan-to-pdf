#!/usr/bin/env node

/**
 * Quick diagnostic and fix script for common Puppeteer issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 FDOT Plan Generator - Quick Fix Script');
console.log('=========================================\n');

// Check Node.js version
console.log('1️⃣  Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
console.log(`   Node.js: ${nodeVersion}`);

if (majorVersion < 14) {
  console.error('   ❌ Node.js 14+ required. Please update Node.js.');
  process.exit(1);
} else {
  console.log('   ✅ Node.js version OK');
}

// Check platform
console.log('\n2️⃣  Checking platform...');
console.log(`   Platform: ${process.platform} ${process.arch}`);

// Check if running on macOS with potential permission issues
if (process.platform === 'darwin') {
  console.log('   💡 macOS detected - using macOS-optimized settings');
}

// Check output directory
console.log('\n3️⃣  Checking output directory...');
const outputDir = path.join(__dirname, 'output');
try {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('   ✅ Output directory created');
  } else {
    console.log('   ✅ Output directory exists');
  }
  
  // Test write permissions
  const testFile = path.join(outputDir, 'test_permissions.txt');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('   ✅ Write permissions OK');
  
} catch (error) {
  console.error('   ❌ Output directory error:', error.message);
  console.log('   💡 Try running: mkdir -p output && chmod 755 output');
}

// Reinstall Puppeteer with correct flags
console.log('\n4️⃣  Reinstalling Puppeteer...');
try {
  console.log('   🔄 Removing existing Puppeteer...');
  try {
    execSync('npm uninstall puppeteer', { stdio: 'pipe' });
  } catch (e) {
    // Ignore if not installed
  }
  
  console.log('   📦 Installing Puppeteer with macOS flags...');
  const installCommand = process.platform === 'darwin' 
    ? 'npm install puppeteer@21.11.0 --unsafe-perm=true --allow-root --force'
    : 'npm install puppeteer@21.11.0 --force';
    
  execSync(installCommand, { stdio: 'inherit' });
  console.log('   ✅ Puppeteer installed successfully');
  
} catch (error) {
  console.error('   ❌ Puppeteer installation failed:', error.message);
  console.log('   💡 Try manually: npm install puppeteer --unsafe-perm=true');
}

// Test browser launch
console.log('\n5️⃣  Testing browser launch...');
try {
  const puppeteer = require('puppeteer');
  
  (async () => {
    try {
      const browser = await puppeteer.launch({
        headless: true, // Use legacy headless mode for compatibility
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run'
        ],
        timeout: 30000
      });
      
      const page = await browser.newPage();
      await page.setContent('<h1>Test</h1>');
      await page.close();
      await browser.close();
      
      console.log('   ✅ Browser test successful');
      console.log('\n🎉 Setup complete! You can now run: npm test');
      
    } catch (browserError) {
      console.error('   ❌ Browser test failed:', browserError.message);
      console.log('\n💡 Additional troubleshooting steps:');
      console.log('   1. Restart your terminal');
      console.log('   2. Try: export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false');
      console.log('   3. Manual Chrome download: npx puppeteer browsers install chrome');
      console.log('   4. On macOS: Allow Node.js in System Preferences > Security & Privacy');
    }
  })();
  
} catch (requireError) {
  console.error('   ❌ Cannot load Puppeteer:', requireError.message);
  console.log('   💡 Try running this script again after installation completes');
}
