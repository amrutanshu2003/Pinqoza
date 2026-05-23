const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AdminUser = require('./models/admin/AdminUser');

dotenv.config();

const seedAdminDB = async () => {
  try {
    // Connect to admin database (separate database)
    const adminMongoURI = process.env.ADMIN_MONGO_URI || 'mongodb+srv://Hackerbase:Amru2003@e-commerce.gqnqlb8.mongodb.net/adminpanel?appName=AdminPanel';
    await mongoose.connect(adminMongoURI);
    console.log('Admin Database Connected... (adminpanel)');

    // Check if admin exists
    const adminExists = await AdminUser.findOne({ email: 'admin@pinqoza.com' });
    
    if (adminExists) {
      console.log('Admin already exists in admin database!');
      // Make sure isActive is true
      if (!adminExists.isActive) {
        adminExists.isActive = true;
        await adminExists.save();
        console.log('Admin account activated!');
      }
    } else {
      // Create admin user
      const admin = await AdminUser.create({
        name: 'Super Admin',
        email: 'admin@pinqoza.com',
        password: 'admin123',
        role: 'superadmin'
      });
      console.log('Admin user created in separate admin database!');
    }

    console.log('Done!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedAdminDB();
