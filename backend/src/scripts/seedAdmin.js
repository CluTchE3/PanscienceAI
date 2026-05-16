const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager');
    console.log('Connected to MongoDB');

    const adminExists = await User.findOne({ username: 'admin_user' });

    if (adminExists) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await User.create({
      username: 'admin_user',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Successfully created initial admin account!');
    console.log('Username: admin_user');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
