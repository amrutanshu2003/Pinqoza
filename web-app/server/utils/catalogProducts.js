const Product = require('../models/Product');

const CATEGORIES = [
  'milk',
  'ghee',
  'cheese',
  'butter',
  'curd',
  'paneer',
  'cream',
  'yogurt',
  'lassi',
  'buttermilk',
  'sweets',
  'cake',
  'groceries',
  'fashion',
  'electronics',
  'home',
  'beauty',
  'accessories',
  'kitchen',
  'sports',
  'books',
  'toys',
  'baby',
  'pet',
  'health',
  'automotive',
  'office',
  'other'
];

const CATEGORY_META = {
  milk: { unit: 'L', price: [45, 140], color: '#dbeafe', accent: '#2563eb', icon: 'MILK' },
  ghee: { unit: 'kg', price: [320, 1200], color: '#fef3c7', accent: '#d97706', icon: 'GHEE' },
  cheese: { unit: 'pack', price: [80, 680], color: '#fef9c3', accent: '#ca8a04', icon: 'CHEESE' },
  butter: { unit: 'pack', price: [50, 460], color: '#fff7ed', accent: '#ea580c', icon: 'BUTTER' },
  curd: { unit: 'kg', price: [35, 180], color: '#ecfeff', accent: '#0891b2', icon: 'CURD' },
  paneer: { unit: 'kg', price: [90, 420], color: '#f8fafc', accent: '#64748b', icon: 'PANEER' },
  cream: { unit: 'pack', price: [70, 320], color: '#faf5ff', accent: '#9333ea', icon: 'CREAM' },
  yogurt: { unit: 'pack', price: [45, 280], color: '#fdf2f8', accent: '#db2777', icon: 'YOGURT' },
  lassi: { unit: 'L', price: [30, 150], color: '#f0fdf4', accent: '#16a34a', icon: 'LASSI' },
  buttermilk: { unit: 'L', price: [20, 95], color: '#eff6ff', accent: '#0284c7', icon: 'CHAAS' },
  sweets: { unit: 'kg', price: [120, 980], color: '#fff1f2', accent: '#e11d48', icon: 'SWEETS' },
  cake: { unit: 'pc', price: [180, 1700], color: '#fdf4ff', accent: '#c026d3', icon: 'CAKE' },
  groceries: { unit: 'pack', price: [25, 900], color: '#f7fee7', accent: '#65a30d', icon: 'GROCERY' },
  fashion: { unit: 'pc', price: [199, 3499], color: '#eef2ff', accent: '#4f46e5', icon: 'FASHION' },
  electronics: { unit: 'pc', price: [299, 79999], color: '#f1f5f9', accent: '#0f172a', icon: 'ELECTRO' },
  home: { unit: 'pc', price: [99, 8999], color: '#fefce8', accent: '#a16207', icon: 'HOME' },
  beauty: { unit: 'pc', price: [75, 2499], color: '#fce7f3', accent: '#be185d', icon: 'BEAUTY' },
  accessories: { unit: 'pc', price: [49, 2999], color: '#f5f3ff', accent: '#7c3aed', icon: 'ACC' },
  kitchen: { unit: 'pc', price: [89, 7999], color: '#fef2f2', accent: '#b91c1c', icon: 'KITCHEN' },
  sports: { unit: 'pc', price: [99, 8999], color: '#ecfccb', accent: '#3f6212', icon: 'SPORT' },
  books: { unit: 'pc', price: [99, 1999], color: '#fff7ed', accent: '#9a3412', icon: 'BOOK' },
  toys: { unit: 'pc', price: [79, 4999], color: '#f0f9ff', accent: '#0369a1', icon: 'TOY' },
  baby: { unit: 'pack', price: [79, 6999], color: '#fef2f2', accent: '#e11d48', icon: 'BABY' },
  pet: { unit: 'pack', price: [89, 5499], color: '#f0fdf4', accent: '#15803d', icon: 'PET' },
  health: { unit: 'pc', price: [49, 4999], color: '#f0fdfa', accent: '#0f766e', icon: 'HEALTH' },
  automotive: { unit: 'pc', price: [129, 12999], color: '#f8fafc', accent: '#334155', icon: 'AUTO' },
  office: { unit: 'pc', price: [39, 6999], color: '#eef2ff', accent: '#1d4ed8', icon: 'OFFICE' },
  other: { unit: 'pc', price: [49, 1999], color: '#f3f4f6', accent: '#374151', icon: 'ITEM' }
};

