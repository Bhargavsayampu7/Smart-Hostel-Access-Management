const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['student', 'parent', 'admin']),
  body('userId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, userId, ...userData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { userId }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      email,
      password,
      role,
      userId,
      ...userData
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        ...(role === 'student' && {
          personalInfo: user.personalInfo,
          academicInfo: user.academicInfo,
          hostelInfo: user.hostelInfo
        }),
        ...(role === 'parent' && {
          name: user.name,
          phone: user.phone,
          studentId: user.studentId
        }),
        ...(role === 'admin' && {
          name: user.name,
          adminRole: user.adminRole
        })
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        ...(user.role === 'student' && {
          personalInfo: user.personalInfo,
          academicInfo: user.academicInfo,
          hostelInfo: user.hostelInfo,
          parentDetails: user.parentDetails,
          addressInfo: user.addressInfo
        }),
        ...(user.role === 'parent' && {
          name: user.name,
          phone: user.phone,
          studentId: user.studentId
        }),
        ...(user.role === 'admin' && {
          name: user.name,
          adminRole: user.adminRole
        })
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Check if it's a MongoDB connection error
    if (error.name === 'MongooseError' && error.message.includes('buffering')) {
      return res.status(503).json({ 
        message: 'Database connection failed. Please ensure MongoDB is running.',
        error: 'DATABASE_CONNECTION_ERROR'
      });
    }
    
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        ...(user.role === 'student' && {
          personalInfo: user.personalInfo,
          academicInfo: user.academicInfo,
          hostelInfo: user.hostelInfo,
          parentDetails: user.parentDetails,
          addressInfo: user.addressInfo
        }),
        ...(user.role === 'parent' && {
          name: user.name,
          phone: user.phone,
          studentId: user.studentId
        }),
        ...(user.role === 'admin' && {
          name: user.name,
          adminRole: user.adminRole
        })
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

