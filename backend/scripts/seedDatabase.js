const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Request = require('../models/Request');
const Violation = require('../models/Violation');

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel-access-control', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Request.deleteMany({});
    await Violation.deleteMany({});

    console.log('Cleared existing data');

    // Create Student
    const student = new User({
      userId: 'bhargav_teja',
      email: 'bhargav.teja@college.edu',
      password: 'password123', // Will be hashed automatically
      role: 'student',
      personalInfo: {
        fullName: 'Bhargav Teja',
        rollNumber: '22071a67b7',
        phone: '+91-9876543210',
        dateOfBirth: '2003-05-15',
        bloodGroup: 'O+',
        profileImage: 'https://via.placeholder.com/150x150/4F46E5/white?text=BT'
      },
      academicInfo: {
        branch: 'Computer Science Engineering',
        semester: 8,
        batch: '2022-2026',
        section: 'B',
        academicYear: '2025-26'
      },
      hostelInfo: {
        hostelName: 'Block A',
        roomNumber: 'A-101',
        hostelAddress: 'Hostel A, College Campus, Electronic City, Bangalore - 560100',
        hostelPhone: '+91-80-12345678'
      },
      parentDetails: {
        fatherName: 'Mr. Ravi',
        fatherPhone: '+91-9876543200',
        fatherEmail: 'ravi@gmail.com',
        emergencyContactPhone: '+91-9876543202'
      },
      addressInfo: {
        permanentAddress: 'Pragathi Nagar, Hyderabad, Telangana - 500090',
        city: 'Hyderabad',
        state: 'Telangana',
        pinCode: '500090',
        localGuardianPhone: '+91-9876543203'
      },
      status: 'active'
    });
    await student.save();
    console.log('Created student:', student.userId);

    // Create Parent
    const parent = new User({
      userId: 'parent_ravi',
      email: 'ravi@gmail.com',
      password: 'password123',
      role: 'parent',
      name: 'Mr. Ravi',
      phone: '+91-9876543200',
      studentId: student._id,
      relationship: 'Father',
      status: 'active'
    });
    await parent.save();
    console.log('Created parent:', parent.userId);

    // Create Admin
    const admin = new User({
      userId: 'admin_venkat',
      email: 'venkat.rao@college.edu',
      password: 'password123',
      role: 'admin',
      name: 'Mr. Venkat Rao',
      phone: '+91-9876543300',
      adminRole: 'Chief Warden',
      experienceYears: 10,
      status: 'active'
    });
    await admin.save();
    console.log('Created admin:', admin.userId);

    // Create Violation
    const violation = new Violation({
      studentId: student._id,
      type: 'Late Return',
      description: 'Returned 2 hours late from City Mall visit',
      severity: 'medium',
      penaltyPoints: 25,
      violationDate: '2025-08-15T22:30:00',
      status: 'unresolved'
    });
    await violation.save();
    console.log('Created violation');

    // Create Requests
    const request1 = new Request({
      studentId: student._id,
      type: 'outpass',
      destination: 'Nexus Mall, Hyderabad',
      reason: 'Shopping for semester break essentials',
      departureTime: '2025-09-11T14:00:00',
      returnTime: '2025-09-11T20:00:00',
      emergencyContact: '+91-9876543200',
      status: 'approved',
      parentApproval: true,
      adminApproval: true,
      parentApprovedAt: '2025-09-10T11:15:00',
      adminApprovedAt: '2025-09-10T12:30:00',
      parentComments: 'Approved, please return on time.',
      adminComments: 'Approved after verification.',
      riskScore: 35,
      qrCode: 'QR789ABCD123456',
      qrGeneratedAt: '2025-09-10T12:31:00',
      qrExpiresAt: '2025-09-11T21:00:00'
    });
    await request1.save();

    const request2 = new Request({
      studentId: student._id,
      type: 'homepass',
      destination: 'Home - Guntur',
      reason: 'Family function - cousin\'s wedding',
      departureTime: '2025-09-13T10:00:00',
      returnTime: '2025-09-15T18:00:00',
      emergencyContact: '+91-9876543200',
      status: 'parent_approved',
      parentApproval: true,
      adminApproval: false,
      parentApprovedAt: '2025-09-10T16:45:00',
      parentComments: 'Family function is important. Approved for 2 days.',
      riskScore: 35
    });
    await request2.save();

    const request3 = new Request({
      studentId: student._id,
      type: 'outpass',
      destination: 'City Library',
      reason: 'Research work for project',
      departureTime: '2025-09-12T09:00:00',
      returnTime: '2025-09-12T17:00:00',
      emergencyContact: '+91-9876543200',
      status: 'parent_rejected',
      parentApproval: false,
      adminApproval: null,
      parentRejectedAt: '2025-09-11T10:30:00',
      parentComments: 'Too many outings this week. Please focus on studies.',
      riskScore: 35
    });
    await request3.save();

    console.log('Created 3 requests');

    console.log('\nDatabase seeded successfully!');
    console.log('\nTest credentials:');
    console.log('Student: bhargav.teja@college.edu / password123');
    console.log('Parent: ravi@gmail.com / password123');
    console.log('Admin: venkat.rao@college.edu / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