const TAXONOMY = {
  milk: { subcategories: ['fresh-milk', 'flavored-milk', 'health-milk'], products: ['Cow Milk', 'Buffalo Milk', 'Toned Milk', 'A2 Milk', 'Badam Milk', 'Chocolate Milk'] },
  ghee: { subcategories: ['cow-ghee', 'buffalo-ghee', 'cooking-ghee'], products: ['Desi Ghee', 'A2 Cow Ghee', 'Bilona Ghee', 'Cooking Ghee', 'Organic Ghee'] },
  cheese: { subcategories: ['processed-cheese', 'pizza-cheese', 'spread-cheese'], products: ['Cheese Slices', 'Mozzarella', 'Cheddar', 'Cream Cheese', 'Cheese Spread'] },
  butter: { subcategories: ['table-butter', 'cooking-butter', 'special-butter'], products: ['Salted Butter', 'Unsalted Butter', 'White Butter', 'Garlic Butter', 'Herb Butter'] },
  curd: { subcategories: ['daily-curd', 'probiotic-curd', 'set-curd'], products: ['Fresh Curd', 'Set Curd', 'Probiotic Curd', 'Low Fat Curd'] },
  paneer: { subcategories: ['fresh-paneer', 'cooking-paneer', 'premium-paneer'], products: ['Fresh Paneer', 'Paneer Cubes', 'Malai Paneer', 'Low Fat Paneer', 'Organic Paneer'] },
  cream: { subcategories: ['fresh-cream', 'whipping-cream', 'cooking-cream'], products: ['Fresh Cream', 'Whipping Cream', 'Cooking Cream', 'Dessert Cream'] },
  yogurt: { subcategories: ['plain-yogurt', 'fruit-yogurt', 'greek-yogurt'], products: ['Plain Yogurt', 'Greek Yogurt', 'Mango Yogurt', 'Strawberry Yogurt'] },
  lassi: { subcategories: ['sweet-lassi', 'salted-lassi', 'fruit-lassi'], products: ['Sweet Lassi', 'Salted Lassi', 'Mango Lassi', 'Rose Lassi'] },
  buttermilk: { subcategories: ['plain-chaas', 'masala-chaas', 'mint-chaas'], products: ['Plain Chaas', 'Masala Chaas', 'Jeera Chaas', 'Mint Chaas'] },
  sweets: { subcategories: ['bengali-sweets', 'dry-sweets', 'festival-sweets'], products: ['Rasgulla', 'Gulab Jamun', 'Rasmalai', 'Kaju Katli', 'Milk Peda'] },
  cake: { subcategories: ['birthday-cake', 'pastry', 'eggless-cake'], products: ['Chocolate Cake', 'Black Forest Cake', 'Pineapple Cake', 'Red Velvet Cake'] },
  groceries: { subcategories: ['staples', 'pulses', 'oils', 'beverages', 'snacks'], products: ['Basmati Rice', 'Wheat Atta', 'Toor Dal', 'Sugar', 'Tea', 'Coffee', 'Cooking Oil'] },
  fashion: { subcategories: ['mens-wear', 'womens-wear', 'kids-wear', 'footwear'], products: ['Cotton T-Shirt', 'Casual Shirt', 'Kurta', 'Jeans', 'Dress', 'Sneakers'] },
  electronics: { subcategories: ['mobiles', 'laptops', 'tv-audio', 'refrigerator', 'washing-machine', 'ac-cooler', 'kitchen-appliance', 'small-appliance'], products: ['Smartphone', 'Laptop', 'Smart TV', 'Refrigerator', 'Washing Machine', 'Microwave Oven', 'Bluetooth Speaker', 'Earbuds', 'Air Conditioner'] },
  home: { subcategories: ['cleaning', 'furnishing', 'storage', 'bath'], products: ['Floor Cleaner', 'Bedsheet', 'Storage Box', 'Bath Towel', 'Room Freshener'] },
  beauty: { subcategories: ['skincare', 'haircare', 'makeup', 'fragrance'], products: ['Face Wash', 'Body Lotion', 'Shampoo', 'Hair Oil', 'Lipstick', 'Perfume'] },
  accessories: { subcategories: ['bags', 'wallets', 'watches', 'travel-accessories'], products: ['Handbag', 'Wallet', 'Sunglasses', 'Watch', 'Travel Pouch'] },
  kitchen: { subcategories: ['cookware', 'serveware', 'kitchen-tools', 'water-bottle'], products: ['Frying Pan', 'Pressure Cooker', 'Knife Set', 'Lunch Box', 'Steel Bottle'] },
  sports: { subcategories: ['fitness', 'outdoor', 'indoor'], products: ['Yoga Mat', 'Dumbbell', 'Cricket Bat', 'Football', 'Badminton Racket'] },
  books: { subcategories: ['school-books', 'competitive-books', 'novels'], products: ['Math Guide', 'Science Textbook', 'GK Book', 'English Novel', 'Practice Workbook'] },
  toys: { subcategories: ['educational-toys', 'action-toys', 'puzzles'], products: ['Building Blocks', 'Remote Car', 'Puzzle Game', 'Doll Set', 'Action Figure'] },
  baby: { subcategories: ['baby-food', 'diapers', 'baby-care'], products: ['Baby Diapers', 'Baby Wipes', 'Baby Lotion', 'Baby Cereal', 'Baby Shampoo'] },
  pet: { subcategories: ['pet-food', 'pet-care', 'pet-accessories'], products: ['Dog Food', 'Cat Food', 'Pet Shampoo', 'Leash', 'Feeding Bowl'] },
  health: { subcategories: ['vitamins', 'protein', 'personal-care', 'medical-supplies'], products: ['Multivitamin', 'Protein Powder', 'Hand Sanitizer', 'Digital Thermometer', 'Blood Pressure Monitor'] },
  automotive: { subcategories: ['car-care', 'bike-accessories', 'lubricants'], products: ['Engine Oil', 'Car Shampoo', 'Bike Cover', 'Air Pump', 'Helmet'] },
  office: { subcategories: ['stationery', 'printing', 'office-electronics'], products: ['Notebook', 'Pen Pack', 'Printer Paper', 'Calculator', 'Desk Organizer'] },
  other: { subcategories: ['general'], products: ['General Utility Item'] }
};

