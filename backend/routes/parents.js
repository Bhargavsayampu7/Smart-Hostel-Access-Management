const express = require('express');
const Request = require('../models/Request');
const User = require('../models/User');
const Violation = require('../models/Violation');
const { auth, authorize } = require('../middleware/auth');
const { calculateRiskScore } = require('../utils/riskCalculator');

const router = express.Router();

// @route   GET /api/parents/dashboard
// @desc    Get parent dashboard data
// @access  Private (Parent)
router.get('/dashboard', auth, authorize('parent'), async (req, res) => {
  try {
    const student = await User.findById(req.user.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const requests = await Request.find({ studentId: student._id });
    const pendingRequests = requests.filter(r => r.status === 'pending_parent');
    const approvedThisMonth = requests.filter(r => {
      if (!r.parentApprovedAt) return false;
      const approvedDate = new Date(r.parentApprovedAt);
      const now = new Date();
      return approvedDate.getMonth() === now.getMonth() && 
             approvedDate.getFullYear() === now.getFullYear();
    });

    const riskScore = await calculateRiskScore(student._id);
    const violations = await Violation.find({ studentId: student._id });

    res.json({
      pendingCount: pendingRequests.length,
      approvedCount: approvedThisMonth.length,
      childRisk: riskScore,
      childViolations: violations.length,
      student: {
        id: student._id,
        personalInfo: student.personalInfo
      }
    });
  } catch (error) {
    console.error('Get parent dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/parents/pending-approvals
// @desc    Get pending approvals
// @access  Private (Parent)
router.get('/pending-approvals', auth, authorize('parent'), async (req, res) => {
  try {
    const student = await User.findById(req.user.studentId);
    if (!student) {
      return res.json({ requests: [] });
    }

    const requests = await Request.find({
      studentId: student._id,
      status: 'pending_parent'
    })
    .populate('studentId', 'personalInfo academicInfo hostelInfo')
    .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/parents/activity
// @desc    Get student activity
// @access  Private (Parent)
router.get('/activity', auth, authorize('parent'), async (req, res) => {
  try {
    const student = await User.findById(req.user.studentId);
    if (!student) {
      return res.json({ requests: [] });
    }

    const requests = await Request.find({ studentId: student._id })
      .populate('studentId', 'personalInfo')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

