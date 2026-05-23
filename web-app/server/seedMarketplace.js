const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const products = [
  // Groceries
  {
    name: 'Basmati Rice 5kg',
    description: 'Premium long-grain basmati rice. Aromatic and fluffy for daily meals.',
    price: 699,
    category: 'groceries',
    stock: 120,
    unit: 'pack',
    image: 'https://images.unsplash.com/photo-1604908554105-088645debe26?w=800&q=80',
    brand: 'Pinqoza',
    isFeatured: true
  },
  {
    name: 'Cold-Pressed Sunflower Oil 1L',
    description: 'Light and healthy cooking oil suitable for everyday cooking.',
    price: 189,
    category: 'groceries',
    stock: 200,
    unit: 'pack',
    image: 'https://images.unsplash.com/photo-1627485937980-7d2c10a4112b?w=800&q=80',
    brand: 'Pinqoza'
  },
  {
    name: 'Assorted Dry Fruits 500g',
    description: 'Almonds, cashews, raisins and more—great for snacking.',
    price: 499,
    category: 'groceries',
    stock: 90,
    unit: 'pack',
    image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&q=80',
    brand: 'Pinqoza'
  },

  // Electronics
  {
    name: 'Wireless Earbuds Pro',
    description: 'Crisp audio, deep bass, and long battery life with charging case.',
    price: 1499,
    category: 'electronics',
    stock: 70,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
    brand: 'Pinqoza',
    isFeatured: true
  },
  {
    name: 'Fast Charger 20W (USB-C)',
    description: 'Compact 20W USB-C fast charger for phones and accessories.',
    price: 599,
    category: 'electronics',
    stock: 160,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330b0b?w=800&q=80',
    brand: 'Pinqoza'
  },
  {
    name: 'Power Bank 10000mAh',
    description: 'Pocket-size power bank with dual output and LED indicator.',
    price: 999,
    category: 'electronics',
    stock: 110,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1609592806854-0f4a90d1a1ea?w=800&q=80',
    brand: 'Pinqoza'
  },

  // Fashion
  {
    name: 'Everyday Cotton T-Shirt',
    description: 'Soft breathable cotton t-shirt—perfect for daily wear.',
    price: 349,
    category: 'fashion',
    stock: 250,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1520975958225-8e8e9f5d3b3e?w=800&q=80',
    brand: 'Pinqoza',
    isFeatured: true
  },
  {
    name: 'Classic Denim Jeans',
    description: 'Comfort fit denim jeans with a clean, timeless look.',
    price: 1299,
    category: 'fashion',
    stock: 80,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
    brand: 'Pinqoza'
  },
  {
    name: 'Lightweight Sneakers',
    description: 'Everyday sneakers with cushioned sole for all-day comfort.',
    price: 1699,
    category: 'fashion',
    stock: 65,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1528701800489-20be3c2ea1ae?w=800&q=80',
    brand: 'Pinqoza'
  },

  // Home & Kitchen
  {
    name: 'Non-Stick Fry Pan 24cm',
    description: 'Durable non-stick pan for healthy cooking with less oil.',
    price: 899,
    category: 'home',
    stock: 90,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1616627983287-2a9c0c64b43a?w=800&q=80',
    brand: 'Pinqoza',
    isFeatured: true
  },
  {
    name: 'Stainless Steel Water Bottle 1L',
    description: 'Leak-proof bottle that keeps drinks cool for longer.',
    price: 499,
    category: 'home',
    stock: 140,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1526401485004-2aa7bbd2f2c2?w=800&q=80',
    brand: 'Pinqoza'
  },
  {
    name: 'Bedsheet Set (Double)',
    description: 'Soft microfiber bedsheet set with 2 pillow covers.',
    price: 799,
    category: 'home',
    stock: 75,
    unit: 'pack',
    image: 'https://images.unsplash.com/photo-1582582621959-48d27397dc7b?w=800&q=80',
    brand: 'Pinqoza'
  },

  // Beauty & Personal Care
  {
    name: 'Vitamin C Face Serum 30ml',
    description: 'Brightening serum for a healthy glow. Suitable for most skin types.',
    price: 499,
    category: 'beauty',
    stock: 130,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1612810436541-336d944e0a2d?w=800&q=80',
    brand: 'Pinqoza',
    isFeatured: true
  },
  {
    name: 'Aloe Vera Gel 100ml',
    description: 'Multi-purpose soothing aloe vera gel for skin and hair.',
    price: 199,
    category: 'beauty',
    stock: 220,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1620916566399-39f1143a6f2e?w=800&q=80',
    brand: 'Pinqoza'
  },
  {
    name: 'Shampoo + Conditioner Combo',
    description: 'Everyday hair care combo for smooth and manageable hair.',
    price: 399,
    category: 'beauty',
    stock: 150,
    unit: 'pack',
    image: 'https://images.unsplash.com/photo-1601612628452-9e99ced43524?w=800&q=80',
    brand: 'Pinqoza'
  },

  // Accessories
  {
    name: 'Minimalist Wallet',
    description: 'Slim wallet with card slots and a neat finish.',
    price: 299,
    category: 'accessories',
    stock: 180,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1612810436541-336d944e0a2d?w=800&q=80',
    brand: 'Pinqoza'
  },
  {
    name: 'Travel Backpack 25L',
    description: 'Comfortable daypack with laptop sleeve and multiple compartments.',
    price: 1499,
    category: 'accessories',
    stock: 60,
    unit: 'pc',
    image: 'https://images.unsplash.com/photo-1514474959185-1472d4b3e0b7?w=800&q=80',
    brand: 'Pinqoza',
    isFeatured: true
  }
];

const seedDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/pinqoza';

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    await Product.deleteMany({});
    console.log('Products cleared');

    for (const product of products) {
      await Product.create(product);
    }

    console.log(`Seeded ${products.length} marketplace products`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedDB();

