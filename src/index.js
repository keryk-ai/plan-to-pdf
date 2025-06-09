const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const { PDFDocument } = require('pdf-lib');

// Register Handlebars helpers
handlebars.registerHelper('contains', function(str, substring) {
  return str && str.includes(substring);
});
const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');
const { FDOTDataValidator, FDOTCalculator, FDOTTemplateHelper } = require('./utils');

class FDOTPlanGenerator {
  constructor() {
    this.templateDir = path.join(__dirname, '../templates');
    this.outputDir = path.join(__dirname, '../output');
    this.browser = null;
    this.validator = new FDOTDataValidator();
    this.calculator = new FDOTCalculator();
    this.templateHelper = new FDOTTemplateHelper();
  }

  async init() {
    try {
      console.log('🚀 Launching browser...');
      
      // Cloud environment configuration
      const isCloudEnvironment = process.env.NODE_ENV === 'production' || process.env.GOOGLE_CLOUD_PROJECT;
      
      const browserConfig = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-default-apps'
        ],
        timeout: 60000, // Increased timeout
        ignoreHTTPSErrors: true,
        defaultViewport: {
          width: 1200,
          height: 800
        }
      };
      
      // Use system Chrome in cloud environment
      if (isCloudEnvironment && process.env.PUPPETEER_EXECUTABLE_PATH) {
        browserConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        console.log('📱 Using system Chrome:', process.env.PUPPETEER_EXECUTABLE_PATH);
      }
      
      this.browser = await puppeteer.launch(browserConfig);
      
      console.log('✅ Browser launched successfully');
      
