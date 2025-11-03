const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  type: {
    type: String,
    enum: ['Late Return', 'Unauthorized Extension', 'False Information', 'Unauthorized Location', 'Other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  penaltyPoints: {
    type: Number,
    default: 0
  },
  violationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['unresolved', 'under_review', 'resolved', 'dismissed'],
    default: 'unresolved'
  },
  actionTaken: {
    type: Boolean,
    default: false
  },
  adminNotes: String,
  resolvedAt: Date
}, {
  timestamps: true
});

// Index for faster queries
violationSchema.index({ studentId: 1, violationDate: -1 });
violationSchema.index({ status: 1 });

module.exports = mongoose.model('Violation', violationSchema);

