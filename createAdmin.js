/**
 * This script creates an admin user in the database
 * Run with: node create-admin.js
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Hash password function
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user
    const admin = new User({
      username: 'admin',
      password: hashPassword('admin123456'), // Set a strong password
      isAdmin: true
    });
    
    await admin.save();
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

createAdminUser();