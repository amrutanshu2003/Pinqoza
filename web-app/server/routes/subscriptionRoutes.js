const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const { protect } = require('../middleware/auth');

// Get user subscriptions
router.get('/', protect, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .populate('deliveryAddress')
      .sort({ createdAt: -1 });
    
    res.json(subscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new subscription
router.post('/', protect, async (req, res) => {
  try {
    const { 
      type, 
      planType, 
      planName, 
      deliveryAddress, 
      paymentMethod,
      pricing,
      plan,
      price
    } = req.body;
    
    // Validate required fields
    console.log('🔍 Received subscription data:', req.body);
    if (!type || !planType || !planName || !paymentMethod) {
      console.log('❌ Validation failed - missing fields:', { type, planType, planName, paymentMethod });
      return res.status(400).json({ 
        message: 'Type, plan type, plan name, and payment method are required',
        missing: { type, planType, planName, paymentMethod }
      });
    }
    
    // For delivery subscriptions, address is required
    if (type === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ 
        message: 'Delivery address is required for delivery subscriptions' 
      });
    }
    
    // Check if user already has an active membership subscription
    if (type === 'membership') {
      const existingMembership = await Subscription.findOne({
        user: req.user.id,
        type: 'membership',
        status: { $in: ['active', 'paused', 'pending'] }
      });
      
      if (existingMembership) {
        return res.status(400).json({ 
          message: 'You already have an active membership subscription' 
        });
      }
    }
    
    // Extract price from plan object or price field
    const subscriptionPrice = price || (plan && plan.price) || (pricing && pricing.totalAmount);
    
    // Create new subscription
    const subscription = new Subscription({
      user: req.user.id,
      type,
      planType,
      planName,
      deliveryAddress,
      paymentMethod,
      pricing: {
        basePrice: subscriptionPrice,
        totalAmount: subscriptionPrice
      },
      plan: plan || {}
    });
    
    // Add delivery schedule for delivery subscriptions
    if (type === 'delivery') {
      subscription.deliverySchedule = {
        frequency: planType,
        timeSlot: '6-7am' // Default time slot
      };
    }
    
    await subscription.save();
    
    // Populate user and address details
    if (deliveryAddress) {
      await subscription.populate('deliveryAddress');
    }
    
    res.status(201).json(subscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update subscription
router.put('/:id', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    const { deliveryAddress, paymentMethod, autoRenewal } = req.body;
    
    if (deliveryAddress) subscription.deliveryAddress = deliveryAddress;
    if (paymentMethod) subscription.paymentMethod = paymentMethod;
    if (autoRenewal !== undefined) subscription.autoRenewal = autoRenewal;
    
    await subscription.save();
    await subscription.populate('deliveryAddress');
    
    res.json(subscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pause subscription
router.put('/:id/pause', protect, async (req, res) => {
  try {
    const { pauseReason } = req.body;
    
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: 'active'
    });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Active subscription not found' });
    }
    
    subscription.status = 'paused';
    subscription.pausedAt = new Date();
    subscription.pauseReason = pauseReason;
    
    await subscription.save();
    
    res.json({ message: 'Subscription paused successfully', subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resume subscription
router.put('/:id/resume', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: 'paused'
    });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Paused subscription not found' });
    }
    
    subscription.status = 'active';
    subscription.pausedAt = undefined;
    subscription.pauseReason = undefined;
    subscription.nextDeliveryDate = subscription.calculateNextDeliveryDate();
    
    await subscription.save();
    
    res.json({ message: 'Subscription resumed successfully', subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update delivery schedule (delivery subscriptions)
router.put('/:id/schedule', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'delivery'
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Delivery subscription not found' });
    }

    const { frequency, daysOfWeek, timeSlot } = req.body || {};

    subscription.deliverySchedule = subscription.deliverySchedule || {};
    if (frequency) subscription.deliverySchedule.frequency = frequency;
    if (Array.isArray(daysOfWeek)) subscription.deliverySchedule.daysOfWeek = daysOfWeek;
    if (timeSlot) subscription.deliverySchedule.timeSlot = timeSlot;

    subscription.nextDeliveryDate = subscription.calculateNextDeliveryDate();
    await subscription.save();

    res.json({ message: 'Delivery schedule updated', subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set vacation mode (delivery subscriptions)
router.put('/:id/vacation', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'delivery'
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Delivery subscription not found' });
    }

    const { from, to } = req.body || {};
    if (!from || !to) {
      return res.status(400).json({ message: 'from and to are required' });
    }

    subscription.vacation = { from: new Date(from), to: new Date(to) };
    subscription.nextDeliveryDate = subscription.calculateNextDeliveryDate();
    await subscription.save();

    res.json({ message: 'Vacation mode updated', subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear vacation mode
router.delete('/:id/vacation', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'delivery'
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Delivery subscription not found' });
    }

    subscription.vacation = { from: undefined, to: undefined };
    subscription.nextDeliveryDate = subscription.calculateNextDeliveryDate();
    await subscription.save();

    res.json({ message: 'Vacation cleared', subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Skip a delivery date (delivery subscriptions)
router.post('/:id/skip', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'delivery'
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Delivery subscription not found' });
    }

    const { date } = req.body || {};
    if (!date) return res.status(400).json({ message: 'date is required' });

    subscription.skipDates = subscription.skipDates || [];
    subscription.skipDates.push(new Date(date));
    subscription.nextDeliveryDate = subscription.calculateNextDeliveryDate();
    await subscription.save();

    res.json({ message: 'Delivery skipped', subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel subscription
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { cancelReason } = req.body;
    
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id,
      status: { $in: ['active', 'paused'] }
    });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    subscription.status = 'cancelled';
    subscription.cancelReason = cancelReason;
    subscription.endDate = new Date();
    subscription.autoRenewal = false;
    
    await subscription.save();
    
    res.json({ message: 'Subscription cancelled successfully', subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get subscription details
router.get('/:id', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('deliveryAddress');
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    res.json(subscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add delivery record
router.post('/:id/delivery', protect, async (req, res) => {
  try {
    const { date, status, notes } = req.body;
    
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    // Add delivery to history
    subscription.deliveryHistory.push({
      date: new Date(date),
      status,
      notes
    });
    
    // Update next delivery date if delivered
    if (status === 'delivered') {
      subscription.nextDeliveryDate = subscription.calculateNextDeliveryDate();
    }
    
    await subscription.save();
    
    res.json({ message: 'Delivery recorded successfully', subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get subscription by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('deliveryAddress').populate('user', 'name email phone');
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    res.json(subscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's active membership
router.get('/membership/active', protect, async (req, res) => {
  try {
    const membership = await Subscription.findOne({
      user: req.user.id,
      type: 'membership',
      status: { $in: ['active', 'pending'] },
      paymentStatus: 'paid'
    }).sort({ createdAt: -1 });
    
    res.json(membership);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
