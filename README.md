# FDOT Traffic Control Plan Generator

Generate standardized FDOT (Florida Department of Transportation) traffic control plan PDF documents programmatically. This tool creates the technical specification pages that accompany satellite imagery diagrams for traffic control plans.

## Features

- ✅ **Accurate FDOT Formatting**: Matches official FDOT standard plan layouts
- ✅ **Dynamic Data Insertion**: Populate templates with project-specific information
- ✅ **Professional PDF Output**: High-quality PDFs suitable for official use
- ✅ **Template-Based**: Easy to modify and customize for different plan types
- ✅ **Multiple Page Support**: Generates both general information and work zone detail pages

## Generated Pages

- **Page 2**: General Information for Traffic Control Through Work Zones
  - Table of contents
  - Channelizing device spacing tables
  - Taper length specifications
  - Work zone sign spacing
  - Buffer length requirements
  - Symbols and legends

- **Page 3**: Two-Lane, Two-Way Work Within the Travel Way
  - Traffic control diagrams
  - Work zone layout illustrations
  - Rumble strip options
  - Implementation notes
  - Safety requirements

## Installation

### Option 1: Automated Setup (Recommended)

```bash
cd plan-to-pdf
node setup.js
```

This will:
- Run basic tests to verify project structure
- Install all dependencies (including Puppeteer ~300MB download)
- Create necessary directories
- Run full test suite
- Display usage instructions

### Option 2: Manual Setup

1. **Run basic tests first** (no dependencies required):
   ```bash
   npm run test:basic
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   *Note: This will download Puppeteer's Chromium browser (~300MB)*

3. **Verify installation**:
   ```bash
   npm test
   ```

### Troubleshooting Installation

If you encounter issues:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For Puppeteer issues on macOS
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
npm install puppeteer
```

## Quick Start

### Basic Usage

```javascript
const FDOTPlanGenerator = require('./src/index.js');

const generator = new FDOTPlanGenerator();

const projectData = {
  projectName: 'I-75 Resurfacing',
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
  workZoneLength: 1000
};

// Generate the plan
const result = await generator.generatePlan(projectData);

console.log('Generated files:', result);
await generator.close();
```

### Command Line Usage

```bash
# Run the test example
npm start

# Or run the test script directly
node src/test.js
```

## Data Fields

### Required Fields
- `projectName` - Name of the construction project
- `siteLocation` - Project location (e.g., "CARY, NC")
- `speedLimit` - Work zone speed limit
- `workZoneLength` - Length of work zone in feet

### Optional Fields
- `certificateNumber` - FDOT certificate number
- `instructorName` - Traffic control instructor name
- `issueDate` - Certificate issue date
- `expirationDate` - Certificate expiration date
- `fyYear` - Fiscal year (e.g., "2024-25")
- `indexNumber` - FDOT index number (e.g., "102-603")
- `sheetNumber` - Sheet numbering (e.g., "1 of 2")
- `lastRevision` - Last revision date
- `contractNumber` - Construction contract number
- `engineerName` - Project engineer name
- `workDescription` - Description of work being performed
- `estimatedDuration` - Expected project duration
- `contractor` - Contractor company name
- `laneClosureType` - Type of lane closure
- `trafficControlMethod` - Method of traffic control
- `workHours` - Work schedule hours
- `weekendWork` - Boolean for weekend work

## File Structure

```
plan-to-pdf/
├── src/
│   ├── index.js          # Main generator class
│   └── test.js           # Test script and examples
├── templates/
│   ├── page2-general-info.html    # Page 2 template
│   └── page3-work-zone.html       # Page 3 template
├── output/               # Generated PDF files
├── assets/              # Static assets (logos, etc.)
├── package.json         # Node.js dependencies
└── README.md           # This file
```

## Customization

### Modifying Templates

The HTML templates in `templates/` can be modified to:
- Change layout and styling
- Add new data fields
- Modify FDOT-specific formatting
- Add additional pages or sections

Templates use **Handlebars.js** syntax for dynamic content:
```html
<div>Project: {{projectName}}</div>
<div>Speed Limit: {{speedLimit}}</div>
```

### Adding New Page Types

1. Create a new HTML template in `templates/`
2. Add a corresponding generation method to `src/index.js`
3. Update the main `generatePlan()` method to include the new page

### Styling Changes

CSS styles are embedded in the HTML templates. Modify the `<style>` sections to:
- Change fonts and colors
- Adjust table layouts
- Modify spacing and margins
- Update FDOT branding elements

## Integration with Satellite Imagery

This generator is designed to work alongside satellite imagery generation systems:

```javascript
// Example integration workflow
async function generateCompletePlan(projectData, satelliteImagePath) {
  // 1. Generate satellite imagery page (your existing system)
  const page1 = await generateSatelliteImagePage(projectData, satelliteImagePath);
  
  // 2. Generate FDOT standard pages (this system)
  const generator = new FDOTPlanGenerator();
  const standardPages = await generator.generatePlan(projectData);
  
  // 3. Combine all pages into final document
  const completePlan = await combinePDFs([page1, standardPages.page2, standardPages.page3]);
  
  return completePlan;
}
```

## Output Examples

Generated PDFs will include:

- **Professional formatting** matching FDOT standards
- **Dynamic project information** populated from your data
- **Accurate technical specifications** (spacing tables, buffer lengths, etc.)
- **Official symbols and legends**
- **Proper page numbering and headers**

## Dependencies

- **Puppeteer**: PDF generation from HTML
- **Handlebars**: Template engine for dynamic content
- **Moment.js**: Date formatting and manipulation

## Browser Requirements

Puppeteer will automatically download a compatible Chromium browser. No additional setup required.

## Troubleshooting

### Common Issues

1. **PDF generation fails**:
   - Ensure all required data fields are provided
   - Check that templates exist in `templates/` directory
   - Verify sufficient disk space in `output/` directory

2. **Formatting issues**:
   - Review CSS styles in template files
   - Test with different data values
   - Check browser console for errors

3. **Missing dependencies**:
   ```bash
   npm install  # Reinstall dependencies
   ```

### Getting Help

- Review the test script (`src/test.js`) for working examples
- Check the generated HTML (before PDF conversion) for layout issues
- Examine the console output for detailed error messages

## License

MIT License - feel free to modify and use for your projects.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This tool generates the standardized FDOT pages (pages 2-3) that accompany satellite imagery diagrams. You'll need to integrate this with your existing satellite image generation system to create complete traffic control plans.
