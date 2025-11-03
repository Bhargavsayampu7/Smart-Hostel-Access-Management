const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'parent', 'admin'],
    required: true
  },
  // Student-specific fields
  personalInfo: {
    fullName: String,
    rollNumber: String,
    phone: String,
    dateOfBirth: Date,
    bloodGroup: String,
    profileImage: String
  },
  academicInfo: {
    branch: String,
    semester: Number,
    batch: String,
    section: String,
    academicYear: String
  },
  hostelInfo: {
    hostelName: String,
    roomNumber: String,
    hostelAddress: String,
    hostelPhone: String
  },
  parentDetails: {
    fatherName: String,
    fatherPhone: String,
    fatherEmail: String,
    motherName: String,
    motherPhone: String,
    motherEmail: String,
    emergencyContactName: String,
    emergencyContactPhone: String
  },
  addressInfo: {
    permanentAddress: String,
    city: String,
    state: String,
    pinCode: String,
    localGuardianName: String,
    localGuardianPhone: String,
    localGuardianAddress: String
  },
  // Parent-specific fields
  name: String,
  phone: String,
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relationship: String,
  // Admin-specific fields
  adminRole: String,
  experienceYears: Number,
  // Common fields
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

