const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const emitStockUpdates = (req, updates) => {
  const io = req.app.get('io');
  if (!io || !Array.isArray(updates) || updates.length === 0) return;
  io.emit('productsStockUpdated', {
    updates,
    timestamp: new Date()
  });
};

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, notes, couponCode, pointsToRedeem } = req.body;
    
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    
    // Check stock for all items
    for (const item of cart.items) {
      // item.product is already populated from cart.findOne().populate('items.product')
      // Use the populated product data directly
      const product = item.product;
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.name}` 
        });
      }
    }
    
    // Create order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      unit: item.unit,
      image: item.image
    }));
    
    const subtotal = Number(cart.totalPrice) || 0;

    // Coupon discount (optional)
    let discountAmount = 0;
    let normalizedCoupon = '';
    if (couponCode) {
      const code = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code, isActive: true });
      if (coupon) {
        const expired = coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now();
        const overLimit = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;
        if (!expired && !overLimit && subtotal >= (coupon.minOrderAmount || 0)) {
          if (coupon.discountType === 'fixed') discountAmount = coupon.value;
          else discountAmount = (subtotal * coupon.value) / 100;
          if (coupon.maxDiscountAmount > 0) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          discountAmount = Math.max(0, Math.floor(discountAmount));
          normalizedCoupon = coupon.code;
        }
      }
    }

    // Loyalty points redemption (optional): 1 point = ₹1
    const user = await User.findById(req.user._id).select('loyaltyPoints');
    const availablePoints = Number(user?.loyaltyPoints) || 0;
    const requestedPoints = Math.max(0, Math.floor(Number(pointsToRedeem) || 0));
    const maxRedeemable = Math.max(0, subtotal - discountAmount);
    const pointsRedeemed = Math.min(availablePoints, requestedPoints, maxRedeemable);

    const finalPrice = Math.max(0, Math.floor(subtotal - discountAmount - pointsRedeemed));

    // Create order
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice: subtotal,
      totalItems: cart.totalItems,
      notes,
      status: paymentMethod === 'cod' ? 'pending_confirmation' : 'pending',
      paymentStatus: 'pending',
      orderPlaced: false,
      couponCode: normalizedCoupon,
      discountAmount,
      pointsRedeemed,
      finalPrice
    });

    // Log order creation
    console.log(`💰 Order created: ${order._id} for ₹${cart.totalPrice}, Payment: ${paymentMethod}`);
    
    // Emit real-time notification to admin
    const io = req.app.get('io');
    if (io) {
      io.emit('newOrder', {
        orderId: order._id,
        paymentMethod: paymentMethod,
        amount: cart.totalPrice,
        message: `New ${paymentMethod === 'online' ? 'Online Payment' : 'COD Order'} received!`,
        timestamp: new Date()
      });
      console.log('📡 Socket event emitted: newOrder');
    }
    
    // Atomically decrement product stock to avoid overselling.
    const stockUpdates = [];
    for (const item of cart.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true, select: '_id stock' }
      );

      if (!updatedProduct) {
        // Roll back previous decrements in this order attempt.
        for (const prev of stockUpdates) {
          await Product.findByIdAndUpdate(prev.productId, { $inc: { stock: prev.deltaBack } });
        }
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }

      stockUpdates.push({
        productId: String(updatedProduct._id),
        stock: updatedProduct.stock,
        deltaBack: item.quantity,
        isOutOfStock: updatedProduct.stock <= 0
      });
    }
    
    // Apply points redemption immediately (reserve points)
    if (pointsRedeemed > 0) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { loyaltyPoints: -pointsRedeemed } });
    }

    // Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    cart.totalItems = 0;
    await cart.save();

    emitStockUpdates(
      req,
      stockUpdates.map(({ productId, stock, isOutOfStock }) => ({ productId, stock, isOutOfStock }))
    );
    
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/myorders
// @desc    Get current user orders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order belongs to user or user is admin
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { orderStatus } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.orderStatus = orderStatus;
    // Keep legacy `status` in sync for older codepaths/admin queries
    if (orderStatus === 'processing') order.status = 'pending';
    if (orderStatus === 'confirmed') order.status = 'confirmed';
    if (orderStatus === 'shipped') order.status = 'shipped';
    if (orderStatus === 'delivered') order.status = 'delivered';
    if (orderStatus === 'cancelled') order.status = 'cancelled';
    
    if (orderStatus === 'delivered') {
      order.deliveredAt = new Date();
    }
    
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/pay
// @desc    Update order payment status
// @access  Private
router.put('/:id/pay', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    order.paymentStatus = 'paid';
    
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/all
// @desc    Get all orders
// @access  Private/Admin
router.get('/all', protect, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if order can be cancelled
    if (!['processing', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }
    
    // Restore product stock
    const stockUpdates = [];
    for (const item of order.orderItems) {
      const updatedProduct = await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      }, { new: true, select: '_id stock' });
      if (updatedProduct) {
        stockUpdates.push({
          productId: String(updatedProduct._id),
          stock: updatedProduct.stock,
          isOutOfStock: updatedProduct.stock <= 0
        });
      }
    }
    
    // Update order status
    order.orderStatus = 'cancelled';
    order.status = 'cancelled';
    order.tracking = order.tracking || {};
    order.tracking.updates = order.tracking.updates || [];
    order.tracking.updates.push({
      status: 'cancelled',
      description: 'Order cancelled by customer',
      timestamp: new Date()
    });
    
    const updatedOrder = await order.save();
    emitStockUpdates(req, stockUpdates);
    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders/:id/reorder
// @desc    Reorder from previous order
// @access  Private
router.post('/:id/reorder', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Add items from order to cart
    for (const item of order.orderItems) {
      const existingItem = cart.items.find(
        ci => ci.product.toString() === item.product.toString()
      );
      
      if (existingItem) {
        existingItem.quantity += item.quantity;
        existingItem.totalPrice = existingItem.quantity * existingItem.price;
      } else {
        cart.items.push({
          product: item.product,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          image: item.image
        });
      }
    }
    
    // Recalculate cart totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete order
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    console.log('🗑️ Delete order request:', req.params.id);
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      console.log('❌ Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      console.log('❌ Not authorized - user mismatch');
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    console.log('✅ Order found, user authorized');
    
    // Restore product stock if order was confirmed/processing
    if (['processing', 'confirmed'].includes(order.orderStatus)) {
      console.log('🔄 Restoring stock for', order.orderItems.length, 'items');
      const stockUpdates = [];
      for (const item of order.orderItems) {
        try {
          const updatedProduct = await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
          }, { new: true, select: '_id stock' });
          if (updatedProduct) {
            stockUpdates.push({
              productId: String(updatedProduct._id),
              stock: updatedProduct.stock,
              isOutOfStock: updatedProduct.stock <= 0
            });
          }
          console.log('✅ Stock restored for product:', item.product);
        } catch (stockError) {
          console.error('❌ Stock restore error:', stockError.message);
        }
      }
      emitStockUpdates(req, stockUpdates);
    }
    
    // Delete the order
    await Order.findByIdAndDelete(req.params.id);
    console.log('✅ Order deleted successfully');
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('❌ Delete order error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;