const OWN_BRANDS = ['Pinqoza', 'Pinqoza Fresh', 'Pinqoza Select', 'Pinqoza Daily', 'Pinqoza Premium', 'Pinqoza Max', 'Pinqoza Smart'];
const SIZE_POOL = ['100g', '200g', '250g', '500g', '750g', '1kg', '1L', '2L', 'family pack', 'combo pack'];
const csvHeaders = ['name', 'brand', 'category', 'subcategory', 'description', 'price', 'stock', 'unit', 'image', 'isFeatured', 'isActive'];

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const pick = (items, index) => items[index % items.length];

const priceFor = (category, index) => {
  const [min, max] = CATEGORY_META[category]?.price || [50, 500];
  const span = Math.max(1, max - min);
  return Math.round((min + ((index * 37) % span)) / 5) * 5;
};

const stockFor = (index) => 30 + ((index * 13) % 300);

const productImageDataUri = (category, subcategory, name, brand) => {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  const initials = brand
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const safeName = String(name).replace(/[<>&"]/g, '');
  const safeSub = String(subcategory || 'general').replace(/[<>&"]/g, '').toUpperCase().slice(0, 20);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" rx="56" fill="${meta.color}"/>
  <circle cx="648" cy="140" r="98" fill="${meta.accent}" opacity="0.12"/>
  <circle cx="136" cy="652" r="132" fill="${meta.accent}" opacity="0.10"/>
  <rect x="210" y="160" width="380" height="470" rx="44" fill="#ffffff" stroke="${meta.accent}" stroke-width="10"/>
  <rect x="250" y="220" width="300" height="110" rx="24" fill="${meta.accent}" opacity="0.15"/>
  <text x="400" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="${meta.accent}">${initials}</text>
  <rect x="265" y="360" width="270" height="144" rx="24" fill="${meta.accent}"/>
  <text x="400" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${meta.icon}</text>
  <text x="400" y="464" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="600" fill="#ffffff">${safeSub}</text>
  <text x="400" y="690" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#111827">${safeName.slice(0, 34)}</text>
</svg>`.trim();
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

const normalizeProduct = (raw, index = 0) => {
  const category = CATEGORIES.includes(String(raw.category || '').trim()) ? String(raw.category).trim() : 'other';
  const taxonomy = TAXONOMY[category] || TAXONOMY.other;
  const subcategory = taxonomy.subcategories.includes(String(raw.subcategory || '').trim())
    ? String(raw.subcategory).trim()
    : pick(taxonomy.subcategories, index);
  const brand = String(raw.brand || pick(OWN_BRANDS, index)).trim();
  const defaultName = `${brand} ${pick(taxonomy.products, index)} ${pick(SIZE_POOL, index)}`;
  const name = String(raw.name || defaultName).trim();
  const slug = slugify(raw.slug || `${brand}-${name}`);
  const image = String(raw.image || '').trim() || productImageDataUri(category, subcategory, name, brand);
  const unit = ['L', 'kg', 'pc', 'pack'].includes(raw.unit) ? raw.unit : CATEGORY_META[category]?.unit || 'pc';

  return {
    name,
    slug,
    brand,
    category,
    subcategory,
    description:
      String(raw.description || '').trim() ||
      `${name} from ${brand} in ${subcategory} category. Quality checked for reliable daily shopping and strong value.`,
    price: Math.max(0, Number(raw.price) || priceFor(category, index)),
    stock: Math.max(0, Math.floor(Number(raw.stock) || stockFor(index))),
    unit,
    image,
    images: [image],
    ratings: Math.min(5, Math.max(0, Number(raw.ratings) || (4.1 + ((index % 8) / 10)))),
    numReviews: Math.max(0, Math.floor(Number(raw.numReviews) || (12 + ((index * 7) % 700)))),
    isFeatured: raw.isFeatured === true || String(raw.isFeatured).toLowerCase() === 'true' || index % 31 === 0,
    isActive: raw.isActive === false || String(raw.isActive).toLowerCase() === 'false' ? false : true
  };
};

const generateCatalogProducts = (count = 3000) => {
  const total = Math.max(1, Math.floor(Number(count) || 3000));
  return Array.from({ length: total }, (_, index) => {
    const category = pick(CATEGORIES, index);
    const taxonomy = TAXONOMY[category] || TAXONOMY.other;
    const subcategory = pick(taxonomy.subcategories, index + Math.floor(index / 3));
    const brand = pick(OWN_BRANDS, index + Math.floor(index / 11));
    const baseName = pick(taxonomy.products, index + Math.floor(index / 7));
    const size = pick(SIZE_POOL, index + Math.floor(index / 5));
    return normalizeProduct(
      {
        name: `${brand} ${baseName} ${size}`,
        brand,
        category,
        subcategory
      },
      index
    );
  });
};

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values.map((value) => value.trim());
};

const parseProductsCsv = (csvText) => {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const raw = headers.reduce((row, header, headerIndex) => {
      row[header] = values[headerIndex] || '';
      return row;
    }, {});
    return normalizeProduct(raw, index);
  });
};

const upsertProducts = async (products) => {
  const ops = products.map((product) => ({
    updateOne: {
      filter: { slug: product.slug },
      update: { $set: product },
      upsert: true
    }
  }));
  if (ops.length === 0) return { matched: 0, modified: 0, upserted: 0, total: 0 };

  const result = await Product.bulkWrite(ops, { ordered: false });
  return {
    matched: result.matchedCount || 0,
    modified: result.modifiedCount || 0,
    upserted: result.upsertedCount || 0,
    total: products.length
  };
};

const getCsvTemplate = () => `${csvHeaders.join(',')}
Pinqoza Fresh Cow Milk 1L,Pinqoza Fresh,milk,fresh-milk,Fresh daily milk for tea coffee and drinking,68,120,L,,true,true
Pinqoza Premium Smartphone 6GB 128GB,Pinqoza Premium,electronics,mobiles,Affordable smartphone with strong battery and display,12999,40,pc,,true,true
Pinqoza Daily Refrigerator 190L,Pinqoza Daily,electronics,refrigerator,Single door refrigerator for home kitchen,18999,18,pc,,false,true
Pinqoza Select Cotton T-Shirt,Pinqoza Select,fashion,mens-wear,Comfort cotton t-shirt for daily wear,599,90,pc,,false,true`;

module.exports = {
  CATEGORIES,
  generateCatalogProducts,
  getCsvTemplate,
  productImageDataUri,
  normalizeProduct,
  parseProductsCsv,
  upsertProducts
};
