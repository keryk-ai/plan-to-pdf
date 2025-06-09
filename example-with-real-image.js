const FDOTPlanGenerator = require('./src/index.js');
const path = require('path');

async function generatePlanWithRealSatelliteImage() {
  console.log('🛰️  Generating FDOT Plan with Real Satellite Image...');
  
  const generator = new FDOTPlanGenerator();
  
  // Project data matching your Airport Road project
  const projectData = {
    projectName: 'Airport Road Work Zone',
    siteLocation: 'Airport Road, North Carolina',
    speedLimit: 35,
    workZoneLength: 1500,
    
    // Additional project details based on your map
    contractNumber: 'FDOT-2024-AR-001',
    contractor: 'Road Construction LLC',
    engineerName: 'Jane Smith, P.E.',
    workDescription: 'Roadway Maintenance and Traffic Control',
    estimatedDuration: '45 days',
    workHours: '7:00 AM - 6:00 PM',
    weekendWork: false,
    laneClosureType: 'Rolling Lane Closure',
    trafficControlMethod: 'Flagger and Signal Control',
    
    // Certificate information
    certificateNumber: '605769',
    instructorName: 'Traffic Control Specialist',
    issueDate: '01/15/2024',
    expirationDate: '01/15/2027',
    
    // Plan information
    fyYear: '2024-25',
    indexNumber: '102-603',
    sheetNumber: '1 of 3',
    lastRevision: '12/15/2024',
    
    // Your satellite image from examples folder
    satelliteImagePath: './examples/sample_plan.png'
  };

  try {
    // Health check
    const health = await generator.healthCheck();
    if (health.status !== 'healthy') {
      console.error('❌ Browser health check failed:', health.error);
      return;
    }
    
    console.log('📊 Project Details:');
    console.log(`   📍 Location: ${projectData.siteLocation}`);
    console.log(`   🚧 Work Zone: ${projectData.workZoneLength} ft`);
    console.log(`   ⚡ Speed Limit: ${projectData.speedLimit} mph`);
    console.log(`   📅 Duration: ${projectData.estimatedDuration}`);
    
    // Generate the complete plan
    const result = await generator.generatePlan(projectData);
    
    console.log('✅ Plan generation complete!');
    console.log('📁 Generated files:');
    console.log('   📋 Page 1 (Traffic Control Plan):', path.basename(result.page1));
    console.log('   📋 Page 2 (General Information):', path.basename(result.page2));
    console.log('   📋 Page 3 (Work Zone Details):', path.basename(result.page3));
    
    console.log('\\n🎯 Your Airport Road Traffic Control Plan is ready!');
    console.log('📂 Check the output/ folder for your PDF files.');
    
    // Close the generator
    await generator.close();
    
  } catch (error) {
    console.error('❌ Error generating plan:', error);
    await generator.close();
  }
}

// Run the example
if (require.main === module) {
  generatePlanWithRealSatelliteImage();
}

module.exports = generatePlanWithRealSatelliteImage;