const express = require('express');
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

const calcDiscount = ({ coupon, amount }) => {
  if (!coupon || !coupon.isActive) return 0;
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) return 0;
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return 0;
  if (amount < (coupon.minOrderAmount || 0)) return 0;

  let discount = 0;
  if (coupon.discountType === 'fixed') discount = coupon.value;
  else discount = (amount * coupon.value) / 100;

  if (coupon.maxDiscountAmount > 0) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }

  return Math.max(0, Math.floor(discount));
};

// @route   POST /api/coupons/validate
// @desc    Validate coupon code for a given amount
// @access  Private
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, amount } = req.body || {};
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const total = Number(amount);
    if (!Number.isFinite(total) || total < 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon' });

    const discount = calcDiscount({ coupon, amount: total });
    if (discount <= 0) return res.status(400).json({ message: 'Coupon not applicable' });

    res.json({
      code: coupon.code,
      description: coupon.description,
      discountAmount: discount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Admin CRUD (basic)
 */
router.get('/', protect, admin, async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.code) return res.status(400).json({ message: 'code is required' });

    const coupon = await Coupon.create({
      code: String(payload.code).trim().toUpperCase(),
      description: payload.description || '',
      discountType: payload.discountType || 'percent',
      value: payload.value,
      minOrderAmount: payload.minOrderAmount || 0,
      maxDiscountAmount: payload.maxDiscountAmount || 0,
      usageLimit: payload.usageLimit || 0,
      usedCount: 0,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true
    });

    res.status(201).json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

    const payload = req.body || {};
    if (payload.code) coupon.code = String(payload.code).trim().toUpperCase();
    if (payload.description !== undefined) coupon.description = payload.description;
    if (payload.discountType) coupon.discountType = payload.discountType;
    if (payload.value !== undefined) coupon.value = payload.value;
    if (payload.minOrderAmount !== undefined) coupon.minOrderAmount = payload.minOrderAmount;
    if (payload.maxDiscountAmount !== undefined) coupon.maxDiscountAmount = payload.maxDiscountAmount;
    if (payload.usageLimit !== undefined) coupon.usageLimit = payload.usageLimit;
    if (payload.expiresAt !== undefined) coupon.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : undefined;
    if (payload.isActive !== undefined) coupon.isActive = Boolean(payload.isActive);

    await coupon.save();
    res.json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;

