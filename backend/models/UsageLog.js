const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey', required: true },
  apiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Api', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  statusCode: { type: Number, required: true },
  latency: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

usageLogSchema.index({ userId: 1, timestamp: -1 });
usageLogSchema.index({ apiKeyId: 1, timestamp: -1 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
