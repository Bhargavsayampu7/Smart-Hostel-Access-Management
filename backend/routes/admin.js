const express = require('express');
const Request = require('../models/Request');
const User = require('../models/User');
const Violation = require('../models/Violation');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/overview
// @desc    Get admin overview statistics
// @access  Private (Admin)
router.get('/overview', auth, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total requests this month
    const totalRequests = await Request.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Approved requests this month
    const approvedRequests = await Request.countDocuments({
      status: 'approved',
      createdAt: { $gte: startOfMonth }
    });

    const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

    // Active outpasses
    const activeOutpasses = await Request.countDocuments({
      status: 'approved',
      qrCode: { $exists: true },
      qrExpiresAt: { $gte: now }
    });

    // Late returns
    const lateReturns = await Request.countDocuments({
      isLateReturn: true,
      actualReturnTime: { $gte: startOfMonth }
    });

    // Violation alerts
    const violationAlerts = await Violation.find({
      status: { $in: ['unresolved', 'under_review'] }
    })
    .populate('studentId', 'personalInfo hostelInfo')
    .sort({ violationDate: -1 })
    .limit(10);

    res.json({
      totalRequests,
      totalRequestsGrowth: '+12%', // This could be calculated from previous month
      approvalRate: Math.round(approvalRate * 10) / 10,
      approvalRateChange: '-2%', // This could be calculated
      activeOutpasses,
      lateReturns,
      violationAlerts: violationAlerts.map(v => ({
        id: v._id,
        studentId: v.studentId._id,
        studentName: v.studentId.personalInfo?.fullName || 'Unknown',
        violationType: v.type,
        violationDate: v.violationDate,
        severity: v.severity,
        status: v.status,
        hostel: v.studentId.hostelInfo?.hostelName || 'Unknown',
        room: v.studentId.hostelInfo?.roomNumber || 'Unknown'
      }))
    });
  } catch (error) {
    console.error('Get admin overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/queue
// @desc    Get approval queue (parent-approved requests)
// @access  Private (Admin)
router.get('/queue', auth, authorize('admin'), async (req, res) => {
  try {
    const requests = await Request.find({
      status: 'parent_approved',
      parentApproval: true
    })
    .populate('studentId', 'personalInfo academicInfo hostelInfo parentDetails')
    .sort({ parentApprovedAt: -1 });

    // Calculate risk scores for each student
    const requestsWithRisk = await Promise.all(requests.map(async (req) => {
      const { calculateRiskScore } = require('../utils/riskCalculator');
      const riskScore = await calculateRiskScore(req.studentId._id);
      const violations = await Violation.countDocuments({ studentId: req.studentId._id });
      
      return {
        ...req.toObject(),
        studentRiskScore: riskScore,
        studentViolations: violations
      };
    }));

    res.json({ requests: requestsWithRisk });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/students
// @desc    Get all students
// @access  Private (Admin)
router.get('/students', auth, authorize('admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('personalInfo academicInfo hostelInfo')
      .sort({ 'personalInfo.fullName': 1 });

    // Add risk scores and stats
    const studentsWithStats = await Promise.all(students.map(async (student) => {
      const { calculateRiskScore } = require('../utils/riskCalculator');
      const riskScore = await calculateRiskScore(student._id);
      const requests = await Request.countDocuments({ studentId: student._id });
      const violations = await Violation.countDocuments({ studentId: student._id });

      return {
        id: student._id,
        ...student.toObject(),
        riskScore,
        totalRequests: requests,
        totalViolations: violations
      };
    }));

    res.json({ students: studentsWithStats });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/reports
// @desc    Get reports and analytics
// @access  Private (Admin)
router.get('/reports', auth, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Weekly stats
    const weeklyRequests = await Request.find({
      createdAt: { $gte: startOfWeek }
    });
    const weeklyApproved = weeklyRequests.filter(r => r.status === 'approved').length;
    const weeklyPending = weeklyRequests.filter(r => r.status === 'pending_parent' || r.status === 'parent_approved').length;
    const weeklyRejected = weeklyRequests.filter(r => r.status === 'rejected' || r.status === 'parent_rejected').length;

    // Risk distribution
    const allStudents = await User.find({ role: 'student' });
    const { calculateRiskScore } = require('../utils/riskCalculator');
    
    const riskScores = await Promise.all(
      allStudents.map(s => calculateRiskScore(s._id))
    );
    
    const lowRisk = riskScores.filter(s => s <= 30).length;
    const mediumRisk = riskScores.filter(s => s > 30 && s <= 60).length;
    const highRisk = riskScores.filter(s => s > 60).length;
    const total = riskScores.length;

    // Violation trends
    const violations = await Violation.find({
      violationDate: { $gte: startOfMonth }
    });
    
    const lateReturns = violations.filter(v => v.type === 'Late Return').length;
    const unauthorizedExtensions = violations.filter(v => v.type === 'Unauthorized Extension').length;
    const falseInformation = violations.filter(v => v.type === 'False Information').length;

    res.json({
      weeklyStats: {
        totalRequests: weeklyRequests.length,
        approved: weeklyApproved,
        approvalRate: weeklyRequests.length > 0 ? Math.round((weeklyApproved / weeklyRequests.length) * 100) : 0,
        pending: weeklyPending,
        rejected: weeklyRejected
      },
      riskDistribution: {
        low: total > 0 ? Math.round((lowRisk / total) * 100) : 0,
        medium: total > 0 ? Math.round((mediumRisk / total) * 100) : 0,
        high: total > 0 ? Math.round((highRisk / total) * 100) : 0,
        highRiskIncrease: 15 // This could be calculated from previous month
      },
      violationTrends: {
        lateReturns,
        unauthorizedExtensions,
        falseInformation,
        overallChange: -20 // This could be calculated
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

