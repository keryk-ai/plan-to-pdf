/**
 * Example client code for interacting with the FDOT Plan Generator API
 * This shows how to integrate the API with your existing application
 */

class FDOTPlanClient {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the API is healthy
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * Validate project data before generating plans
   */
  async validateProject(projectData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Validation failed');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Validation error: ${error.message}`);
    }
  }

  /**
   * Generate FDOT standard pages only
   */
  async generateFDOTPages(projectData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate/fdot-pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Generation failed');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Generation error: ${error.message}`);
    }
  }

  /**
   * Generate complete plan with satellite image
   */
  async generateCompletePlan(projectData, satelliteImageFile) {
    try {
      const formData = new FormData();
      formData.append('projectData', JSON.stringify(projectData));
      
      if (satelliteImageFile) {
        formData.append('satelliteImage', satelliteImageFile);
      }

      const response = await fetch(`${this.baseUrl}/api/generate/complete-plan`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Generation failed');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Generation error: ${error.message}`);
    }
  }

  /**
   * Generate multiple plans in batch
   */
  async generateBatch(projectsArray) {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projects: projectsArray })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Batch generation failed');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Batch generation error: ${error.message}`);
    }
  }

  /**
   * Get spacing calculations for a given speed limit and road type
   */
  async getSpacingCalculations(speedLimit, roadType = 'arterial') {
    try {
      const response = await fetch(`${this.baseUrl}/api/spacing/${speedLimit}/${roadType}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get spacing calculations');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Spacing calculation error: ${error.message}`);
    }
  }

  /**
   * Preview HTML template before PDF generation
   */
  async previewTemplate(projectData, pageType) {
    try {
      const response = await fetch(`${this.baseUrl}/api/preview/${pageType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Preview failed');
      }
      
      return await response.text(); // Returns HTML
    } catch (error) {
      throw new Error(`Preview error: ${error.message}`);
    }
  }

  /**
   * List all generated files
   */
  async listFiles() {
    try {
      const response = await fetch(`${this.baseUrl}/api/files`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to list files');
      }
      
      return result;
    } catch (error) {
      throw new Error(`File listing error: ${error.message}`);
    }
  }

  /**
   * Get API configuration and options
   */
  async getConfig() {
    try {
      const response = await fetch(`${this.baseUrl}/api/config`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get configuration');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Configuration error: ${error.message}`);
    }
  }

  /**
   * Download a file by URL
   */
  async downloadFile(fileUrl, filename) {
    try {
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      
      // Create download link (for browser environments)
      if (typeof window !== 'undefined') {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      return blob;
    } catch (error) {
      throw new Error(`Download error: ${error.message}`);
    }
  }
}

// Example usage in different environments

// Example 1: Browser/Frontend usage
async function frontendExample() {
  const client = new FDOTPlanClient('http://localhost:3001');
  
  // Sample project data
  const projectData = {
    projectName: 'Main Street Construction',
    siteLocation: 'CARY, NC',
    speedLimit: 35,
    workZoneLength: 1500,
    indexNumber: '102-603',
    roadType: 'arterial'
  };

  try {
    // Check API health
    console.log('Checking API health...');
    const health = await client.checkHealth();
    console.log('API Status:', health);

    // Validate project data
    console.log('Validating project data...');
    const validation = await client.validateProject(projectData);
    console.log('Validation result:', validation);

    if (validation.validation.isValid) {
      // Generate FDOT pages
      console.log('Generating FDOT pages...');
      const result = await client.generateFDOTPages(projectData);
      console.log('Generation result:', result);

      // Download the generated files
      if (result.files.page2) {
        await client.downloadFile(result.files.page2.url, 'page2-general-info.pdf');
      }
      if (result.files.page3) {
        await client.downloadFile(result.files.page3.url, 'page3-work-zone.pdf');
      }
    }

  } catch (error) {
    console.error('Frontend example error:', error);
  }
}

// Example 2: Node.js/Backend usage
async function backendExample() {
  const client = new FDOTPlanClient('http://localhost:3001');
  
  const multipleProjects = [
    {
      projectName: 'Project A',
      siteLocation: 'LOCATION A, NC',
      speedLimit: 45,
      workZoneLength: 2000,
      indexNumber: '102-603'
    },
    {
      projectName: 'Project B',
      siteLocation: 'LOCATION B, NC',
      speedLimit: 55,
      workZoneLength: 3000,
      indexNumber: '102-605'
    }
  ];

  try {
    // Batch generate multiple projects
    console.log('Generating multiple projects...');
    const batchResult = await client.generateBatch(multipleProjects);
    console.log('Batch result:', batchResult);

    // Get spacing calculations for different scenarios
    const spacingForUrban = await client.getSpacingCalculations(35, 'arterial');
    const spacingForHighway = await client.getSpacingCalculations(65, 'interstate');
    
    console.log('Urban spacing (35 mph):', spacingForUrban);
    console.log('Highway spacing (65 mph):', spacingForHighway);

  } catch (error) {
    console.error('Backend example error:', error);
  }
}

// Example 3: Integration with file upload
async function fileUploadExample() {
  const client = new FDOTPlanClient('http://localhost:3001');
  
  // This would typically come from a file input in the browser
  // const fileInput = document.getElementById('satelliteImage');
  // const satelliteFile = fileInput.files[0];
  
  const projectData = {
    projectName: 'Highway Bridge Repair',
    siteLocation: 'DURHAM, NC',
    speedLimit: 55,
    workZoneLength: 2500,
    indexNumber: '102-603',
    roadType: 'limited_access',
    estimatedDurationHours: 48
  };

  try {
    // Generate complete plan with satellite image
    // const result = await client.generateCompletePlan(projectData, satelliteFile);
    console.log('File upload example requires actual file input');

  } catch (error) {
    console.error('File upload example error:', error);
  }
}

// Example 4: Error handling and validation
async function errorHandlingExample() {
  const client = new FDOTPlanClient('http://localhost:3001');
  
  // Intentionally invalid data
  const invalidData = {
    projectName: '', // Missing required field
    speedLimit: 150, // Invalid speed limit
    workZoneLength: 50 // Too short
  };

  try {
    const validation = await client.validateProject(invalidData);
    console.log('Validation errors:', validation.validation.errors);
    
  } catch (error) {
    console.error('Expected validation error:', error.message);
  }
}

// Example 5: Configuration and options
async function configurationExample() {
  const client = new FDOTPlanClient('http://localhost:3001');
  
  try {
    // Get available configuration options
    const config = await client.getConfig();
    console.log('Available plan types:', Object.keys(config.config.planTypes));
    console.log('Supported speed limits:', config.config.speedLimits);
    console.log('Work zone types:', Object.keys(config.config.workZoneTypes));

    // List existing files
    const files = await client.listFiles();
    console.log('Generated files:', files.files.length);

  } catch (error) {
    console.error('Configuration example error:', error);
  }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    FDOTPlanClient,
    frontendExample,
    backendExample,
    fileUploadExample,
    errorHandlingExample,
    configurationExample
  };
} else {
  // Browser environment
  window.FDOTPlanClient = FDOTPlanClient;
}

// Run examples if this file is executed directly in Node.js
if (typeof require !== 'undefined' && require.main === module) {
  console.log('=== FDOT Plan Client Examples ===\n');
  
  (async () => {
    await configurationExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await errorHandlingExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await backendExample();
  })().catch(console.error);
}