      // Test browser connection
      const pages = await this.browser.pages();
      if (pages.length === 0) {
        await this.browser.newPage();
      }
      
    } catch (error) {
      console.error('❌ Failed to launch browser:', error.message);
      console.log('💡 Trying alternative browser configuration...');
      
      // Fallback configuration
      try {
        this.browser = await puppeteer.launch({
          headless: true, // Use legacy headless mode
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
          ],
          timeout: 30000,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        });
        console.log('✅ Browser launched with fallback configuration');
      } catch (fallbackError) {
        console.error('❌ Fallback browser launch also failed:', fallbackError.message);
        throw new Error('Unable to launch browser. Please check your system configuration.');
      }
    }
  }

  async generatePlan(data) {
    if (!this.browser) {
      await this.init();
    }

    // Validate input data
    const validation = this.validator.validateProjectData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      console.warn('⚠️  Warnings:', validation.warnings.join(', '));
    }

    // Format data for templates
    const formattedData = this.templateHelper.formatForTemplate(data);

    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      console.log('📄 Generating Page 1 (Traffic Control Plan)...');
      const page1Path = await this.generatePage1(formattedData);
      
      console.log('📄 Generating Page 2 (General Information)...');
      const page2Path = await this.generatePage2(formattedData);
      
      console.log('📄 Generating Page 3 (Work Zone Details)...');
      const page3Path = await this.generatePage3(formattedData);

      // Combine pages if needed
      const combinedPath = await this.combinePages([page1Path, page2Path, page3Path], formattedData);

      return {
        page1: page1Path,
        page2: page2Path,
        page3: page3Path,
        combined: combinedPath,
        validation: validation
      };
    } catch (error) {
      console.error('❌ Error generating plan:', error);
      throw error;
    }
  }

  async generatePage1(data) {
    let page = null;
    try {
      const templatePath = path.join(this.templateDir, 'page1-traffic-plan.html');
      const template = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(template);
      
      // Process satellite image if provided
      let processedData = { ...data };
      if (data.satelliteImagePath) {
        try {
          const imagePath = path.resolve(data.satelliteImagePath);
          const imageBuffer = await fs.readFile(imagePath);
          const imageExt = path.extname(imagePath).toLowerCase();
          let mimeType = 'image/png';
          
          if (imageExt === '.jpg' || imageExt === '.jpeg') {
            mimeType = 'image/jpeg';
          } else if (imageExt === '.gif') {
            mimeType = 'image/gif';
          } else if (imageExt === '.svg') {
            mimeType = 'image/svg+xml';
            // For SVG, also provide the raw SVG content
            processedData.satelliteImageSvg = imageBuffer.toString('utf8');
          }
          
          const base64Image = imageBuffer.toString('base64');
          processedData.satelliteImageData = `data:${mimeType};base64,${base64Image}`;
          
          console.log(`✅ Loaded satellite image: ${path.basename(imagePath)}`);
          console.log(`   MIME type: ${mimeType}`);
          console.log(`   Data URL length: ${processedData.satelliteImageData.length} characters`);
        } catch (imageError) {
          console.warn(`⚠️  Could not load satellite image: ${imageError.message}`);
          processedData.satelliteImageData = null;
        }
      }
      
      const html = compiledTemplate(processedData);

      // Save HTML for debugging
      const debugPath = path.join(this.outputDir, 'debug_page1.html');
      await fs.writeFile(debugPath, html);
      console.log(`🔍 Debug HTML saved: ${debugPath}`);

      page = await this.browser.newPage();
      
      // Set a longer timeout for content loading
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      const outputPath = path.join(this.outputDir, `${(data.projectName || 'test').replace(/[^a-zA-Z0-9]/g, '_')}_page1_${Date.now()}.pdf`);
      
      await page.pdf({
        path: outputPath,
        format: 'A4',
        landscape: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        preferCSSPageSize: false
      });

      console.log(`✅ Page 1 generated: ${path.basename(outputPath)}`);
      return outputPath;
      
    } catch (error) {
      console.error('❌ Error generating Page 1:', error.message);
      throw error;
    } finally {
      if (page) {
        await page.close().catch(() => {}); // Ignore close errors
      }
    }
  }

  async generatePage2(data) {
    let page = null;
    try {
      const templatePath = path.join(this.templateDir, 'page2-general-info.html');
      const template = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(template);
      
      const html = compiledTemplate(data);

      page = await this.browser.newPage();
      
      // Set a longer timeout for content loading
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      const outputPath = path.join(this.outputDir, `${(data.projectName || 'test').replace(/[^a-zA-Z0-9]/g, '_')}_page2_${Date.now()}.pdf`);
      
      await page.pdf({
        path: outputPath,
        format: 'A4',
        landscape: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        preferCSSPageSize: false
      });

      console.log(`✅ Page 2 generated: ${path.basename(outputPath)}`);
      return outputPath;
      
    } catch (error) {
      console.error('❌ Error generating Page 2:', error.message);
      throw error;
    } finally {
      if (page) {
        await page.close().catch(() => {}); // Ignore close errors
      }
    }
  }

  async generatePage3(data) {
    let page = null;
    try {
      const templatePath = path.join(this.templateDir, 'page3-work-zone.html');
      const template = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(template);
      
      const html = compiledTemplate(data);

      page = await this.browser.newPage();
      
      // Set a longer timeout for content loading
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      const outputPath = path.join(this.outputDir, `${(data.projectName || 'test').replace(/[^a-zA-Z0-9]/g, '_')}_page3_${Date.now()}.pdf`);
      
      await page.pdf({
        path: outputPath,
        format: 'A4',
        landscape: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        preferCSSPageSize: false
      });

      console.log(`✅ Page 3 generated: ${path.basename(outputPath)}`);
      return outputPath;
      
    } catch (error) {
      console.error('❌ Error generating Page 3:', error.message);
      throw error;
    } finally {
      if (page) {
        await page.close().catch(() => {}); // Ignore close errors
      }
    }
  }

  async combinePages(pagePaths, data) {
    try {
      console.log('📚 Combining pages into single PDF...');
      
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Read and merge each page
      for (const pagePath of pagePaths) {
        if (await fs.access(pagePath).then(() => true).catch(() => false)) {
          const pdfBytes = await fs.readFile(pagePath);
          const pdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
      }
      
      // Generate output path for combined PDF
      const projectName = (data.projectName || 'traffic_control_plan').replace(/[^a-zA-Z0-9]/g, '_');
      const combinedPath = path.join(this.outputDir, `${projectName}_complete_plan_${Date.now()}.pdf`);
      
      // Save the merged PDF
      const pdfBytes = await mergedPdf.save();
      await fs.writeFile(combinedPath, pdfBytes);
      
      console.log(`✅ Combined PDF created: ${path.basename(combinedPath)}`);
      return combinedPath;
      
    } catch (error) {
      console.warn('⚠️  Warning: Could not combine PDFs:', error.message);
      console.log('📄 Individual page files are still available');
      return null;
    }
  }

  /**
   * Preview generated HTML before PDF conversion (useful for debugging)
   * @param {Object} data - Project data
   * @param {string} pageType - 'page2' or 'page3'
   * @returns {string} - Generated HTML
   */
  async previewHTML(data, pageType) {
    const validation = this.validator.validateProjectData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const formattedData = this.templateHelper.formatForTemplate(data);
    const templatePath = path.join(this.templateDir, `${pageType}-${pageType === 'page2' ? 'general-info' : 'work-zone'}.html`);
    const template = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(template);
    
    return compiledTemplate(formattedData);
  }

  /**
   * Get spacing calculations for a project
   * @param {number} speedLimit 
   * @param {string} roadType 
   * @returns {Object}
   */
  getSpacingCalculations(speedLimit, roadType = 'arterial') {
    return this.calculator.calculateSpacingRequirements(speedLimit, roadType);
  }

  /**
   * Validate project data without generating PDFs
   * @param {Object} data 
   * @returns {Object}
   */
  validateData(data) {
    return this.validator.validateProjectData(data);
  }

  async close() {
    if (this.browser) {
      try {
        console.log('🔒 Closing browser...');
        await this.browser.close();
        this.browser = null;
        console.log('✅ Browser closed successfully');
      } catch (error) {
        console.warn('⚠️  Warning: Error closing browser:', error.message);
      }
    }
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.browser) {
        await this.init();
      }
      
      const page = await this.browser.newPage();
      await page.setContent('<html><body><h1>Health Check</h1></body></html>');
      await page.close();
      
      return { status: 'healthy', browser: 'connected' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = FDOTPlanGenerator;

// Example usage if run directly
if (require.main === module) {
  const generator = new FDOTPlanGenerator();
  
  const sampleData = {
    projectName: 'TEST',
    siteLocation: 'CARY, NC',
    certificateNumber: '605769',
    instructorName: 'Mark Meyers',
    issueDate: '02/13/2023',
    expirationDate: '02/02/2027',
    fyYear: '2024-25',
    indexNumber: '102-603',
    sheetNumber: '1 of 2',
    lastRevision: '11/01/23',
    speedLimit: 35,
    workZoneLength: 1000,
    roadType: 'arterial',
    estimatedDurationHours: 8
  };

  async function runTest() {
    try {
      console.log('🔍 Running health check...');
      const health = await generator.healthCheck();
      console.log('Health status:', health);

      if (health.status !== 'healthy') {
        throw new Error('Browser health check failed');
      }

      console.log('✅ Validating project data...');
      const validation = generator.validateData(sampleData);
      console.log('Validation result:', validation);

      if (validation.isValid) {
        console.log('📊 Calculating spacing requirements...');
        const spacing = generator.getSpacingCalculations(sampleData.speedLimit, sampleData.roadType);
        console.log('Spacing calculations:', spacing);

        console.log('🚀 Generating FDOT plan...');
        const result = await generator.generatePlan(sampleData);
        
        console.log('✅ Generation complete!');
        console.log('📁 Generated files:');
        console.log(`   📋 Page 2: ${result.page2}`);
        console.log(`   📋 Page 3: ${result.page3}`);
        
        return result;
      } else {
        console.error('❌ Data validation failed:', validation.errors);
      }
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    } finally {
      await generator.close();
    }
  }

  runTest().catch(console.error);
}
