const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const products = [
  {
    name: 'Fresh Cow Milk',
    description: 'Pure and fresh cow milk delivered daily. Rich in calcium and protein.',
    price: 55,
    category: 'milk',
    stock: 100,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Pure Desi Ghee',
    description: 'Traditional cow ghee made from pure buffalo milk. Rich aroma and taste.',
    price: 450,
    category: 'ghee',
    stock: 50,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1627097842060-5cbc569c8b2b?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Fresh Paneer',
    description: 'Soft and fresh paneer made from pure cow milk. Perfect for cooking.',
    price: 120,
    category: 'paneer',
    stock: 30,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
{
    name: 'Organic Curd',
    description: 'Creamy and thick curd made from organic milk. Probiotic rich.',
    price: 40,
    category: 'curd',
    stock: 80,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo-1558637845-c8a7f6829f7d/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: true
  },
{
    name: 'Premium Cheese',
    description: 'Aged cheddar cheese perfect for sandwiches and pizzas.',
    price: 180,
    category: 'cheese',
    stock: 25,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo/2016/11/04/14/12/cheese-1807537_1280.jpg',
    brand: 'MilkMitra',
    isFeatured: true
  },
{
    name: 'Fresh Cream',
    description: 'Rich dairy cream for desserts and cooking. Contains 25% fat.',
    price: 65,
    category: 'cream',
    stock: 40,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo-1618974532156-5d4a4a919e75d/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: ' salted Butter',
    description: 'Pure butter made from fresh cream. Perfect for baking and cooking.',
    price: 80,
    category: 'butter',
    stock: 60,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
{
    name: 'Sweet Lassi',
    description: 'Refreshing yogurt drink with natural sweetness. Rich in probiotics.',
    price: 30,
    category: 'lassi',
    stock: 100,
    unit: 'L',
    image: 'https://cdn.pixabay.com/photo/1529380979169-1ca71a316dcf/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Buttermilk',
    description: 'Light and refreshing drink. Good for digestion.',
    price: 20,
    category: 'buttermilk',
    stock: 120,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Greek Yogurt',
    description: 'Thick and creamy Greek yogurt. High protein content.',
    price: 55,
    category: 'yogurt',
    stock: 50,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Buffalo Milk',
    description: 'Rich and creamy buffalo milk. Higher fat content than cow milk.',
    price: 60,
    category: 'milk',
    stock: 80,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Toned Milk',
    description: 'Low-fat toned milk. Healthy option for daily consumption.',
    price: 45,
    category: 'milk',
    stock: 100,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Double Toned Milk',
    description: 'Extra low-fat milk perfect for health conscious consumers.',
    price: 40,
    category: 'milk',
    stock: 90,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Full Cream Milk',
    description: 'Rich and creamy full cream milk with 6% fat content.',
    price: 65,
    category: 'milk',
    stock: 70,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Goat Milk',
    description: 'Nutritious goat milk easy to digest. Rich in vitamins and minerals.',
    price: 75,
    category: 'milk',
    stock: 40,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'A2 Desi Cow Milk',
    description: 'Premium A2 milk from indigenous desi cows. Highly nutritious.',
    price: 85,
    category: 'milk',
    stock: 50,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Bilona Ghee',
    description: 'Traditional bilona method ghee from desi cow milk. Pure and authentic.',
    price: 650,
    category: 'ghee',
    stock: 30,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1556909113-f59e08ec1562?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Mixed Fruit Ghee',
    description: 'Aromatic ghee infused with natural fruit extracts.',
    price: 550,
    category: 'ghee',
    stock: 25,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1556909113-f59e08ec1562?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Malai Paneer',
    description: 'Extra soft and creamy malai paneer. Melts in your mouth.',
    price: 140,
    category: 'paneer',
    stock: 35,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Low Fat Paneer',
    description: 'Healthy low fat paneer for fitness enthusiasts.',
    price: 100,
    category: 'paneer',
    stock: 45,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Smoked Paneer',
    description: 'Flavorful smoked paneer with rich aromatic taste.',
    price: 160,
    category: 'paneer',
    stock: 25,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Mozzarella Cheese',
    description: 'Fresh mozzarella cheese perfect for pizzas and pasta.',
    price: 220,
    category: 'cheese',
    stock: 30,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo/2016/11/04/14/12/cheese-1807537_1280.jpg',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Cottage Cheese',
    description: 'Soft and crumbly cottage cheese with mild flavor.',
    price: 150,
    category: 'cheese',
    stock: 40,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo/2016/11/04/14/12/cheese-1807537_1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Parmesan Cheese',
    description: 'Aged parmesan cheese with rich nutty flavor.',
    price: 280,
    category: 'cheese',
    stock: 20,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo/2016/11/04/14/12/cheese-1807537_1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Unsalted Butter',
    description: 'Pure unsalted butter for baking and cooking.',
    price: 85,
    category: 'butter',
    stock: 55,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Garlic Butter',
    description: 'Flavorful garlic butter with herbs and spices.',
    price: 95,
    category: 'butter',
    stock: 35,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Herb Butter',
    description: 'Aromatic butter infused with fresh herbs.',
    price: 90,
    category: 'butter',
    stock: 30,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Mango Lassi',
    description: 'Sweet and fruity mango lassi with real mango pulp.',
    price: 35,
    category: 'lassi',
    stock: 80,
    unit: 'L',
    image: 'https://cdn.pixabay.com/photo-1529380979169-1ca71a316dcf/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Salty Lassi',
    description: 'Traditional salty lassi with roasted cumin powder.',
    price: 25,
    category: 'lassi',
    stock: 90,
    unit: 'L',
    image: 'https://cdn.pixabay.com/photo-1529380979169-1ca71a316dcf/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Strawberry Yogurt',
    description: 'Creamy strawberry flavored yogurt with real fruit pieces.',
    price: 60,
    category: 'yogurt',
    stock: 45,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Plain Yogurt',
    description: 'Simple and plain yogurt perfect for daily consumption.',
    price: 45,
    category: 'yogurt',
    stock: 60,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Low Fat Curd',
    description: 'Healthy low fat curd for weight conscious consumers.',
    price: 35,
    category: 'curd',
    stock: 70,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo/1558637845-c8a7f6829f7d/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Set Curd',
    description: 'Traditional set curd in earthen pots. Authentic taste.',
    price: 42,
    category: 'curd',
    stock: 65,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo/1558637845-c8a7f6829f7d/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Whipping Cream',
    description: 'Heavy cream perfect for whipping and desserts.',
    price: 120,
    category: 'cream',
    stock: 25,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo/1618974532156-5d4a4a919e75d/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Sour Cream',
    description: 'Tangy sour cream for dips and toppings.',
    price: 75,
    category: 'cream',
    stock: 35,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo-1618974532156-5d4a4a919e75d/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Probiotic Milk',
    description: 'Enriched milk with live probiotics for better digestion.',
    price: 70,
    category: 'milk',
    stock: 60,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Chocolate Milk',
    description: 'Sweet and creamy chocolate milk loved by kids and adults.',
    price: 50,
    category: 'milk',
    stock: 80,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Strawberry Milk',
    description: 'Delicious strawberry flavored milk with real fruit essence.',
    price: 55,
    category: 'milk',
    stock: 70,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Organic Ghee',
    description: 'Pure organic ghee from grass-fed cows. No preservatives.',
    price: 750,
    category: 'ghee',
    stock: 25,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1556909113-f59e08ec1562?w=400',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Clarified Butter',
    description: 'Premium clarified butter for cooking and baking.',
    price: 420,
    category: 'ghee',
    stock: 30,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1556909113-f59e08ec1562?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Tofu Paneer',
    description: 'Plant-based tofu paneer for vegan diet enthusiasts.',
    price: 90,
    category: 'paneer',
    stock: 40,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Grilled Paneer',
    description: 'Pre-seasoned grilled paneer perfect for quick meals.',
    price: 180,
    category: 'paneer',
    stock: 20,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Swiss Cheese',
    description: 'Authentic Swiss cheese with holes and nutty flavor.',
    price: 320,
    category: 'cheese',
    stock: 15,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo/2016/11/04/14/12/cheese-1807537_1280.jpg',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Blue Cheese',
    description: 'Aged blue cheese with distinctive blue veins.',
    price: 450,
    category: 'cheese',
    stock: 10,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo/2016/11/04/14/12/cheese-1807537_1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Feta Cheese',
    description: 'Greek-style feta cheese perfect for salads.',
    price: 280,
    category: 'cheese',
    stock: 25,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo/2016/11/04/14/12/cheese-1807537_1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Flavored Butter',
    description: 'Mixed herb butter with garlic and parsley.',
    price: 110,
    category: 'butter',
    stock: 30,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Cultured Butter',
    description: 'European-style cultured butter with rich flavor.',
    price: 130,
    category: 'butter',
    stock: 25,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Rose Lassi',
    description: 'Fragrant rose lassi with cardamom and pistachios.',
    price: 40,
    category: 'lassi',
    stock: 60,
    unit: 'L',
    image: 'https://cdn.pixabay.com/photo-1529380979169-1ca71a316dcf/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: true
  },
  {
    name: 'Pineapple Lassi',
    description: 'Tropical pineapple lassi with real fruit juice.',
    price: 38,
    category: 'lassi',
    stock: 50,
    unit: 'L',
    image: 'https://cdn.pixabay.com/photo-1529380979169-1ca71a316dcf/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Kefir',
    description: 'Fermented milk drink rich in probiotics.',
    price: 65,
    category: 'yogurt',
    stock: 45,
    unit: 'L',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Labneh',
    description: 'Creamy strained yogurt perfect for spreads.',
    price: 85,
    category: 'yogurt',
    stock: 35,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Fruit Yogurt',
    description: 'Mixed berry yogurt with real fruit pieces.',
    price: 70,
    category: 'yogurt',
    stock: 40,
    unit: 'kg',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Traditional Curd',
    description: 'Handmade traditional curd in clay pots.',
    price: 45,
    category: 'curd',
    stock: 55,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo-1558637845-c8a7f6829f7d/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Probiotic Curd',
    description: 'Enriched curd with additional probiotic cultures.',
    price: 50,
    category: 'curd',
    stock: 60,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo-1558637845-c8a7f6829f7d/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  },
  {
    name: 'Double Cream',
    description: 'Extra rich double cream with 48% fat content.',
    price: 150,
    category: 'cream',
    stock: 20,
    unit: 'kg',
    image: 'https://cdn.pixabay.com/photo-1618974532156-5d4a4a919e75d/1280.jpg',
    brand: 'MilkMitra',
    isFeatured: false
  }
];

const BRANDED_PRODUCTS = products.map((product) => ({
  ...product,
  brand: 'Pinqoza'
}));

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://Hackerbase:Amru2003@e-commerce.gqnqlb8.mongodb.net/?appName=E-commerce');
    console.log('MongoDB Connected...');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Products cleared...');

    // Insert new products one by one to trigger pre-save middleware
    for (const product of BRANDED_PRODUCTS) {
      await Product.create(product);
    }
    console.log('Products added successfully!');

    console.log('Database seeding completed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
