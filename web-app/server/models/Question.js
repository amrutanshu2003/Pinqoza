const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const questionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answers: [answerSchema],
  isAnswered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
questionSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);
