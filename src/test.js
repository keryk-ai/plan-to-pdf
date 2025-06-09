const FDOTPlanGenerator = require('./index.js');
const path = require('path');
const fs = require('fs').promises;

async function runBasicTest() {
  console.log('🧪 Running Basic FDOT Plan Generation Test...');
  
  const generator = new FDOTPlanGenerator();
  
  // Simple test data
  const testData = {
    projectName: 'BASIC_TEST',
    siteLocation: 'CARY, NC',
    speedLimit: 35,
    workZoneLength: 1000
  };

  try {
    // Step 1: Test browser initialization
    console.log('1️⃣  Testing browser initialization...');
    const health = await generator.healthCheck();
    console.log('   Browser status:', health.status);
    
    if (health.status !== 'healthy') {
      console.error('   ❌ Browser health check failed:', health.error);
      console.log('   💡 This might be due to:');
      console.log('      - Missing Chrome/Chromium installation');
      console.log('      - Insufficient system permissions');
      console.log('      - macOS security restrictions');
      console.log('   🛠️  Try running: npm install puppeteer --unsafe-perm=true');
      return;
    }
    
    // Step 2: Test data validation
    console.log('2️⃣  Testing data validation...');
    const validation = generator.validateData(testData);
    console.log('   Validation result:', validation.isValid ? '✅ Valid' : '❌ Invalid');
    
    if (!validation.isValid) {
      console.log('   Errors:', validation.errors);
      return;
    }
    
    // Step 3: Test spacing calculations
    console.log('3️⃣  Testing spacing calculations...');
    const spacing = generator.getSpacingCalculations(testData.speedLimit);
    console.log('   Cone spacing:', spacing.coneSpacing, 'ft');
    console.log('   Taper length:', spacing.taperLength, 'ft');
    console.log('   Buffer length:', spacing.bufferLength, 'ft');
    
    // Step 4: Test template preview (HTML only, no PDF)
    console.log('4️⃣  Testing template preview...');
    try {
      const page2HTML = await generator.previewHTML(testData, 'page2');
      const page3HTML = await generator.previewHTML(testData, 'page3');
      
      // Save HTML previews
      const outputDir = path.join(__dirname, '../output');
      await fs.mkdir(outputDir, { recursive: true });
      
      await fs.writeFile(path.join(outputDir, 'test_page2_preview.html'), page2HTML);
      await fs.writeFile(path.join(outputDir, 'test_page3_preview.html'), page3HTML);
      
      console.log('   ✅ HTML templates generated successfully');
      console.log('   📄 Preview files saved to output/ directory');
      
    } catch (templateError) {
      console.error('   ❌ Template generation failed:', templateError.message);
      return;
    }
    
    // Step 5: Test PDF generation
    console.log('5️⃣  Testing PDF generation...');
    try {
      const result = await generator.generatePlan(testData);
      
      console.log('   ✅ PDF generation successful!');
      console.log('   📁 Generated files:');
      console.log(`      📋 Page 2: ${path.basename(result.page2)}`);
      console.log(`      📋 Page 3: ${path.basename(result.page3)}`);
      
      // Verify files exist
      const page2Exists = await fs.access(result.page2).then(() => true).catch(() => false);
      const page3Exists = await fs.access(result.page3).then(() => true).catch(() => false);
      
      console.log('   📊 File verification:');
      console.log(`      Page 2: ${page2Exists ? '✅ Exists' : '❌ Missing'}`);
      console.log(`      Page 3: ${page3Exists ? '✅ Exists' : '❌ Missing'}`);
      
      return result;
      
    } catch (pdfError) {
      console.error('   ❌ PDF generation failed:', pdfError.message);
      
      // Common troubleshooting tips
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Ensure you have sufficient disk space');
      console.log('   2. Check file permissions on the output directory');
      console.log('   3. Try running with sudo (if on macOS/Linux)');
      console.log('   4. Verify Node.js version compatibility');
      
      throw pdfError;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // System information for debugging
    console.log('\n🔍 System Information:');
    console.log('   Node.js version:', process.version);
    console.log('   Platform:', process.platform);
    console.log('   Architecture:', process.arch);
    console.log('   Memory usage:', process.memoryUsage());
    
    throw error;
    
  } finally {
    await generator.close();
    console.log('🏁 Test completed');
  }
}

// Advanced test with multiple scenarios
async function runAdvancedTest() {
  console.log('\n🔬 Running Advanced Test Scenarios...');
  
  const testScenarios = [
    {
      name: 'Urban Low Speed',
      data: {
        projectName: 'Urban_Test',
        siteLocation: 'DOWNTOWN, NC',
        speedLimit: 25,
        workZoneLength: 500,
        roadType: 'arterial'
      }
    },
    {
      name: 'Highway High Speed',
      data: {
        projectName: 'Highway_Test',
        siteLocation: 'I-40, NC',
        speedLimit: 65,
        workZoneLength: 5000,
        roadType: 'interstate'
      }
    },
    {
      name: 'Suburban Medium Speed',
      data: {
        projectName: 'Suburban_Test',
        siteLocation: 'APEX, NC',
        speedLimit: 45,
        workZoneLength: 2000,
        roadType: 'arterial'
      }
    }
  ];
  
  const generator = new FDOTPlanGenerator();
  const results = [];
  
  try {
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(`\n📋 Testing scenario ${i + 1}/${testScenarios.length}: ${scenario.name}`);
      
      try {
        const validation = generator.validateData(scenario.data);
        if (!validation.isValid) {
          console.log(`   ❌ Validation failed: ${validation.errors.join(', ')}`);
          results.push({ scenario: scenario.name, success: false, error: 'Validation failed' });
          continue;
        }
        
        const spacing = generator.getSpacingCalculations(scenario.data.speedLimit, scenario.data.roadType);
        console.log(`   📏 Spacing: Cones=${spacing.coneSpacing}ft, Taper=${spacing.taperLength}ft`);
        
        const result = await generator.generatePlan(scenario.data);
        console.log(`   ✅ Generated successfully`);
        
        results.push({ 
          scenario: scenario.name, 
          success: true, 
          files: [path.basename(result.page2), path.basename(result.page3)],
          spacing: spacing
        });
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        results.push({ scenario: scenario.name, success: false, error: error.message });
      }
    }
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`   ✅ Successful: ${successful.length}/${results.length}`);
    console.log(`   ❌ Failed: ${failed.length}/${results.length}`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed scenarios:');
      failed.forEach(f => console.log(`   - ${f.scenario}: ${f.error}`));
    }
    
    if (successful.length > 0) {
      console.log('\n✅ Successful scenarios:');
      successful.forEach(s => console.log(`   - ${s.scenario}: ${s.files.join(', ')}`));
    }
    
  } finally {
    await generator.close();
  }
}

