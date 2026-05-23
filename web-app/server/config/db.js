const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use test database (default) where all collections exist
    const mongoURI = 'mongodb+srv://Hackerbase:Amru2003@e-commerce.gqnqlb8.mongodb.net/?retryWrites=true&w=majority&appName=E-commerce';
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
