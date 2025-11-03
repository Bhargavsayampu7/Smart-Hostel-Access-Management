const express = require('express');
const { body, validationResult } = require('express-validator');
const Violation = require('../models/Violation');
const Request = require('../models/Request');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/violations
// @desc    Create a violation
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), [
  body('studentId').notEmpty(),
  body('type').isIn(['Late Return', 'Unauthorized Extension', 'False Information', 'Unauthorized Location', 'Other']),
  body('description').notEmpty(),
  body('severity').isIn(['low', 'medium', 'high']),
  body('penaltyPoints').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, requestId, type, description, severity, penaltyPoints } = req.body;

    const violation = new Violation({
      studentId,
      requestId,
      type,
      description,
      severity,
      penaltyPoints: penaltyPoints || 0
    });

    await violation.save();

    res.status(201).json({
      message: 'Violation created successfully',
      violation
    });
  } catch (error) {
    console.error('Create violation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/violations
// @desc    Get violations
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
        return res.json({ violations: [] });
      }
    }
    // Admin can see all violations

    const violations = await Violation.find(query)
      .populate('studentId', 'personalInfo')
      .populate('requestId')
      .sort({ violationDate: -1 });

    res.json({ violations });
  } catch (error) {
    console.error('Get violations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/violations/:id/resolve
// @desc    Resolve a violation
// @access  Private (Admin)
router.put('/:id/resolve', auth, authorize('admin'), [
  body('status').isIn(['resolved', 'dismissed']),
  body('adminNotes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, adminNotes } = req.body;
    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).json({ message: 'Violation not found' });
    }

    violation.status = status;
    violation.adminNotes = adminNotes;
    violation.resolvedAt = new Date();
    violation.actionTaken = true;

    await violation.save();

    res.json({
      message: 'Violation resolved',
      violation
    });
  } catch (error) {
    console.error('Resolve violation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

