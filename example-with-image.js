const FDOTPlanGenerator = require('./src/index.js');
const path = require('path');

async function generatePlanWithSatelliteImage() {
  console.log('🛰️  Generating FDOT Plan with Satellite Image...');
  
  const generator = new FDOTPlanGenerator();
  
  // Project data with satellite image
  const projectData = {
    projectName: 'Airport Road Resurfacing',
    siteLocation: 'Cary, NC - Airport Boulevard',
    speedLimit: 35,
    workZoneLength: 1200,
    
    // Additional project details
    contractNumber: 'FDOT-2024-001',
    contractor: 'ABC Construction Company',
    engineerName: 'John Smith, P.E.',
    workDescription: 'Road Resurfacing and Striping',
    estimatedDuration: '30 days',
    workHours: '7:00 AM - 5:00 PM',
    weekendWork: false,
    laneClosureType: 'Single Lane Closure',
    trafficControlMethod: 'Flagger Control',
    
    // Certificate information
    certificateNumber: '605769',
    instructorName: 'Mark Meyers',
    issueDate: '02/13/2023',
    expirationDate: '02/02/2027',
    
    // Plan information
    fyYear: '2024-25',
    indexNumber: '102-603',
    sheetNumber: '1 of 3',
    lastRevision: '12/15/2024',
    
    // Satellite image path (relative to project root)
    // Save your Airport Road satellite image as 'airport-road-satellite.png' in assets/images/
    satelliteImagePath: './assets/images/airport-road-satellite.png'
  };

  try {
    // Health check
    const health = await generator.healthCheck();
    if (health.status !== 'healthy') {
      console.error('❌ Browser health check failed:', health.error);
      return;
    }
    
    // Generate the complete plan
    const result = await generator.generatePlan(projectData);
    
    console.log('✅ Plan generation complete!');
    console.log('📁 Generated files:');
    console.log('   📋 Page 1 (Traffic Control Plan):', path.basename(result.page1));
    console.log('   📋 Page 2 (General Information):', path.basename(result.page2));
    console.log('   📋 Page 3 (Work Zone Details):', path.basename(result.page3));
    
    // Close the generator
    await generator.close();
    
  } catch (error) {
    console.error('❌ Error generating plan:', error);
    await generator.close();
  }
}

// Run the example
if (require.main === module) {
  generatePlanWithSatelliteImage();
}

module.exports = generatePlanWithSatelliteImage;