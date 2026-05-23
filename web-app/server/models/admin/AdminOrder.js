const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminProduct'
  },
  name: String,
  price: Number,
  quantity: Number,
  unit: String
});

const adminOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  orderId: {
    type: String,
    unique: true
  },
  items: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    default: 0
  },
  orderStatus: {
    type: String,
    enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  paymentMethod: {
    type: String,
    default: 'cod'
  },
  isPaid: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminOrder', adminOrderSchema);
