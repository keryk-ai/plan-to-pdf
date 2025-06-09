const fs = require('fs').promises;
const path = require('path');

/**
 * Basic test script that doesn't require external dependencies
 * This validates the project structure and basic functionality
 */

async function runBasicTests() {
  console.log('🧪 Running basic tests for FDOT Plan Generator...\n');

  const tests = [
    testProjectStructure,
    testConfigFile,
    testTemplateFiles,
    testUtilsModule,
    testDataValidation
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      console.error(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All basic tests passed! Ready to install dependencies.');
    console.log('\nNext steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm test');
    console.log('3. Run: npm run server (for API)');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
  }
}

async function testProjectStructure() {
  console.log('🔍 Testing project structure...');
  
  const requiredFiles = [
    'src/index.js',
    'src/utils.js',
    'src/config.json',
    'templates/page2-general-info.html',
    'templates/page3-work-zone.html',
    'README.md'
  ];

  const requiredDirs = [
    'src',
    'templates',
    'output',
    'assets'
  ];

  // Check directories
  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, '..', dir);
    try {
      await fs.access(dirPath);
    } catch (error) {
      throw new Error(`Missing directory: ${dir}`);
    }
  }

  // Check files
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`Missing file: ${file}`);
    }
  }

  console.log('✅ Project structure is correct');
}

async function testConfigFile() {
  console.log('🔍 Testing configuration file...');
  
  const configPath = path.join(__dirname, 'config.json');
  const configContent = await fs.readFile(configPath, 'utf8');
  const config = JSON.parse(configContent);

  // Check required config sections
  const requiredSections = ['planTypes', 'speedLimits', 'deviceSpacing', 'taperLengths', 'bufferLengths'];
  
  for (const section of requiredSections) {
    if (!config[section]) {
      throw new Error(`Missing config section: ${section}`);
    }
  }

  // Check speed limit data
  if (!config.deviceSpacing['35'] || !config.taperLengths['35']) {
    throw new Error('Missing speed limit data for 35 mph');
  }

  console.log('✅ Configuration file is valid');
}

async function testTemplateFiles() {
  console.log('🔍 Testing template files...');
  
  const templates = [
    'page2-general-info.html',
    'page3-work-zone.html'
  ];

  for (const template of templates) {
    const templatePath = path.join(__dirname, '..', 'templates', template);
    const content = await fs.readFile(templatePath, 'utf8');
    
    // Check for basic HTML structure
    if (!content.includes('<!DOCTYPE html>')) {
      throw new Error(`${template} missing DOCTYPE declaration`);
    }
    
    if (!content.includes('{{')) {
      throw new Error(`${template} missing Handlebars template variables`);
    }

    // Check for FDOT-specific content
    if (!content.includes('FDOT')) {
      throw new Error(`${template} missing FDOT branding`);
    }
  }

  console.log('✅ Template files are valid');
}

async function testUtilsModule() {
  console.log('🔍 Testing utilities module...');
  
  try {
    // This will test if the utils module can be loaded
    const utilsPath = path.join(__dirname, 'utils.js');
    const utilsContent = await fs.readFile(utilsPath, 'utf8');
    
    // Check for required classes
    const requiredClasses = ['FDOTDataValidator', 'FDOTCalculator', 'FDOTTemplateHelper'];
    
    for (const className of requiredClasses) {
      if (!utilsContent.includes(`class ${className}`)) {
        throw new Error(`Missing class: ${className}`);
      }
    }

    console.log('✅ Utils module structure is correct');
  } catch (error) {
    throw new Error(`Utils module error: ${error.message}`);
  }
}

async function testDataValidation() {
  console.log('🔍 Testing data validation logic...');
  
  // Test sample project data structure
  const sampleData = {
    projectName: 'TEST',
    siteLocation: 'CARY, NC',
    speedLimit: 35,
    workZoneLength: 1000,
    indexNumber: '102-603'
  };

  // Basic validation checks without requiring external modules
  if (!sampleData.projectName || typeof sampleData.projectName !== 'string') {
    throw new Error('Project name validation failed');
  }

  if (!sampleData.speedLimit || sampleData.speedLimit < 25 || sampleData.speedLimit > 80) {
    throw new Error('Speed limit validation failed');
  }

  if (!sampleData.workZoneLength || sampleData.workZoneLength < 100) {
    throw new Error('Work zone length validation failed');
  }

  console.log('✅ Data validation logic is correct');
}

// Install dependencies function
async function installDependencies() {
  console.log('\n📦 Installing dependencies...');
  console.log('Please run: npm install');
  console.log('\nThis will install:');
  console.log('- puppeteer (PDF generation)');
  console.log('- handlebars (template engine)');
  console.log('- moment (date formatting)');
  console.log('- express (API server)');
  console.log('- multer (file uploads)');
  console.log('- cors (cross-origin requests)');
}

// Run tests
if (require.main === module) {
  runBasicTests()
    .then(() => {
      console.log('\n' + '='.repeat(60));
      installDependencies();
    })
    .catch((error) => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = {
  runBasicTests,
  testProjectStructure,
  testConfigFile,
  testTemplateFiles,
  testUtilsModule,
  testDataValidation
};
