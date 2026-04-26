const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const apiKeySchema = new mongoose.Schema({
  apiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Api', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, default: () => `mf_${uuidv4().replace(/-/g, '')}`, unique: true },
  status: { type: String, enum: ['active', 'revoked', 'rotated'], default: 'active' },
  label: { type: String, default: 'Default Key' },
}, { timestamps: true });

module.exports = mongoose.model('ApiKey', apiKeySchema);
