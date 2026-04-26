const mongoose = require('mongoose');

const apiSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  baseUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  rateLimit: { type: Number, default: 1000 },
}, { timestamps: true });

module.exports = mongoose.model('Api', apiSchema);
