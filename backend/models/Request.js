const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['outpass', 'homepass', 'emergency'],
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  departureTime: {
    type: Date,
    required: true
  },
  returnTime: {
    type: Date,
    required: true
  },
  emergencyContact: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending_parent', 'parent_approved', 'parent_rejected', 'approved', 'rejected', 'expired'],
    default: 'pending_parent'
  },
  parentApproval: {
    type: Boolean,
    default: false
  },
  adminApproval: {
    type: Boolean,
    default: false
  },
  parentApprovedAt: Date,
  parentRejectedAt: Date,
  adminApprovedAt: Date,
  parentComments: String,
  adminComments: String,
  riskScore: {
    type: Number,
    default: 0
  },
  riskCategory: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  qrCode: String,
  qrGeneratedAt: Date,
  qrExpiresAt: Date,
  actualReturnTime: Date,
  isLateReturn: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
requestSchema.index({ studentId: 1, createdAt: -1 });
requestSchema.index({ status: 1 });
requestSchema.index({ parentApproval: 1, adminApproval: 1 });

module.exports = mongoose.model('Request', requestSchema);

