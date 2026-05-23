const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const { protect } = require('../middleware/auth');

// Create subscription (from home page QR flow)
router.post('/', protect, async (req, res) => {
  try {
    console.log('🎯 Simple subscription route called with data:', req.body);

    const { planType, planName, price } = req.body;

    const durations = {
      daily: '1 day',
      weekly: '7 days',
      monthly: '30 days',
      quarterly: '90 days',
      yearly: '365 days'
    };

    // Create subscription in database
    const subscription = new Subscription({
      user: req.user.id,
      subscriptionId: `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      type: 'membership',
      planType,
      planName,
      duration: durations[planType] || '30 days',
      paymentMethod: 'online',
      status: 'pending',
      paymentStatus: 'pending',
      pricing: {
        basePrice: price || 0,
        totalAmount: price || 0
      }
    });

    await subscription.save();

    // Populate user details for notification
    await subscription.populate('user', 'name email phone');

    // Emit real-time notification to admin
    const io = req.app.get('io');
    if (io) {
      io.emit('newSubscription', {
        subscriptionId: subscription._id,
        userId: req.user.id,
        userName: subscription.user?.name || 'Unknown',
        planName: subscription.planName,
        planType: subscription.planType,
        price: subscription.pricing.totalAmount,
        message: `New subscription payment pending for ${subscription.planName}!`,
        timestamp: new Date()
      });
      console.log('📡 Socket event emitted: newSubscription');
    }

    console.log('✅ Simple subscription created:', subscription._id);

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    console.error('Simple subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user subscriptions
router.get('/', protect, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending subscriptions (Admin)
router.get('/admin/pending', protect, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      status: 'pending',
      paymentStatus: 'pending'
    })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching pending subscriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm subscription payment (Admin)
router.post('/admin/confirm/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const subscription = await Subscription.findById(id).populate('user', 'name email');

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Update subscription status
    subscription.status = 'active';
    subscription.paymentStatus = 'paid';
    subscription.adminNotes = notes || '';
    subscription.startDate = new Date();

    // Set end date for membership
    if (subscription.type === 'membership') {
      subscription.endDate = subscription.calculateEndDate();
    }

    await subscription.save();

    // Emit real-time notification to user
    const io = req.app.get('io');
    if (io && subscription.user) {
      const userId = subscription.user._id.toString();
      console.log('📡 Emitting subscriptionConfirmed to user room:', userId);
      console.log('📡 Event payload:', {
        subscriptionId: subscription._id,
        planName: subscription.planName,
        status: 'active'
      });

      // TEMP: Emit globally to test - change back to io.to(userId) after testing
      io.emit('subscriptionConfirmed', {
        subscriptionId: subscription._id,
        planName: subscription.planName,
        status: 'active',
        message: `Your ${subscription.planName} subscription has been activated!`,
        timestamp: new Date(),
        userId: userId // Include userId for client-side filtering
      });
      console.log('✅ Socket event emitted globally (temporarily for testing)');
    } else {
      console.log('❌ Cannot emit socket event - io or subscription.user is missing');
      if (!io) console.log('❌ io is null');
      if (!subscription.user) console.log('❌ subscription.user is null');
    }

    res.json({
      message: 'Subscription confirmed successfully',
      subscription
    });
  } catch (error) {
    console.error('Error confirming subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark subscription payment as failed (Admin)
router.post('/admin/failed/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const subscription = await Subscription.findById(id).populate('user', 'name email');

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Update subscription status to failed
    subscription.status = 'cancelled';
    subscription.paymentStatus = 'failed';
    subscription.adminNotes = notes || 'Payment failed';
    subscription.cancelReason = 'Payment failed';

    await subscription.save();

    // Emit real-time notification to user
    const io = req.app.get('io');
    if (io && subscription.user) {
      const userId = subscription.user._id.toString();
      console.log('📡 Emitting subscriptionFailed to user room:', userId);
      console.log('📡 Event data:', {
        subscriptionId: subscription._id,
        planName: subscription.planName,
        status: 'failed',
        message: `Your ${subscription.planName} subscription payment has failed. Please contact support.`,
        timestamp: new Date(),
        userId: userId
      });

      io.emit('subscriptionFailed', {
        subscriptionId: subscription._id,
        planName: subscription.planName,
        status: 'failed',
        message: `Your ${subscription.planName} subscription payment has failed. Please contact support.`,
        timestamp: new Date(),
        userId: userId
      });
      console.log('✅ Socket event emitted: subscriptionFailed');
    } else {
      console.log('❌ Cannot emit socket event - io or subscription.user is missing');
      if (!io) console.log('❌ io is null');
      if (!subscription.user) console.log('❌ subscription.user is null');
    }

    res.json({
      message: 'Subscription marked as failed successfully',
      subscription
    });
  } catch (error) {
    console.error('Error marking subscription as failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel subscription (User)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Check if user owns this subscription
    if (subscription.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this subscription' });
    }

    // Allow cancelling active and pending subscriptions
    if (subscription.status !== 'active' && subscription.status !== 'pending') {
      return res.status(400).json({ message: 'Only active or pending subscriptions can be cancelled' });
    }

    subscription.status = 'cancelled';
    subscription.cancelReason = 'Cancelled by user';

    await subscription.save();

    // Emit real-time notification to user
    const io = req.app.get('io');
    if (io) {
      io.emit('subscriptionCancelled', {
        subscriptionId: subscription._id,
        userId: req.user.id,
        planName: subscription.planName,
        message: `Your ${subscription.planName} subscription has been cancelled.`,
        timestamp: new Date()
      });
      console.log('📡 Socket event emitted: subscriptionCancelled');
    }

    res.json({
      message: 'Subscription cancelled successfully',
      subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
