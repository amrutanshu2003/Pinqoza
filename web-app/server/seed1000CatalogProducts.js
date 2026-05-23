const mongoose = require('mongoose');
const { generateCatalogProducts, upsertProducts } = require('./utils/catalogProducts');

const mongoURI =
  process.env.MONGO_URI ||
  'mongodb+srv://Hackerbase:Amru2003@e-commerce.gqnqlb8.mongodb.net/?retryWrites=true&w=majority&appName=E-commerce';

async function seedCatalog() {
  const count = Math.min(15000, Math.max(1, parseInt(process.argv[2], 10) || 3000));

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log(`Generating ${count} own-catalog products...`);

    const products = generateCatalogProducts(count);
    const result = await upsertProducts(products);

    console.log('Catalog seed completed:', result);
  } catch (error) {
    console.error('Error seeding catalog:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedCatalog();