// Error diagnosis function
async function diagnoseEnvironment() {
  console.log('🔧 Diagnosing Environment...');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  console.log(`Node.js version: ${nodeVersion} ${majorVersion >= 14 ? '✅' : '❌ (Requires 14+)'}`);
  
  // Check available memory
  const memory = process.memoryUsage();
  console.log(`Available memory: ${Math.round(memory.heapTotal / 1024 / 1024)}MB`);
  
  // Check platform-specific requirements
  console.log(`Platform: ${process.platform} ${process.arch}`);
  
  if (process.platform === 'darwin') {
    console.log('💡 macOS detected - if you encounter permission issues:');
    console.log('   1. Allow Node.js in System Preferences > Security & Privacy');
    console.log('   2. Try: sudo npm install puppeteer --unsafe-perm=true');
  }
  
  // Check Puppeteer installation
  try {
    const puppeteer = require('puppeteer');
    console.log('Puppeteer: ✅ Installed');
    
    try {
      const executablePath = puppeteer.executablePath();
      console.log(`Chrome executable: ${executablePath}`);
    } catch (e) {
      console.log('Chrome executable: ❌ Not found');
    }
    
  } catch (e) {
    console.log('Puppeteer: ❌ Not installed or corrupted');
    console.log('💡 Try: npm install puppeteer --force');
  }
  
  // Check output directory permissions
  try {
    const outputDir = path.join(__dirname, '../output');
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'test_permissions.txt'), 'test');
    await fs.unlink(path.join(outputDir, 'test_permissions.txt'));
    console.log('Output directory permissions: ✅ OK');
  } catch (e) {
    console.log('Output directory permissions: ❌ Error:', e.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--diagnose')) {
    await diagnoseEnvironment();
    return;
  }
  
  if (args.includes('--advanced')) {
    await runAdvancedTest();
    return;
  }
  
  // Default: run basic test
  await runBasicTest();
}

// Export for use in other modules
module.exports = {
  runBasicTest,
  runAdvancedTest,
  diagnoseEnvironment
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
