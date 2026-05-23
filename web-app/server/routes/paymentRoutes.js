const express = require('express');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { protect } = require('../middleware/admin/auth');

const router = express.Router();

// @route   GET /api/admin/payment/test
// @desc    Test endpoint to check all orders (DEBUG ONLY)
// @access  Private/Admin
router.get('/test', protect, async (req, res) => {
  try {
    const allOrders = await Order.find({}).sort({ createdAt: -1 }).limit(10).select('paymentMethod paymentStatus status orderPlaced totalPrice createdAt');
    const orderCount = await Order.countDocuments();
    
    // Count by status
    const onlinePending = await Order.countDocuments({ paymentMethod: 'online', paymentStatus: 'pending' });
    const codPending = await Order.countDocuments({ paymentMethod: 'cod', status: 'pending_confirmation' });
    const allPending = await Order.countDocuments({ status: 'pending' });
    
    res.json({
      totalOrders: orderCount,
      onlinePending,
      codPending,
      allPending,
      recentOrders: allOrders
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/payment/pending
// @desc    Get all pending payments/orders awaiting confirmation
// @access  Private/Admin
router.get('/pending', protect, async (req, res) => {
  try {
    console.log('🔍 Fetching pending payments...');
    
    // Get online payments pending verification
    // More flexible query - check for online/upi payment methods
    const onlineQuery = {
      $or: [
        { paymentMethod: 'online', paymentStatus: 'pending', status: 'pending' },
        { paymentMethod: 'upi', paymentStatus: 'pending', status: 'pending' }
      ]
    };
    console.log('📱 Online query:', JSON.stringify(onlineQuery));
    
    const onlineOrders = await Order.find(onlineQuery).populate('user', 'name email phone');
    console.log(`✅ Found ${onlineOrders.length} online orders pending verification`);

    // Get COD orders pending confirmation
    const codQuery = {
      paymentMethod: 'cod',
      $or: [
        { status: 'pending_confirmation', orderPlaced: false },
        { status: 'pending', orderPlaced: false }
      ]
    };
    console.log('💰 COD query:', JSON.stringify(codQuery));
    
    const codOrders = await Order.find(codQuery).populate('user', 'name email phone');
    console.log(`✅ Found ${codOrders.length} COD orders pending confirmation`);
    
    // Debug: Show all recent orders with their status
    const allRecentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(5).select('paymentMethod paymentStatus status orderPlaced createdAt');
    console.log('📊 Recent orders for debugging:', allRecentOrders);

    // Format for admin panel
    const pendingPayments = [
      ...onlineOrders.map(order => ({
        _id: order._id,
        orderId: order._id,
        user: order.user,
        amount: order.totalPrice,
        paymentMethod: 'online',
        status: 'pending_verification',
        items: order.orderItems,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt
      })),
      ...codOrders.map(order => ({
        _id: order._id,
        orderId: order._id,
        user: order.user,
        amount: order.totalPrice,
        paymentMethod: 'cod',
        status: 'pending_confirmation',
        items: order.orderItems,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt
      }))
    ];

    res.json(pendingPayments);
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/payment/verify/:orderId
// @desc    Verify online payment and confirm order
// @access  Private/Admin
router.post('/verify/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { transactionId, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.status = 'confirmed';
    order.orderPlaced = true;
    order.paymentDetails = {
      transactionId: transactionId || `MANUAL_${Date.now()}`,
      verifiedBy: req.admin._id,
      verifiedAt: new Date(),
      notes: notes || 'Payment verified by admin'
    };

    await order.save();

    // Mark coupon used + award loyalty points (once)
    if (!order.loyaltyAwarded) {
      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          { code: order.couponCode },
          { $inc: { usedCount: 1 } }
        );
      }
      const earn = Math.floor((order.finalPrice || order.totalPrice || 0) / 100);
      if (earn > 0) {
        await User.findByIdAndUpdate(order.user, { $inc: { loyaltyPoints: earn } });
        order.pointsEarned = earn;
      }
      order.loyaltyAwarded = true;
      await order.save();
    }

    // Emit real-time notification to user
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.user}`).emit('paymentVerified', {
        orderId: order._id,
        message: 'Your payment has been verified and order confirmed!',
        status: 'confirmed',
        paymentMethod: 'online',
        amount: order.totalPrice
      });
    }

    res.json({
      success: true,
      message: 'Payment verified and order confirmed',
      order
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/payment/confirm/:orderId
// @desc    Confirm COD order
// @access  Private/Admin
router.post('/confirm/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentMethod !== 'cod') {
      return res.status(400).json({ message: 'This endpoint is for COD orders only' });
    }

    // Update order status
    order.orderStatus = 'confirmed';
    order.status = 'confirmed';
    order.orderPlaced = true;
    order.paymentStatus = 'pending'; // Will be collected on delivery
    order.confirmationDetails = {
      confirmedBy: req.admin._id,
      confirmedAt: new Date(),
      notes: notes || 'Order confirmed by admin'
    };

    await order.save();

    // Mark coupon used + award loyalty points (once)
    if (!order.loyaltyAwarded) {
      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          { code: order.couponCode },
          { $inc: { usedCount: 1 } }
        );
      }
      const earn = Math.floor((order.finalPrice || order.totalPrice || 0) / 100);
      if (earn > 0) {
        await User.findByIdAndUpdate(order.user, { $inc: { loyaltyPoints: earn } });
        order.pointsEarned = earn;
      }
      order.loyaltyAwarded = true;
      await order.save();
    }

    // Emit real-time notification to user
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.user}`).emit('orderConfirmed', {
        orderId: order._id,
        message: 'Your order has been confirmed and placed successfully!',
        status: 'confirmed',
        paymentMethod: 'cod',
        amount: order.totalPrice
      });
    }

    res.json({
      success: true,
      message: 'Order confirmed successfully',
      order
    });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/payment/reject/:orderId
// @desc    Reject/Cancel order
// @access  Private/Admin
router.post('/reject/:orderId', protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Restore stock
    const Product = require('../models/Product');
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
    order.cancellationDetails = {
      cancelledBy: req.admin._id,
      cancelledAt: new Date(),
      reason: reason || 'Order rejected by admin'
    };

    await order.save();

    // Notify user
    const io = req.app.get('io');
    if (io) {
      io.emit('productsStockUpdated', {
        updates: stockUpdates,
        timestamp: new Date()
      });
      io.to(`user_${order.user}`).emit('orderCancelled', {
        orderId: order._id,
        message: `Your order has been cancelled. Reason: ${reason || 'Rejected by admin'}`,
        reason: reason || 'Rejected by admin'
      });
    }

    res.json({
      success: true,
      message: 'Order rejected and stock restored',
      order
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
