const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true },
  totalRequests: { type: Number, default: 0 },
  freeRequests: { type: Number, default: 1000 },
  billableRequests: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
}, { timestamps: true });

billingSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Billing', billingSchema);
