const FDOTPlanGenerator = require('./index.js');
const path = require('path');

/**
 * Example integration with satellite imagery system
 * This demonstrates how to combine your existing satellite image generation
 * with the FDOT standard pages to create complete traffic control plans
 */

class CompletePlanGenerator {
  constructor() {
    this.fdotGenerator = new FDOTPlanGenerator();
  }

  /**
   * Generate a complete traffic control plan with satellite imagery and FDOT pages
   * @param {Object} projectData - Project information
   * @param {string} satelliteImagePath - Path to generated satellite image
   * @returns {Object} - Paths to all generated files
   */
  async generateCompletePlan(projectData, satelliteImagePath) {
    console.log('🚀 Starting complete plan generation...');
    
    try {
      // Step 1: Validate project data
      console.log('✅ Validating project data...');
      const validation = this.fdotGenerator.validateData(projectData);
      
      if (!validation.isValid) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️  Warnings:', validation.warnings.join(', '));
      }

      // Step 2: Generate FDOT standard pages
      console.log('📄 Generating FDOT standard pages...');
      const fdotPages = await this.fdotGenerator.generatePlan(projectData);

      // Step 3: (Your existing satellite image generation would go here)
      console.log('🛰️  Using provided satellite image:', satelliteImagePath);
      
      // Step 4: Combine all pages (this would use a PDF merger in production)
      console.log('📚 Organizing plan pages...');
      const completePlan = {
        page1_satellite: satelliteImagePath, // Your generated satellite image
        page2_general: fdotPages.page2,     // FDOT general information
        page3_workzone: fdotPages.page3,    // FDOT work zone details
        validation: fdotPages.validation
      };

      console.log('✅ Complete plan generation finished!');
      return completePlan;

    } catch (error) {
      console.error('❌ Error generating complete plan:', error);
      throw error;
    }
  }

  /**
   * Generate multiple plans for different scenarios
   * @param {Array} projectDataArray - Array of project configurations
   * @returns {Array} - Generated plans for each scenario
   */
  async generateMultiplePlans(projectDataArray) {
    const results = [];
    
    for (let i = 0; i < projectDataArray.length; i++) {
      const data = projectDataArray[i];
      console.log(`\n📋 Processing plan ${i + 1}/${projectDataArray.length}: ${data.projectName}`);
      
      try {
        const plan = await this.fdotGenerator.generatePlan(data);
        results.push({
          success: true,
          projectName: data.projectName,
          files: plan
        });
      } catch (error) {
        console.error(`❌ Failed to generate plan for ${data.projectName}:`, error.message);
        results.push({
          success: false,
          projectName: data.projectName,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Preview HTML templates before PDF generation
   * @param {Object} projectData 
   * @returns {Object}
   */
  async previewTemplates(projectData) {
    const page2HTML = await this.fdotGenerator.previewHTML(projectData, 'page2');
    const page3HTML = await this.fdotGenerator.previewHTML(projectData, 'page3');
    
    return {
      page2: page2HTML,
      page3: page3HTML
    };
  }

  async close() {
    await this.fdotGenerator.close();
  }
}

// Example usage scenarios
async function demonstrateIntegration() {
  const planGenerator = new CompletePlanGenerator();

  // Scenario 1: Single project with satellite image
  const singleProject = {
    projectName: 'I-40 Bridge Repair',
    siteLocation: 'CARY, NC',
    speedLimit: 55,
    workZoneLength: 2500,
    indexNumber: '102-603',
    roadType: 'limited_access',
    estimatedDurationHours: 72,
    contractNumber: 'DOT-2024-0156',
    contractor: 'Triangle Construction LLC',
    workDescription: 'Bridge deck repair and joint replacement',
    laneClosureType: 'Right Lane',
    trafficControlMethod: 'Flagger',
    workHours: '9:00 PM - 5:00 AM'
  };

  try {
    // Generate single complete plan
    console.log('=== Single Project Example ===');
    const satelliteImagePath = '/path/to/your/satellite-image.pdf'; // Your satellite image
    const completePlan = await planGenerator.generateCompletePlan(singleProject, satelliteImagePath);
    
    console.log('📁 Complete plan files:');
    console.log(`   🛰️  Satellite Image: ${completePlan.page1_satellite}`);
    console.log(`   📄 General Info: ${completePlan.page2_general}`);
    console.log(`   📄 Work Zone Details: ${completePlan.page3_workzone}`);

    // Show spacing calculations
    const spacing = planGenerator.fdotGenerator.getSpacingCalculations(
      singleProject.speedLimit, 
      singleProject.roadType
    );
    console.log('\n📏 Calculated spacing requirements:');
    console.log(`   Cone spacing: ${spacing.coneSpacing} ft`);
    console.log(`   Taper length: ${spacing.taperLength} ft`);
    console.log(`   Buffer length: ${spacing.bufferLength} ft`);
    console.log(`   Sign spacing: ${spacing.signSpacing} ft`);

  } catch (error) {
    console.error('Error in single project example:', error);
  }

  // Scenario 2: Multiple projects batch processing
  const multipleProjects = [
    {
      projectName: 'Highway 64 Resurfacing',
      siteLocation: 'APEX, NC',
      speedLimit: 45,
      workZoneLength: 1200,
      indexNumber: '102-603'
    },
    {
      projectName: 'Main Street Utility Work',
      siteLocation: 'CARY, NC',
      speedLimit: 35,
      workZoneLength: 800,
      indexNumber: '102-603'
    },
    {
      projectName: 'I-440 Lane Addition',
      siteLocation: 'RALEIGH, NC',
      speedLimit: 65,
      workZoneLength: 5000,
      indexNumber: '102-605',
      roadType: 'interstate'
    }
  ];

  try {
    console.log('\n=== Multiple Projects Example ===');
    const batchResults = await planGenerator.generateMultiplePlans(multipleProjects);
    
    console.log('\n📊 Batch processing results:');
    batchResults.forEach((result, index) => {
      if (result.success) {
        console.log(`   ✅ ${result.projectName}: Generated successfully`);
      } else {
        console.log(`   ❌ ${result.projectName}: ${result.error}`);
      }
    });

  } catch (error) {
    console.error('Error in multiple projects example:', error);
  }

  // Scenario 3: Preview templates (useful for debugging)
  try {
    console.log('\n=== Template Preview Example ===');
    const previews = await planGenerator.previewTemplates(singleProject);
    
    // Save preview HTML files for inspection
    const fs = require('fs').promises;
    await fs.writeFile(path.join(__dirname, '../output/preview_page2.html'), previews.page2);
    await fs.writeFile(path.join(__dirname, '../output/preview_page3.html'), previews.page3);
    
    console.log('💻 HTML previews saved to output directory');
    console.log('   📄 preview_page2.html');
    console.log('   📄 preview_page3.html');

  } catch (error) {
    console.error('Error in template preview example:', error);
  }

  await planGenerator.close();
}

// Integration helper functions for your existing system
class FDOTIntegrationHelpers {
  /**
   * Convert your existing project data format to FDOT format
   * @param {Object} yourProjectData - Your existing data structure
   * @returns {Object} - FDOT-compatible data structure
   */
  static convertProjectData(yourProjectData) {
    return {
      projectName: yourProjectData.name || yourProjectData.title,
      siteLocation: yourProjectData.location || yourProjectData.site,
      speedLimit: yourProjectData.speed || 35,
      workZoneLength: yourProjectData.length || 1000,
      indexNumber: yourProjectData.fdotIndex || '102-603',
      roadType: yourProjectData.roadClassification || 'arterial',
      estimatedDurationHours: yourProjectData.duration || 8,
      contractNumber: yourProjectData.contract,
      contractor: yourProjectData.contractorName,
      workDescription: yourProjectData.description,
      laneClosureType: yourProjectData.closureType || 'Right Lane',
      trafficControlMethod: yourProjectData.controlMethod || 'Flagger',
      workHours: yourProjectData.schedule || '7:00 AM - 5:00 PM'
    };
  }

  /**
   * Validate multiple projects and return summary
   * @param {Array} projects - Array of project data
   * @returns {Object} - Validation summary
   */
  static validateMultipleProjects(projects) {
    const generator = new FDOTPlanGenerator();
    const results = {
      valid: [],
      invalid: [],
      warnings: []
    };

    projects.forEach((project, index) => {
      const validation = generator.validateData(project);
      
      if (validation.isValid) {
        results.valid.push({ index, projectName: project.projectName });
      } else {
        results.invalid.push({ 
          index, 
          projectName: project.projectName, 
          errors: validation.errors 
        });
      }

      if (validation.warnings.length > 0) {
        results.warnings.push({ 
          index, 
          projectName: project.projectName, 
          warnings: validation.warnings 
        });
      }
    });

    return results;
  }
}

module.exports = {
  CompletePlanGenerator,
  FDOTIntegrationHelpers,
  demonstrateIntegration
};

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstrateIntegration().catch(console.error);
}
