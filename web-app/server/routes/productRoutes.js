const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

const emitStockUpdates = (req, updates) => {
  const io = req.app.get('io');
  if (!io || !Array.isArray(updates) || updates.length === 0) return;
  io.emit('productsStockUpdated', {
    updates,
    timestamp: new Date()
  });
};

// @route   GET /api/products
// @desc    Get all products with enhanced search
// @access  Public
router.get('/', async (req, res) => {
  try {
    const toNum = (v) => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const page = Math.max(1, toNum(req.query.page) || 1);
    const requestedLimit = toNum(req.query.limit);
    const pageSize = Math.min(60, Math.max(1, requestedLimit || 24));

    const category = req.query.category;
    const search = req.query.search;
    const minPrice = toNum(req.query.minPrice);
    const maxPrice = toNum(req.query.maxPrice);
    const minRating = toNum(req.query.minRating);
    const sort = String(req.query.sort || 'newest');
    
    let query = { isActive: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (minPrice !== null || maxPrice !== null) {
      query.price = {};
      if (minPrice !== null) query.price.$gte = Math.max(0, minPrice);
      if (maxPrice !== null) query.price.$lte = Math.max(0, maxPrice);
    }

    if (minRating !== null) {
      query.ratings = { $gte: Math.max(0, Math.min(5, minRating)) };
    }

    if (search) {
      // Enhanced search with better regex
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { brand: { $regex: searchRegex } },
        { category: { $regex: searchRegex } }
      ];
    }
    
    const count = await Product.countDocuments(query);

    let sortSpec = { createdAt: -1 };
    if (sort === 'price_asc') sortSpec = { price: 1, createdAt: -1 };
    if (sort === 'price_desc') sortSpec = { price: -1, createdAt: -1 };
    if (sort === 'rating_desc') sortSpec = { ratings: -1, numReviews: -1, createdAt: -1 };

    const products = await Product.find(query)
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort(sortSpec);
    
    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
      limit: pageSize
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/search
// @desc    Search products (dedicated search endpoint)
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }
    
    const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { brand: { $regex: searchRegex } }
      ]
    })
      .limit(Number(limit))
      .select('name price image category brand');
    
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true }).limit(10);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/categories
// @desc    Get product categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product && product.isActive) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/:id/reviews
// @desc    Get product reviews
// @access  Public
router.get('/:id/reviews', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('reviews.user', 'name');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product.reviews || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Add product review
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    if (!comment) {
      return res.status(400).json({ message: 'Comment is required' });
    }
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user has purchased the product
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'orderItems.product': productId,
      orderStatus: { $in: ['confirmed', 'shipped', 'delivered'] }
    });
    
    // In development mode, allow reviews without purchase
    // In production, uncomment the following line:
    // if (!hasPurchased) {
    //   return res.status(403).json({ message: 'You must purchase this product to review it' });
    // }
    
    // Check if user already reviewed
    const existingReview = product.reviews.find(
      r => r.user.toString() === req.user._id.toString()
    );
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    
    // Add review
    product.reviews.push({
      user: req.user._id,
      name: req.user.name,
      rating,
      comment
    });
    
    // Recalculate average rating
    product.calcAverageRating();
    
    await product.save();
    
    res.json(product.reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id/reviews/:reviewId
// @desc    Delete a product review (moderation)
// @access  Private/Admin
router.delete('/:id/reviews/:reviewId', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const before = product.reviews.length;
    product.reviews = product.reviews.filter((r) => r._id.toString() !== req.params.reviewId);
    if (product.reviews.length === before) {
      return res.status(404).json({ message: 'Review not found' });
    }

    product.calcAverageRating();
    await product.save();

    res.json(product.reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create a product
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, price, category, subcategory, stock, unit, image, brand, isFeatured } = req.body;
    
    const product = await Product.create({
      name,
      description,
      price,
      category,
      subcategory,
      stock,
      unit,
      image,
      brand,
      isFeatured
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.price = req.body.price || product.price;
      product.category = req.body.category || product.category;
      product.subcategory = req.body.subcategory || product.subcategory;
      product.stock = req.body.stock !== undefined ? req.body.stock : product.stock;
      product.unit = req.body.unit || product.unit;
      product.image = req.body.image || product.image;
      product.brand = req.body.brand || product.brand;
      product.isFeatured = req.body.isFeatured !== undefined ? req.body.isFeatured : product.isFeatured;
      product.isActive = req.body.isActive !== undefined ? req.body.isActive : product.isActive;
      
      const updatedProduct = await product.save();
      emitStockUpdates(req, [{
        productId: String(updatedProduct._id),
        stock: updatedProduct.stock,
        isOutOfStock: updatedProduct.stock <= 0
      }]);
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
