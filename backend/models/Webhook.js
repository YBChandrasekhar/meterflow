const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  events: [{ type: String, enum: ['rate_limit_exceeded', 'billing_threshold', 'key_revoked'] }],
  secret: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Webhook', webhookSchema);
