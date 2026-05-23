const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://Hackerbase:Amru2003@e-commerce.gqnqlb8.mongodb.net/?appName=E-commerce');
    console.log('MongoDB Connected...');

    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@pinqoza.com' });
    
    if (adminExists) {
      console.log('Admin already exists!');
      // Make sure isAdmin is true
      if (!adminExists.isAdmin) {
        adminExists.isAdmin = true;
        await adminExists.save();
        console.log('Admin role enabled!');
      }
    } else {
      // Create admin user
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@pinqoza.com',
        password: 'admin123',
        phone: '9999999999',
        isAdmin: true
      });
      console.log('Admin user created!');
    }

    console.log('Done!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
