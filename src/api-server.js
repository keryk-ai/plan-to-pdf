const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const FDOTPlanGenerator = require('./index.js');
const { CompletePlanGenerator, FDOTIntegrationHelpers } = require('./integration-example.js');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../output/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

// Ensure upload directory exists
(async () => {
  try {
    await fs.mkdir(path.join(__dirname, '../output/uploads'), { recursive: true });
  } catch (error) {
    console.log('Upload directory already exists or created');
  }
})();

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'FDOT Plan Generator API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Validate project data
 */
app.post('/api/validate', async (req, res) => {
  try {
    const generator = new FDOTPlanGenerator();
    const validation = generator.validateData(req.body);
    
    res.json({
      success: true,
      validation: validation,
      spacingCalculations: validation.isValid ? 
        generator.getSpacingCalculations(req.body.speedLimit, req.body.roadType) : 
        null
    });
    
    await generator.close();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate FDOT standard pages only
 */
app.post('/api/generate/fdot-pages', async (req, res) => {
  try {
    const generator = new FDOTPlanGenerator();
    const result = await generator.generatePlan(req.body);
    
    // Convert file paths to downloadable URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const response = {
      success: true,
      files: {
        page2: {
          path: result.page2,
          url: `${baseUrl}/api/download/${path.basename(result.page2)}`
        },
        page3: {
          path: result.page3,
          url: `${baseUrl}/api/download/${path.basename(result.page3)}`
        }
      },
      validation: result.validation
    };
    
    await generator.close();
    res.json(response);
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate complete plan with uploaded satellite image
 */
app.post('/api/generate/complete-plan', upload.single('satelliteImage'), async (req, res) => {
  try {
    const projectData = JSON.parse(req.body.projectData);
    const satelliteImagePath = req.file ? req.file.path : null;
    
    const planGenerator = new CompletePlanGenerator();
    const result = await planGenerator.generateCompletePlan(projectData, satelliteImagePath);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const response = {
      success: true,
      files: {
        satelliteImage: satelliteImagePath ? {
          path: result.page1_satellite,
          url: `${baseUrl}/api/download/${path.basename(result.page1_satellite)}`
        } : null,
        page2: {
          path: result.page2_general,
          url: `${baseUrl}/api/download/${path.basename(result.page2_general)}`
        },
        page3: {
          path: result.page3_workzone,
          url: `${baseUrl}/api/download/${path.basename(result.page3_workzone)}`
        }
      },
      validation: result.validation
    };
    
    await planGenerator.close();
    res.json(response);
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Batch generate multiple plans
 */
app.post('/api/generate/batch', async (req, res) => {
  try {
    const { projects } = req.body;
    
    if (!Array.isArray(projects)) {
      return res.status(400).json({
        success: false,
        error: 'Projects must be an array'
      });
    }
    
    const planGenerator = new CompletePlanGenerator();
    const results = await planGenerator.generateMultiplePlans(projects);
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Add download URLs to successful results
    const processedResults = results.map(result => {
      if (result.success && result.files) {
        return {
          ...result,
          files: {
            page2: {
              path: result.files.page2,
              url: `${baseUrl}/api/download/${path.basename(result.files.page2)}`
            },
            page3: {
              path: result.files.page3,
              url: `${baseUrl}/api/download/${path.basename(result.files.page3)}`
            }
          }
        };
      }
      return result;
    });
    
    await planGenerator.close();
    
    res.json({
      success: true,
      results: processedResults,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Preview HTML templates
 */
app.post('/api/preview/:pageType', async (req, res) => {
  try {
    const { pageType } = req.params;
    
    if (!['page2', 'page3'].includes(pageType)) {
      return res.status(400).json({
        success: false,
        error: 'Page type must be page2 or page3'
      });
    }
    
    const generator = new FDOTPlanGenerator();
    const html = await generator.previewHTML(req.body, pageType);
    
    await generator.close();
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Download generated files
 */
app.get('/api/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../output', filename);
    
    // Security check - ensure file is in output directory
    if (!filePath.startsWith(path.join(__dirname, '../output'))) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Check if file exists
    await fs.access(filePath);
    
    res.download(filePath);
    
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
});

/**
 * Get spacing calculations
 */
app.get('/api/spacing/:speedLimit/:roadType?', async (req, res) => {
  try {
    const speedLimit = parseInt(req.params.speedLimit);
    const roadType = req.params.roadType || 'arterial';
    
    if (isNaN(speedLimit) || speedLimit < 25 || speedLimit > 80) {
      return res.status(400).json({
        success: false,
        error: 'Speed limit must be a number between 25 and 80'
      });
    }
    
    const generator = new FDOTPlanGenerator();
    const spacing = generator.getSpacingCalculations(speedLimit, roadType);
    
    await generator.close();
    
    res.json({
      success: true,
      speedLimit: speedLimit,
      roadType: roadType,
      spacing: spacing
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List generated files
 */
app.get('/api/files', async (req, res) => {
  try {
    const outputDir = path.join(__dirname, '../output');
    const files = await fs.readdir(outputDir);
    
    const pdfFiles = files
      .filter(file => file.endsWith('.pdf'))
      .map(file => ({
        name: file,
        url: `${req.protocol}://${req.get('host')}/api/download/${file}`,
        created: new Date(parseInt(file.split('_').pop().split('.')[0])).toISOString()
      }))
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    res.json({
      success: true,
      files: pdfFiles
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get configuration and supported options
 */
app.get('/api/config', (req, res) => {
  const config = require('./config.json');
  
  res.json({
    success: true,
    config: {
      planTypes: config.planTypes,
      speedLimits: config.speedLimits,
      workZoneTypes: config.workZoneTypes,
      validation: config.validation
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 FDOT Plan Generator API running on port ${port}`);
  console.log(`📋 API Documentation:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /api/validate - Validate project data`);
  console.log(`   POST /api/generate/fdot-pages - Generate FDOT pages`);
  console.log(`   POST /api/generate/complete-plan - Generate complete plan with satellite image`);
  console.log(`   POST /api/generate/batch - Batch generate multiple plans`);
  console.log(`   POST /api/preview/:pageType - Preview HTML templates`);
  console.log(`   GET  /api/download/:filename - Download generated files`);
  console.log(`   GET  /api/spacing/:speedLimit/:roadType - Get spacing calculations`);
  console.log(`   GET  /api/files - List generated files`);
  console.log(`   GET  /api/config - Get configuration options`);
});

module.exports = app;
