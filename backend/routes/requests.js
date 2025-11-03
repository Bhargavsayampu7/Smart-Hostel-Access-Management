const express = require('express');
const { body, validationResult } = require('express-validator');
const Request = require('../models/Request');
const User = require('../models/User');
const Violation = require('../models/Violation');
const { auth, authorize } = require('../middleware/auth');
const { calculateRiskScore, getRiskCategory } = require('../utils/riskCalculator');
const { generateQRCode } = require('../utils/qrGenerator');

const router = express.Router();

// @route   POST /api/requests
// @desc    Create a new request
// @access  Private (Student)
router.post('/', auth, authorize('student'), [
  body('type').isIn(['outpass', 'homepass', 'emergency']),
  body('destination').notEmpty(),
  body('reason').notEmpty(),
  body('departureTime').isISO8601(),
  body('returnTime').isISO8601(),
  body('emergencyContact').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, destination, reason, departureTime, returnTime, emergencyContact } = req.body;

    // Validate dates
    const depTime = new Date(departureTime);
    const retTime = new Date(returnTime);
    const now = new Date();

    if (depTime <= new Date(now.getTime() + 30 * 60000)) {
      return res.status(400).json({ message: 'Departure time must be at least 30 minutes from now' });
    }

    if (retTime <= depTime) {
      return res.status(400).json({ message: 'Return time must be after departure time' });
    }

    // Calculate risk score (pass request context to enable ML when configured)
    const riskScore = await calculateRiskScore(req.user._id, {
      type,
      destination,
      departureTime: depTime,
      returnTime: retTime
    });
    const riskCategory = getRiskCategory(riskScore);

    // Create request
    const request = new Request({
      studentId: req.user._id,
      type,
      destination,
      reason,
      departureTime: depTime,
      returnTime: retTime,
      emergencyContact,
      riskScore,
      riskCategory,
      status: 'pending_parent'
    });

    await request.save();

    res.status(201).json({
      message: 'Request created successfully',
      request
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/requests
// @desc    Get all requests for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query.studentId = req.user._id;
    } else if (req.user.role === 'parent') {
      const student = await User.findById(req.user.studentId);
      if (student) {
        query.studentId = student._id;
      } else {
        return res.json({ requests: [] });
      }
    }
    // Admin can see all requests

    const requests = await Request.find(query)
      .populate('studentId', 'personalInfo academicInfo hostelInfo')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/requests/:id
// @desc    Get a single request
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('studentId', 'personalInfo academicInfo hostelInfo parentDetails');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check access permissions
    if (req.user.role === 'student' && request.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'parent') {
      const student = await User.findById(req.user.studentId);
      if (!student || request.studentId._id.toString() !== student._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ request });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/requests/:id/parent-approve
// @desc    Parent approve/reject request
// @access  Private (Parent)
router.put('/:id/parent-approve', auth, authorize('parent'), [
  body('approved').isBoolean(),
  body('comments').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { approved, comments } = req.body;
    const request = await Request.findById(req.params.id)
      .populate('studentId');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify parent has access to this student
    const student = await User.findById(req.user.studentId);
    if (!student || request.studentId._id.toString() !== student._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (request.status !== 'pending_parent') {
      return res.status(400).json({ message: 'Request is not pending parent approval' });
    }

    request.parentApproval = approved;
    request.parentComments = comments || '';

    if (approved) {
      request.status = 'parent_approved';
      request.parentApprovedAt = new Date();
    } else {
      request.status = 'parent_rejected';
      request.parentRejectedAt = new Date();
    }

    await request.save();

    res.json({
      message: approved ? 'Request approved by parent' : 'Request rejected by parent',
      request
    });
  } catch (error) {
    console.error('Parent approval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/requests/:id/admin-approve
// @desc    Admin approve/reject request
// @access  Private (Admin)
router.put('/:id/admin-approve', auth, authorize('admin'), [
  body('approved').isBoolean(),
  body('comments').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { approved, comments } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'parent_approved') {
      return res.status(400).json({ message: 'Request must be parent-approved first' });
    }

    request.adminApproval = approved;
    request.adminComments = comments || '';

    if (approved) {
      request.status = 'approved';
      request.adminApprovedAt = new Date();
      
      // Generate QR code
      const qrData = await generateQRCode(request._id, request.studentId, request);
      request.qrCode = qrData.qrCodeId;
      request.qrGeneratedAt = new Date();
      request.qrExpiresAt = request.returnTime;
    } else {
      request.status = 'rejected';
    }

    await request.save();

    res.json({
      message: approved ? 'Request approved by admin' : 'Request rejected by admin',
      request
    });
  } catch (error) {
    console.error('Admin approval error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/requests/:id/qr
// @desc    Get QR code for approved request
// @access  Private (Student)
router.get('/:id/qr', auth, authorize('student'), async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (request.status !== 'approved' || !request.qrCode) {
      return res.status(400).json({ message: 'Request is not approved or QR code not generated' });
    }

    res.json({
      qrCode: request.qrCode,
      qrGeneratedAt: request.qrGeneratedAt,
      qrExpiresAt: request.qrExpiresAt,
      request: {
        type: request.type,
        destination: request.destination,
        departureTime: request.departureTime,
        returnTime: request.returnTime
      }
    });
  } catch (error) {
    console.error('Get QR error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

