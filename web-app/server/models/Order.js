const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: String,
  image: String
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [orderItemSchema],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'card', 'upi', 'online']
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'failed', 'refunded']
  },
  orderStatus: {
    type: String,
    default: 'processing',
    enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled']
  },
  totalPrice: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  couponCode: {
    type: String,
    default: ''
  },
  pointsRedeemed: {
    type: Number,
    default: 0,
    min: 0
  },
  pointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  finalPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  loyaltyAwarded: {
    type: Boolean,
    default: false
  },
  totalItems: {
    type: Number,
    required: true
  },
  deliveryDate: Date,
  deliveredAt: Date,
  notes: String,
  tracking: {
    trackingNumber: String,
    estimatedDelivery: Date,
    currentLocation: String,
    lastUpdate: Date,
    updates: [{
      status: String,
      location: String,
      description: String,
      timestamp: { type: Date, default: Date.now }
    }]
  },
  // Payment verification details (for online payments)
  paymentDetails: {
    transactionId: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    verifiedAt: Date,
    notes: String
  },
  // Order confirmation details (for COD)
  confirmationDetails: {
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    confirmedAt: Date,
    notes: String
  },
  // Cancellation details
  cancellationDetails: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    cancelledAt: Date,
    reason: String
  },
  // Order placed flag (for COD orders)
  orderPlaced: {
    type: Boolean,
    default: true
  },
  // Status field for consistency with older code
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'pending_confirmation', 'confirmed', 'shipped', 'delivered', 'cancelled']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
