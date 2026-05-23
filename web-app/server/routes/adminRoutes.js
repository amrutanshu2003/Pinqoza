const express = require('express');
const router = express.Router();
const AdminUser = require('../models/admin/AdminUser');
const AdminOrder = require('../models/admin/AdminOrder');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, generateToken } = require('../middleware/admin/auth');
const paymentRoutes = require('./paymentRoutes');
const {
  generateCatalogProducts,
  getCsvTemplate,
  parseProductsCsv,
  productImageDataUri,
  upsertProducts
} = require('../utils/catalogProducts');

// Mount payment routes
router.use('/payment', paymentRoutes);

const CUSTOMER_ORDER_STATUSES = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const CUSTOMER_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const isValidEnum = (value, allowed) => typeof value === 'string' && allowed.includes(value);

const canTransitionOrderStatus = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) return true;
  if (fromStatus === 'cancelled' || fromStatus === 'delivered') return false;
  if (toStatus === 'cancelled') return true;

  const order = ['processing', 'confirmed', 'shipped', 'delivered'];
  const fromIdx = order.indexOf(fromStatus);
  const toIdx = order.indexOf(toStatus);
  if (fromIdx === -1 || toIdx === -1) return false;
  // only forward transitions
  return toIdx >= fromIdx;
};

const emitStockUpdates = (req, updates) => {
  const io = req.app.get('io');
  if (!io || !Array.isArray(updates) || updates.length === 0) return;
  io.emit('productsStockUpdated', {
    updates,
    timestamp: new Date()
  });
};

