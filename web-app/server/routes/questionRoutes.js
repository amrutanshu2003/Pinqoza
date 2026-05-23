const express = require('express');
const Question = require('../models/Question');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/questions/product/:productId
// @desc    Get all questions for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    console.log('Fetching questions for product:', req.params.productId);
    const questions = await Question.find({ product: req.params.productId })
      .populate('user', 'name')
      .populate('answers.user', 'name')
      .sort({ createdAt: -1 });
    
    console.log('Found questions:', questions.length);
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions
// @desc    Ask a question
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { productId, question } = req.body;
    console.log('Received question submission:', { productId, question, user: req.user._id });
    
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
    
    console.log('Question saved to database:', newQuestion._id);
    await newQuestion.populate('user', 'name');
    
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error saving question:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions/:id/answer
// @desc    Answer a question (admin only for now, or any authenticated user can answer)
// @access  Private
router.post('/:id/answer', protect, async (req, res) => {
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
    
    // Add answer
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

// @route   GET /api/questions/my-questions
// @desc    Get current user's questions
// @access  Private
router.get('/my-questions', protect, async (req, res) => {
  try {
    const questions = await Question.find({ user: req.user._id })
      .populate('product', 'name image')
      .sort({ createdAt: -1 });
    
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question (only by question owner or admin)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Check if user is question owner or admin
    if (question.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this question' });
    }
    
    await question.deleteOne();
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/questions/all
// @desc    Get all questions (admin only)
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
  try {
    const questions = await Question.find({})
      .populate('product', 'name')
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/questions/unanswered
// @desc    Get unanswered questions (admin only)
// @access  Private/Admin
router.get('/unanswered', protect, admin, async (req, res) => {
  try {
    const questions = await Question.find({ isAnswered: false })
      .populate('product', 'name')
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
