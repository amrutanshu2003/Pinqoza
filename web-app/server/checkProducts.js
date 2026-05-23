const mongoose = require('mongoose');
const Product = require('./models/Product');

async function checkProducts() {
  try {
    // Connect to database using same config as server
    const mongoURI = 'mongodb+srv://Hackerbase:Amru2003@e-commerce.gqnqlb8.mongodb.net/?retryWrites=true&w=majority&appName=E-commerce';
    
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    const count = await Product.countDocuments();
    console.log('Total products in database:', count);
    
    if (count > 0) {
      const products = await Product.find({});
      console.log('Products found:');
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (ID: ${product._id})`);
      });
    } else {
      console.log('No products found in database');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkProducts();
