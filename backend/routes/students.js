const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Request = require('../models/Request');
const Violation = require('../models/Violation');
const { auth, authorize } = require('../middleware/auth');
const { calculateRiskScore, getRiskCategory } = require('../utils/riskCalculator');

const router = express.Router();

// @route   GET /api/students/profile
// @desc    Get student profile
// @access  Private (Student)
router.get('/profile', auth, authorize('student'), async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select('-password');
    
    // Calculate risk score
    const riskScore = await calculateRiskScore(req.user._id);
    const riskCategory = getRiskCategory(riskScore);
    
    // Get request stats
    const requests = await Request.find({ studentId: req.user._id });
    const activeRequests = requests.filter(r => r.status === 'approved' && r.qrCode).length;
    const violations = await Violation.find({ studentId: req.user._id });
    
    res.json({
      student: {
        ...student.toObject(),
        riskScore,
        riskCategory,
        totalRequests: requests.length,
        activeRequests,
        totalViolations: violations.length,
        violations: violations.map(v => ({
          id: v._id,
          date: v.violationDate,
          type: v.type,
          description: v.description,
          severity: v.severity,
          penaltyPoints: v.penaltyPoints
        }))
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/students/profile
// @desc    Update student profile
// @access  Private (Student)
router.put('/profile', auth, authorize('student'), async (req, res) => {
  try {
    const updateData = req.body;
    const student = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: {
          personalInfo: updateData.personalInfo,
          academicInfo: updateData.academicInfo,
          hostelInfo: updateData.hostelInfo,
          parentDetails: updateData.parentDetails,
          addressInfo: updateData.addressInfo
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', student });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/stats
// @desc    Get student statistics
// @access  Private (Student)
router.get('/stats', auth, authorize('student'), async (req, res) => {
  try {
    const requests = await Request.find({ studentId: req.user._id });
    const activeRequests = requests.filter(r => r.status === 'approved' && r.qrCode).length;
    const violations = await Violation.find({ studentId: req.user._id });
    const riskScore = await calculateRiskScore(req.user._id);

    res.json({
      totalRequests: requests.length,
      activeRequests,
      violations: violations.length,
      riskScore
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