// @route   GET /api/admin/inventory/low-stock
// @desc    List low-stock products (main DB)
// @access  Private
router.get('/inventory/low-stock', protect, async (req, res) => {
  try {
    const threshold = Math.max(0, parseInt(req.query.threshold, 10) || 10);
    const products = await Product.find({ isActive: true, stock: { $lte: threshold } })
      .sort({ stock: 1, updatedAt: -1 })
      .select('name category stock price unit image updatedAt');
    res.json({ threshold, items: products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/analytics/summary
// @desc    Basic sales analytics summary (main DB)
// @access  Private
router.get('/analytics/summary', protect, async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const match = {
      createdAt: { $gte: from },
      orderStatus: { $in: ['confirmed', 'shipped', 'delivered'] }
    };

    const [ordersAgg] = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSales: { $sum: '$finalPrice' },
          totalSubtotal: { $sum: '$totalPrice' },
          totalDiscount: { $sum: '$discountAmount' },
          totalPointsRedeemed: { $sum: '$pointsRedeemed' }
        }
      }
    ]);

    const topProducts = await Order.aggregate([
      { $match: match },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          qty: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
        }
      },
      { $sort: { qty: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      rangeDays: days,
      from,
      totals: ordersAgg || {
        totalOrders: 0,
        totalSales: 0,
        totalSubtotal: 0,
        totalDiscount: 0,
        totalPointsRedeemed: 0
      },
      topProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/login
// @desc    Authenticate admin user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await AdminUser.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      const token = generateToken(admin._id);      
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * CUSTOMER ORDERS MANAGEMENT (main DB `Order`)
 */

// @route   GET /api/admin/customer-orders
// @desc    Get customer orders (main DB) with filters
// @access  Private
router.get('/customer-orders', protect, async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      q,
      userId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 25
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const filter = {};

    if (userId) filter.user = userId;

    if (status && isValidEnum(status, CUSTOMER_ORDER_STATUSES)) {
      filter.orderStatus = status;
    }
    if (paymentStatus && isValidEnum(paymentStatus, CUSTOMER_PAYMENT_STATUSES)) {
      filter.paymentStatus = paymentStatus;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    // Basic search:
    // - exact ObjectId match on _id
    // - partial match on user email/phone/name via populate+match isn't trivial;
    //   implement a safe fallback by looking up users first when q looks non-empty.
    if (q && String(q).trim()) {
      const query = String(q).trim();
      const or = [];
      if (/^[a-f\d]{24}$/i.test(query)) {
        or.push({ _id: query });
      }
      // lookup users by email/name/phone and filter by user ids
      const users = await User.find({
        $or: [
          { email: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } }
        ]
      }).select('_id');
      if (users.length > 0) {
        or.push({ user: { $in: users.map((u) => u._id) } });
      }
      if (or.length > 0) filter.$or = or;
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      items: orders,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/customer-orders/:id
// @desc    Get customer order by ID (main DB)
// @access  Private
router.get('/customer-orders/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/customer-orders/:id
// @desc    Delete a customer order (main DB)
// @access  Private
router.delete('/customer-orders/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Safety: only allow deleting past/finalized orders
    if (!['delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Only delivered/cancelled orders can be deleted' });
    }

    await order.deleteOne();
    res.json({ message: 'Customer order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/customer-orders/:id/status
// @desc    Update customer order status (main DB)
// @access  Private
router.put('/customer-orders/:id/status', protect, async (req, res) => {
  try {
    const { orderStatus } = req.body;
    if (!isValidEnum(orderStatus, CUSTOMER_ORDER_STATUSES)) {
      return res.status(400).json({ message: 'Invalid orderStatus' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!canTransitionOrderStatus(order.orderStatus, orderStatus)) {
      return res.status(400).json({ message: `Cannot transition from ${order.orderStatus} to ${orderStatus}` });
    }

    // If cancelling, optionally restore stock (only if not already cancelled)
    if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
      const stockUpdates = [];
      for (const item of order.orderItems) {
        if (item.product) {
          // best-effort restore
          const updatedProduct = await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { new: true, select: '_id stock' }
          );
          if (updatedProduct) {
            stockUpdates.push({
              productId: String(updatedProduct._id),
              stock: updatedProduct.stock,
              isOutOfStock: updatedProduct.stock <= 0
            });
          }
        }
      }
      emitStockUpdates(req, stockUpdates);
      order.tracking = order.tracking || {};
      order.tracking.updates = order.tracking.updates || [];
      order.tracking.updates.push({
        status: 'cancelled',
        description: 'Order cancelled by admin',
        timestamp: new Date()
      });
    }

    order.orderStatus = orderStatus;
    if (orderStatus === 'delivered') {
      order.deliveredAt = new Date();
      order.tracking = order.tracking || {};
      order.tracking.updates = order.tracking.updates || [];
      order.tracking.updates.push({
        status: 'delivered',
        description: 'Order delivered (admin update)',
        timestamp: new Date()
      });
    }

    const updated = await order.save();
    const populated = await Order.findById(updated._id).populate('user', 'name email phone');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/customer-orders/:id/payment
// @desc    Update customer order payment status (main DB)
// @access  Private
router.put('/customer-orders/:id/payment', protect, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!isValidEnum(paymentStatus, CUSTOMER_PAYMENT_STATUSES)) {
      return res.status(400).json({ message: 'Invalid paymentStatus' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = paymentStatus;
    const updated = await order.save();
    const populated = await Order.findById(updated._id).populate('user', 'name email phone');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/customer-orders/:id/tracking
// @desc    Update customer order tracking (main DB)
// @access  Private
router.put('/customer-orders/:id/tracking', protect, async (req, res) => {
  try {
    const {
      trackingNumber,
      currentLocation,
      status,
      location,
      description,
      estimatedDelivery
    } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.tracking = order.tracking || {};
    if (typeof trackingNumber === 'string') order.tracking.trackingNumber = trackingNumber.trim();
    if (typeof currentLocation === 'string') order.tracking.currentLocation = currentLocation.trim();

    if (typeof estimatedDelivery === 'string' && estimatedDelivery.trim()) {
      const d = new Date(estimatedDelivery);
      if (!Number.isNaN(d.getTime())) {
        order.tracking.estimatedDelivery = d;
      }
    }
    order.tracking.lastUpdate = new Date();

    if (status || location || description) {
      order.tracking.updates = order.tracking.updates || [];
      order.tracking.updates.push({
        status: typeof status === 'string' ? status.trim() : 'update',
        location: typeof location === 'string' ? location.trim() : '',
        description: typeof description === 'string' ? description.trim() : '',
        timestamp: new Date()
      });
    }

    const updated = await order.save();
    const populated = await Order.findById(updated._id).populate('user', 'name email phone');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * ADMIN USER MANAGEMENT (customer users)
 */

// @route   GET /api/admin/users
// @desc    Get all customer users
// @access  Private
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Toggle customer user admin role
// @access  Private
router.put('/users/:id/role', protect, async (req, res) => {
  try {
    const { isAdmin } = req.body;

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ message: 'isAdmin must be boolean' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isAdmin = isAdmin;
    await user.save();

    const updated = await User.findById(user._id).select('-password');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/users/:id/deleted
// @desc    Soft-delete or restore a customer user
// @access  Private
router.put('/users/:id/deleted', protect, async (req, res) => {
  try {
    const { isDeleted } = req.body;

    if (typeof isDeleted !== 'boolean') {
      return res.status(400).json({ message: 'isDeleted must be boolean' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isDeleted = isDeleted;
    user.deleteRequestedAt = isDeleted ? new Date() : null;
    user.deleteAt = isDeleted ? new Date() : null;

    await user.save();

    const updated = await User.findById(user._id).select('-password');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/products
// @desc    Get all admin products
// @access  Private
router.get('/products', protect, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/catalog/template
// @desc    Download CSV template for future product updates
// @access  Private
router.get('/catalog/template', protect, async (req, res) => {
  res.type('text/csv').send(getCsvTemplate());
});

// @route   POST /api/admin/catalog/seed-own
// @desc    Create/update own-brand catalog products with DB-stored category images
// @access  Private
router.post('/catalog/seed-own', protect, async (req, res) => {
  try {
    const count = Math.min(15000, Math.max(1, parseInt(req.body.count, 10) || 3000));
    const products = generateCatalogProducts(count);
    const result = await upsertProducts(products);
    res.json({
      message: `Own catalog synced with ${products.length} products`,
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/catalog/import-csv
// @desc    Import/update products from admin-provided CSV text
// @access  Private
router.post('/catalog/import-csv', protect, async (req, res) => {
  try {
    const csv = String(req.body.csv || '');
    if (!csv.trim()) {
      return res.status(400).json({ message: 'CSV content is required' });
    }

    const products = parseProductsCsv(csv);
    if (products.length === 0) {
      return res.status(400).json({ message: 'No valid products found in CSV' });
    }

    const result = await upsertProducts(products);
    res.json({
      message: `CSV import synced ${products.length} products`,
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/gate-verify
// @desc    Verify admin access gate key before showing login
// @access  Public
router.post('/gate-verify', async (req, res) => {
  try {
    const { key } = req.body;
    const expected = process.env.ADMIN_ACCESS_KEY;

    if (!expected) {
      return res.status(500).json({ message: 'Admin access key is not configured on server' });
    }

    if (typeof key !== 'string' || key.trim() !== expected) {
      return res.status(401).json({ message: 'Invalid access key' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/products
// @desc    Create a new product
// @access  Private/Admin
router.post('/products', protect, async (req, res) => {
  try {
    const { name, description, price, unit, category, subcategory, image, stock, brand, isFeatured } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      unit,
      category,
      subcategory,
      image,
      stock,
      brand,
      isFeatured
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put('/products/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.price = req.body.price || product.price;
      product.unit = req.body.unit || product.unit;
      product.category = req.body.category || product.category;
      product.subcategory = req.body.subcategory || product.subcategory;
      if (req.body.image !== undefined) {
        product.image = req.body.image;
      }
      product.brand = req.body.brand || product.brand;
      product.stock = req.body.stock !== undefined ? req.body.stock : product.stock;
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
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/products/:id/image
// @desc    Update product image (admin only)
// @access  Private
router.put('/products/:id/image', protect, async (req, res) => {
  try {
    const { image } = req.body;
    if (typeof image !== 'string' || image.trim().length < 10) {
      return res.status(400).json({ message: 'Valid image data is required' });
    }

    const imageValue = image.trim();
    if (imageValue.length > 6_000_000) {
      return res.status(400).json({ message: 'Image is too large' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.image = imageValue;
    if (!Array.isArray(product.images)) product.images = [];
    if (!product.images.includes(imageValue)) {
      product.images = [imageValue, ...product.images.filter(Boolean)].slice(0, 8);
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/products/:id/image
// @desc    Remove product image (admin only)
// @access  Private
router.delete('/products/:id/image', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.image = '';
    product.images = Array.isArray(product.images) ? product.images.filter(Boolean).slice(1) : [];
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/products/:id/image/reset
// @desc    Reset product image to generated placeholder (admin only)
// @access  Private
router.put('/products/:id/image/reset', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const placeholder = productImageDataUri(
      product.category || 'other',
      product.subcategory || 'general',
      product.name || 'Product',
      product.brand || 'Pinqoza'
    );

    product.image = placeholder;
    product.images = [placeholder];
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/products/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all admin orders
// @access  Private
router.get('/orders', protect, async (req, res) => {
  try {
    const orders = await AdminOrder.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/orders/:id
// @desc    Delete an admin order (admin DB)
// @access  Private
router.delete('/orders/:id', protect, async (req, res) => {
  try {
    const order = await AdminOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await order.deleteOne();
    res.json({ message: 'Admin order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/orders/:id
// @desc    Update order status
// @access  Private/Admin
router.put('/orders/:id', protect, async (req, res) => {
  try {
    const order = await AdminOrder.findById(req.params.id);

    if (order) {
      order.orderStatus = req.body.orderStatus || order.orderStatus;
      order.isPaid = req.body.isPaid !== undefined ? req.body.isPaid : order.isPaid;

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/admin/seed
// @desc    Seed admin data
// @access  Public (only for initial setup)
router.post('/seed', async (req, res) => {
  try {
    // Check if admin exists
    const adminExists = await AdminUser.findOne({ email: 'admin@pinqoza.com' });
    
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Create admin user
    const admin = await AdminUser.create({
      name: 'Super Admin',
      email: 'admin@pinqoza.com',
      password: 'admin123',
      role: 'superadmin'
    });

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/me
// @desc    Get current admin user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json(req.admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Subscription Routes
const Subscription = require('../models/Subscription');

// @route   GET /api/admin/subscriptions
// @desc    Get all subscriptions
// @access  Private (Admin)
router.get('/subscriptions', protect, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const subscriptions = await Subscription.find(filter)
      .populate('user', 'name email phone')
      .populate('deliveryAddress')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Subscription.countDocuments(filter);
    
    res.json({
      subscriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/subscriptions/pending
// @desc    Get pending subscription payments
// @access  Private (Admin)
router.get('/subscriptions/pending', protect, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      paymentStatus: 'pending',
      status: { $in: ['pending', 'active'] }
    })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json(subscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/subscriptions/:id
// @desc    Get subscription by ID
// @access  Private (Admin)
router.get('/subscriptions/:id', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('deliveryAddress');
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    res.json(subscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/subscriptions/verify/:id
// @desc    Verify subscription payment
// @access  Private (Admin)
router.post('/subscriptions/verify/:id', protect, async (req, res) => {
  try {
    const { transactionId, notes } = req.body;

    const subscription = await Subscription.findById(req.params.id).populate('user', 'name email _id');

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment already verified' });
    }

    // Update subscription
    subscription.paymentStatus = 'paid';
    subscription.status = 'active';
    subscription.transactionId = transactionId;
    subscription.paymentNotes = notes;
    subscription.adminNotes = notes;

    await subscription.save();

    // Emit socket event for real-time update to user
    const io = req.app.get('io');
    if (io && subscription.user && subscription.user._id) {
      const userId = subscription.user._id.toString();
      console.log('📡 [Admin Verify] Emitting subscriptionConfirmed to user:', userId);

      io.to(userId).emit('subscriptionConfirmed', {
        subscriptionId: subscription._id,
        planName: subscription.planName,
        status: 'active',
        message: `Your ${subscription.planName} subscription has been activated!`,
        timestamp: new Date()
      });
      console.log('✅ [Admin Verify] Socket event emitted successfully');
    } else {
      console.log('❌ [Admin Verify] Cannot emit - io or user missing');
    }

    res.json({
      message: 'Payment verified successfully',
      subscription
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/subscriptions/reject/:id
// @desc    Reject subscription payment
// @access  Private (Admin)
router.post('/subscriptions/reject/:id', protect, async (req, res) => {
  try {
    const { reason } = req.body;

    const subscription = await Subscription.findById(req.params.id).populate('user', 'name email _id');

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Cannot reject paid subscription' });
    }

    // Update subscription
    subscription.paymentStatus = 'failed';
    subscription.status = 'cancelled';
    subscription.adminNotes = reason;

    await subscription.save();

    // Emit socket event for real-time update to user
    const io = req.app.get('io');
    if (io && subscription.user && subscription.user._id) {
      const userId = subscription.user._id.toString();
      console.log('📡 [Admin Reject] Emitting subscriptionFailed to user:', userId);

      io.to(userId).emit('subscriptionFailed', {
        subscriptionId: subscription._id,
        planName: subscription.planName,
        status: 'failed',
        message: `Your ${subscription.planName} subscription payment verification failed.`,
        timestamp: new Date()
      });
      console.log('✅ [Admin Reject] Socket event emitted successfully');
    } else {
      console.log('❌ [Admin Reject] Cannot emit - io or user missing');
    }

    res.json({
      message: 'Subscription rejected successfully',
      subscription
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/subscriptions/:id
// @desc    Update subscription
// @access  Private (Admin)
router.put('/subscriptions/:id', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    const { status, paymentStatus, adminNotes, autoRenewal } = req.body;
    
    if (status) subscription.status = status;
    if (paymentStatus) subscription.paymentStatus = paymentStatus;
    if (adminNotes !== undefined) subscription.adminNotes = adminNotes;
    if (autoRenewal !== undefined) subscription.autoRenewal = autoRenewal;
    
    await subscription.save();
    
    res.json({
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

