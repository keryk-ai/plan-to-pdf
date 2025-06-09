const config = require('./config.json');
const moment = require('moment');

class FDOTDataValidator {
  constructor() {
    this.config = config;
  }

  /**
   * Validate project data against FDOT requirements
   * @param {Object} data - Project data to validate
   * @returns {Object} - Validation result with errors array
   */
  validateProjectData(data) {
    const errors = [];
    const warnings = [];

    // Check required fields
    for (const field of this.config.validation.required_fields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate speed limit
    if (data.speedLimit) {
      const [minSpeed, maxSpeed] = this.config.validation.speed_limit_range;
      if (data.speedLimit < minSpeed || data.speedLimit > maxSpeed) {
        errors.push(`Speed limit must be between ${minSpeed} and ${maxSpeed} mph`);
      }
    }

    // Validate work zone length
    if (data.workZoneLength) {
      const [minLength, maxLength] = this.config.validation.work_zone_length_range;
      if (data.workZoneLength < minLength || data.workZoneLength > maxLength) {
        errors.push(`Work zone length must be between ${minLength} and ${maxLength} feet`);
      }
    }

    // Validate dates
    if (data.issueDate && data.expirationDate) {
      const issueDate = moment(data.issueDate, 'MM/DD/YYYY');
      const expirationDate = moment(data.expirationDate, 'MM/DD/YYYY');
      
      if (expirationDate.isBefore(issueDate)) {
        errors.push('Expiration date must be after issue date');
      }
      
      if (expirationDate.isBefore(moment())) {
        warnings.push('Certificate appears to be expired');
      }
    }

    // Validate index number format
    if (data.indexNumber && !this.isValidIndexNumber(data.indexNumber)) {
      errors.push('Index number must be in format XXX-XXX (e.g., 102-603)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if index number is valid FDOT format
   * @param {string} indexNumber 
   * @returns {boolean}
   */
  isValidIndexNumber(indexNumber) {
    return /^\d{3}-\d{3}$/.test(indexNumber);
  }

  /**
   * Get spacing values for given speed limit
   * @param {number} speedLimit 
   * @returns {Object}
   */
  getSpacingValues(speedLimit) {
    const speedStr = speedLimit.toString();
    return {
      deviceSpacing: this.config.deviceSpacing[speedStr] || null,
      taperLength: this.config.taperLengths[speedStr] || null,
      bufferLength: this.config.bufferLengths[speedStr] || null
    };
  }

  /**
   * Merge project data with default values
   * @param {Object} data 
   * @returns {Object}
   */
  mergeWithDefaults(data) {
    return {
      ...this.config.defaultValues,
      ...data,
      // Always use current date for timestamp
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      currentDate: moment().format('MM/DD/YY')
    };
  }
}

class FDOTCalculator {
  constructor() {
    this.config = config;
  }

  /**
   * Calculate all spacing requirements for a work zone
   * @param {number} speedLimit 
   * @param {string} roadType 
   * @returns {Object}
   */
  calculateSpacingRequirements(speedLimit, roadType = 'arterial') {
    const speedStr = speedLimit.toString();
    
    return {
      coneSpacing: this.config.deviceSpacing[speedStr]?.cones || 40,
      barricadeSpacing: this.config.deviceSpacing[speedStr]?.barricades || 75,
      taperLength: this.config.taperLengths[speedStr] || 250,
      bufferLength: this.config.bufferLengths[speedStr] || 250,
      signSpacing: this.getSignSpacing(speedLimit, roadType)
    };
  }

  /**
   * Get sign spacing based on road type and speed
   * @param {number} speedLimit 
   * @param {string} roadType 
   * @returns {number}
   */
  getSignSpacing(speedLimit, roadType) {
    if (roadType === 'limited_access' || roadType === 'interstate') {
      return this.config.signSpacing.limited_access;
    }
    
    if (speedLimit >= 45) {
      return this.config.signSpacing.arterial_45;
    }
    
    return this.config.signSpacing.arterial_40;
  }

  /**
   * Calculate minimum advance warning distances
   * @param {number} speedLimit 
   * @returns {Object}
   */
  calculateAdvanceWarningDistances(speedLimit) {
    // Based on MUTCD Table 6C-1
    const distances = {
      25: { urban: 100, rural: 100 },
      30: { urban: 100, rural: 200 },
      35: { urban: 200, rural: 350 },
      40: { urban: 200, rural: 500 },
      45: { urban: 300, rural: 700 },
      50: { urban: 350, rural: 850 },
      55: { urban: 400, rural: 1000 },
      60: { urban: 450, rural: 1200 },
      65: { urban: 500, rural: 1400 },
      70: { urban: 550, rural: 1600 }
    };

    return distances[speedLimit] || { urban: 200, rural: 500 };
  }

  /**
   * Determine if rumble strips are required
   * @param {number} speedLimit 
   * @param {number} durationHours 
   * @returns {boolean}
   */
  requiresRumbleStrips(speedLimit, durationHours) {
    return speedLimit >= 55 && durationHours > 1;
  }

  /**
   * Calculate queue storage length needed
   * @param {number} workZoneLength 
   * @param {number} speedLimit 
   * @returns {number}
   */
  calculateQueueLength(workZoneLength, speedLimit) {
    // Rough estimate based on typical traffic volumes and work zone capacity
    const baseQueue = workZoneLength * 0.1; // 10% of work zone length
    const speedFactor = speedLimit / 35; // Normalized to 35 mph baseline
    
    return Math.max(300, baseQueue * speedFactor);
  }
}

class FDOTTemplateHelper {
  constructor() {
    this.config = config;
  }

  /**
   * Get plan type configuration
   * @param {string} indexNumber 
   * @returns {Object}
   */
  getPlanTypeConfig(indexNumber) {
    return this.config.planTypes[indexNumber] || null;
  }

  /**
   * Generate table data for channelizing device spacing
   * @returns {Array}
   */
  generateDeviceSpacingTable() {
    const table = [];
    
    for (const [speed, spacing] of Object.entries(this.config.deviceSpacing)) {
      table.push({
        speed: parseInt(speed),
        barricades: spacing.barricades,
        cones: spacing.cones
      });
    }
    
    return table.sort((a, b) => a.speed - b.speed);
  }

  /**
   * Generate table data for taper lengths
   * @returns {Array}
   */
  generateTaperLengthTable() {
    const table = [];
    
    for (const [speed, length] of Object.entries(this.config.taperLengths)) {
      table.push({
        speed: parseInt(speed),
        length: length
      });
    }
    
    return table.sort((a, b) => a.speed - b.speed);
  }

  /**
   * Generate table data for buffer lengths
   * @returns {Array}
   */
  generateBufferLengthTable() {
    const table = [];
    
    for (const [speed, length] of Object.entries(this.config.bufferLengths)) {
      table.push({
        speed: parseInt(speed),
        length: length
      });
    }
    
    return table.sort((a, b) => a.speed - b.speed);
  }

  /**
   * Get required signs for a work zone type
   * @param {string} workZoneType 
   * @returns {Array}
   */
  getRequiredSigns(workZoneType) {
    const workZone = this.config.workZoneTypes[workZoneType];
    return workZone ? workZone.requiredSigns : [];
  }

  /**
   * Format project data for template consumption
   * @param {Object} data 
   * @returns {Object}
   */
  formatForTemplate(data) {
    const validator = new FDOTDataValidator();
    const calculator = new FDOTCalculator();
    
    // Merge with defaults
    const mergedData = validator.mergeWithDefaults(data);
    
    // Add calculated values
    const spacingReqs = calculator.calculateSpacingRequirements(
      mergedData.speedLimit, 
      mergedData.roadType
    );
    
    const advanceDistances = calculator.calculateAdvanceWarningDistances(
      mergedData.speedLimit
    );
    
    return {
      ...mergedData,
      spacing: spacingReqs,
      advanceWarning: advanceDistances,
      requiresRumbleStrips: calculator.requiresRumbleStrips(
        mergedData.speedLimit, 
        mergedData.estimatedDurationHours || 8
      ),
      queueLength: calculator.calculateQueueLength(
        mergedData.workZoneLength, 
        mergedData.speedLimit
      ),
      deviceSpacingTable: this.generateDeviceSpacingTable(),
      taperLengthTable: this.generateTaperLengthTable(),
      bufferLengthTable: this.generateBufferLengthTable()
    };
  }
}

module.exports = {
  FDOTDataValidator,
  FDOTCalculator,
  FDOTTemplateHelper
};
