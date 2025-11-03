const axios = require('axios');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';
const USE_ML = process.env.USE_ML_PREDICTION === 'true';

/**
 * Predict risk using ML model (calls Python service)
 * @param {Object} requestData - Request data
 * @param {Object} studentStats - Student statistics
 * @returns {Promise<Object|null>} ML prediction or null if not available
 */
async function predictMLRisk(requestData, studentStats) {
  if (!USE_ML) {
    console.log('ML prediction disabled, using rule-based calculation');
    return null;
  }

  try {
    // Prepare features matching the trained model
    const mlFeatures = {
      // Student demographics
      age: studentStats.age || 20,
      year: studentStats.year || 3,
      gpa: studentStats.gpa || 8.0,
      hostel_block: studentStats.hostelBlock || 'A',
      
      // Violation history
      past_violations_30d: studentStats.violations_30d || 0,
      past_violations_365d: studentStats.violations_365d || 0,
      
      // Request context
      request_time_hour: getRequestTimeHour(requestData.departureTime),
      requested_duration_hours: getDurationHours(requestData.departureTime, requestData.returnTime),
      actual_return_delay_minutes: 0, // Will be 0 for new requests
      destination_risk: mapDestination(requestData.destination),
      
      // Parent/guardian info
      parent_contact_reliable: studentStats.parentContactReliable || 1,
      parent_response_time_minutes: studentStats.parentResponseTime || 60,
      parent_action: 1, // Will be predicted
      
      // Request flags
      emergency_flag: requestData.type === 'emergency' ? 1 : 0,
      group_request: 0, // Not tracked in current system
      weekend_request: isWeekend(requestData.departureTime) ? 1 : 0,
      previous_no_show: studentStats.previousNoShow || 0,
      
      // Frequency
      requests_last_7days: studentStats.requests_last_7d || 0
    };

    const response = await axios.post(`${ML_API_URL}/predict`, mlFeatures, {
      timeout: 3000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      riskScore: response.data.risk_score,
      riskCategory: response.data.risk_category,
      riskProbability: response.data.risk_probability,
      modelVersion: response.data.model_version,
      modelType: response.data.model_type,
      topFeatures: response.data.top_features,
      source: 'ml'
    };
  } catch (error) {
    console.error('ML prediction error:', error.message);
    // Silently fall back to rule-based if ML fails
    return null;
  }
}

function getRequestTimeHour(datetimeStr) {
  if (!datetimeStr) return 12;
  const date = new Date(datetimeStr);
  return date.getHours();
}

function getDurationHours(departure, returnTime) {
  const start = new Date(departure);
  const end = new Date(returnTime);
  return (end - start) / (1000 * 60 * 60);
}

function isWeekend(datetimeStr) {
  if (!datetimeStr) return false;
  const date = new Date(datetimeStr);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

function mapDestination(destination) {
  // Map destination to risk level
  const riskMap = {
    'Home Town': 'low',
    'Nexus Mall': 'medium',
    'Tank Bund': 'medium',
    'Movie': 'low',
    'Hospital': 'low',
    'Railway Station': 'medium',
    'Airport': 'low',
    "Friend's Place": 'high',
    'Other': 'medium'
  };
  return riskMap[destination] || 'medium';
}

module.exports = { predictMLRisk };