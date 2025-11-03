const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const requestRoutes = require('./routes/requests');
const parentRoutes = require('./routes/parents');
const adminRoutes = require('./routes/admin');
const violationRoutes = require('./routes/violations');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel-access-control', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => {
  console.error('MongoDB connection error:', err.message);
  console.log('⚠️  Server will start but database operations will fail.');
  console.log('💡 To fix: Start MongoDB or update MONGODB_URI in .env file');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/violations', violationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

