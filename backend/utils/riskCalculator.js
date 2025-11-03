const Violation = require('../models/Violation');
const Request = require('../models/Request');
const { predictMLRisk } = require('./mlRiskPredictor');

/**
 * Calculate risk score for a student based on violations and request history
 * Now supports optional ML prediction if requestData is provided
 */
async function calculateRiskScore(studentId, requestData = null) {
  try {
    // Get violations
    const violations = await Violation.find({ 
      studentId, 
      status: { $ne: 'dismissed' } 
    });
    
    // Get request history
    const requests = await Request.find({ studentId });
    const lateReturns = requests.filter(r => r.isLateReturn).length;
    const rejectedRequests = requests.filter(r => r.status === 'rejected' || r.status === 'parent_rejected').length;
    
    // Calculate recent requests (last 30 days)
    const recentRequests = requests.filter(r => {
      const daysDiff = (new Date() - new Date(r.createdAt)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    }).length;

    // Prepare student stats for ML
    const studentStats = {
      violations_30d: violations.length,
      late_returns_30d: lateReturns,
      rejection_rate: requests.length > 0 ? rejectedRequests / requests.length : 0,
      requests_30d: recentRequests
    };

    // Try ML prediction if request data provided and ML is enabled
    if (requestData) {
      const mlResult = await predictMLRisk(requestData, studentStats);
      if (mlResult) {
        console.log(`✅ ML Risk: ${mlResult.riskScore} (${mlResult.riskCategory}) - Model: ${mlResult.modelVersion}`);
        return mlResult.riskScore;
      }
    }

    // Fallback to rule-based calculation
    console.log('Using rule-based risk calculation');
    return await calculateRuleBasedRisk(studentId, violations, requests);
    
  } catch (error) {
    console.error('Error calculating risk score:', error);
    return 0;
  }
}

/**
 * Rule-based risk calculation (original logic)
 */
async function calculateRuleBasedRisk(studentId, violations, requests) {
  // Calculate base score from violations
  let riskScore = 0;
  violations.forEach(violation => {
    riskScore += violation.penaltyPoints || 0;
  });

  const totalRequests = requests.length;
  const rejectedRequests = requests.filter(r => r.status === 'rejected' || r.status === 'parent_rejected').length;
  const lateReturns = requests.filter(r => r.isLateReturn).length;

  // Add points for rejection rate
  if (totalRequests > 0) {
    const rejectionRate = rejectedRequests / totalRequests;
    if (rejectionRate > 0.3) {
      riskScore += 20;
    } else if (rejectionRate > 0.2) {
      riskScore += 10;
    }
  }

  // Add points for late returns
  riskScore += lateReturns * 15;

  // Add points for high frequency requests
  const recentRequests = requests.filter(r => {
    const daysDiff = (new Date() - new Date(r.createdAt)) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  }).length;
  
  if (recentRequests > 10) {
    riskScore += 10;
  } else if (recentRequests > 5) {
    riskScore += 5;
  }

  // Ensure score is between 0 and 100
  riskScore = Math.min(Math.max(riskScore, 0), 100);
  return Math.round(riskScore);
}

/**
 * Get risk category based on score
 */
function getRiskCategory(score) {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

module.exports = {
  calculateRiskScore,
  getRiskCategory
};

