const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['membership', 'delivery'],
    default: 'membership'
  },
  planType: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
  },
  planName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'active', 'paused', 'cancelled', 'expired'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  nextDeliveryDate: {
    type: Date
  },
  deliverySchedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    daysOfWeek: [String], // For weekly: ['monday', 'wednesday', 'friday']
    timeSlot: {
      type: String,
      enum: ['6-7am', '7-8am', '8-9am']
    }
  },
  // Delivery controls (delivery subscriptions)
  skipDates: [Date], // specific dates to skip
  vacation: {
    from: Date,
    to: Date
  },
  pausedAt: Date,
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  duration: {
    type: String,
    required: true
  },
  deliveryAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'online', 'subscription']
  },
  transactionId: String,
  paymentNotes: String,
  adminNotes: String,
  autoRenewal: {
    type: Boolean,
    default: true
  },
  pauseReason: String,
  cancelReason: String,
  deliveryHistory: [{
    date: Date,
    status: {
      type: String,
      enum: ['delivered', 'skipped', 'failed']
    },
    notes: String
  }],
  metadata: {
    source: {
      type: String,
      default: 'website'
    },
    campaign: String,
    referralCode: String
  }
}, {
  timestamps: true
});

// Calculate next delivery date based on plan type
subscriptionSchema.methods.calculateNextDeliveryDate = function() {
  const now = new Date();
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isInVacation = (date) => {
    const from = this.vacation?.from ? new Date(this.vacation.from) : null;
    const to = this.vacation?.to ? new Date(this.vacation.to) : null;
    if (!from || !to) return false;
    const d = date.getTime();
    return d >= from.getTime() && d <= to.getTime();
  };

  const isSkipped = (date) => {
    const list = Array.isArray(this.skipDates) ? this.skipDates : [];
    return list.some((d) => d && isSameDay(new Date(d), date));
  };

  const nextByPlanType = (fromDate) => {
    const nextDate = new Date(fromDate);
    switch (this.planType) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        return nextDate;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        return nextDate;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        return nextDate;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        return nextDate;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        return nextDate;
      default:
        nextDate.setDate(nextDate.getDate() + 1);
        return nextDate;
    }
  };

  const nextByDeliverySchedule = (fromDate) => {
    const schedule = this.deliverySchedule || {};
    const freq = schedule.frequency || 'daily';
    const nextDate = new Date(fromDate);

    if (freq === 'weekly' && Array.isArray(schedule.daysOfWeek) && schedule.daysOfWeek.length) {
      const dayMap = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
      };
      const allowed = new Set(
        schedule.daysOfWeek
          .map((d) => String(d || '').toLowerCase())
          .filter((d) => d in dayMap)
          .map((d) => dayMap[d])
      );
      // advance at least 1 day
      for (let i = 1; i <= 14; i++) {
        const candidate = new Date(fromDate);
        candidate.setDate(candidate.getDate() + i);
        if (allowed.has(candidate.getDay())) return candidate;
      }
      // fallback
      nextDate.setDate(nextDate.getDate() + 7);
      return nextDate;
    }

    if (freq === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
      return nextDate;
    }

    // default daily
    nextDate.setDate(nextDate.getDate() + 1);
    return nextDate;
  };

  // Base candidate for next delivery:
  // - delivery subscription uses deliverySchedule when present
  // - otherwise fall back to planType
  let candidate =
    this.type === 'delivery' ? nextByDeliverySchedule(now) : nextByPlanType(now);

  // Avoid vacation/skip dates by advancing until valid (cap to prevent infinite loops)
  for (let i = 0; i < 60; i++) {
    if (!isInVacation(candidate) && !isSkipped(candidate)) return candidate;
    candidate = this.type === 'delivery' ? nextByDeliverySchedule(candidate) : nextByPlanType(candidate);
  }

  return candidate;
};

// Calculate end date for membership subscriptions
subscriptionSchema.methods.calculateEndDate = function() {
  const now = new Date();
  let endDate = new Date(now);
  
  switch (this.planType) {
    case 'daily':
      endDate.setDate(endDate.getDate() + 1);
      break;
    case 'weekly':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'quarterly':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
  }
  
  return endDate;
};

// Check if subscription is active
subscriptionSchema.methods.isActive = function() {
  if (this.status !== 'active' || this.paymentStatus !== 'paid') {
    return false;
  }
  
  if (this.type === 'membership' && this.endDate) {
    return new Date() <= this.endDate;
  }
  
  return true;
};

// Set initial next delivery date and pricing
subscriptionSchema.pre('save', function(next) {
  // Generate subscription ID if not present
  if (this.isNew && !this.subscriptionId) {
    this.subscriptionId = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  // Set next delivery date for delivery subscriptions
  if (this.isNew && this.type === 'delivery' && !this.nextDeliveryDate) {
    this.nextDeliveryDate = this.calculateNextDeliveryDate();
  }
  
  // Set end date for membership subscriptions
  if (this.isNew && this.type === 'membership' && !this.endDate) {
    this.endDate = this.calculateEndDate();
  }
  
  // Set pricing based on plan type
  if (this.isNew && !this.pricing.basePrice) {
    const prices = {
      daily: 29,
      weekly: 189,
      monthly: this.type === 'membership' ? 299 : 799,
      quarterly: 799,
      yearly: 2499
    };
    this.pricing.basePrice = prices[this.planType];
    this.pricing.totalAmount = prices[this.planType];
  }
  
  // Set duration based on plan type
  if (this.isNew && !this.duration) {
    const durations = {
      monthly: '30 days',
      quarterly: '90 days',
      yearly: '365 days',
      daily: '1 day',
      weekly: '7 days'
    };
    this.duration = durations[this.planType];
  }
  
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
