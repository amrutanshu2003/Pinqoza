const mongoose = require('mongoose');

const connectAdminDB = async () => {
  try {
    // Just connect once using mongoose.connect - it handles multiple connections
    const adminMongoURI = process.env.ADMIN_MONGO_URI || process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI;
    if (!adminMongoURI) {
      throw new Error('ADMIN_MONGO_URI or ADMIN_MONGODB_URI is not set');
    }
    
    // Check if already connected
    if (mongoose.connection.readyState !== 0) {
      // Already connected to main DB, create a new connection
      const adminConn = mongoose.createConnection(adminMongoURI);
      await adminConn.asPromise();
      console.log(`Admin Database Connected: ${adminConn.host}`);
      return adminConn;
    }
    
    // First connection
    const conn = await mongoose.connect(adminMongoURI);
    console.log(`Admin Database Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Admin DB Error: ${error.message}`);
    // Continue with main connection as fallback
    return mongoose.connection;
  }
};

module.exports = connectAdminDB;
