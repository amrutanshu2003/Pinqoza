const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from server/.env first, then fallback to workspace root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const connectAdminDB = require('./config/adminDb');
const Question = require('./models/Question');
const { protect } = require('./middleware/auth');

// Connect to main database
connectDB();

// Connect to admin database
connectAdminDB();

const app = express();

// Middleware
const allowedOrigins = String(process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS blocked'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '12mb' }));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
// Temporarily disable old subscription routes
// app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/simple-subscription', require('./routes/simpleSubscriptionRoutes'));

// Q&A Routes - Directly defined here
app.get('/api/questions/product/:productId', async (req, res) => {
  try {
    const questions = await Question.find({ product: req.params.productId })
      .populate('user', 'name')
      .populate('answers.user', 'name')
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/questions', protect, async (req, res) => {
  try {
    const { productId, question } = req.body;
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ message: 'Question is required' });
    }
    const newQuestion = await Question.create({
      product: productId,
      user: req.user._id,
      name: req.user.name,
      question: question.trim(),
      answers: []
    });
    await newQuestion.populate('user', 'name');
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/questions/:id/answer', protect, async (req, res) => {
  try {
    const { answer } = req.body;
    const questionId = req.params.id;
    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({ message: 'Answer is required' });
    }
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    question.answers.push({
      user: req.user._id,
      name: req.user.name,
      answer: answer.trim(),
      isAdmin: req.user.isAdmin || false
    });
    question.isAnswered = true;
    await question.save();
    await question.populate('answers.user', 'name');
    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/questions/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    if (question.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await question.deleteOne();
    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes (separate database)
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pinqoza API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Payload too large. Please upload a smaller image.' });
  }
  res.status(500).json({ message: 'Something went wrong!' });
});

const { initializeSocket, getIo } = require('./socket');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize socket.io
const io = initializeSocket(server);

// Store io in app for use in routes
app.set('io', io);
console.log('✅ Socket.io initialized and stored in app');
