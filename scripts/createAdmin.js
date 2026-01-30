import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const email = 'pavanadityakumarg2004@gmail.com';
    const password = 'P@van2004';
    const fullName = 'Admin User';

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('⚠ User already exists. Updating to admin...');
      user.isAdmin = true;
      user.authProvider = 'local';
      user.password = password; // Let the schema hash it
      await user.save();
      console.log('✓ User updated to admin with password');
    } else {
      // Create admin user
      const adminUser = new User({
        fullName,
        email,
        password, // Let the schema hash it
        authProvider: 'local',
        isAdmin: true,
      });

      await adminUser.save();
      console.log('✓ Admin user created successfully');
    }

    console.log(`
    Admin Details:
    Email: ${email}
    Password: ${password}
    Is Admin: true
    
    You can now login at /admin/login
    `);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
