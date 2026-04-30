const axios = require('axios');
const crypto = require('crypto');
const Webhook = require('../models/Webhook');

const triggerWebhook = async (userId, event, payload) => {
  try {
    const webhooks = await Webhook.find({ userId, events: event, isActive: true });
    for (const wh of webhooks) {
      const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
      const signature = crypto.createHmac('sha256', wh.secret).update(body).digest('hex');
      axios.post(wh.url, JSON.parse(body), {
        headers: { 'X-MeterFlow-Signature': signature, 'Content-Type': 'application/json' },
        timeout: 5000,
      }).catch(console.error);
    }
  } catch (err) {
    console.error('Webhook trigger error:', err.message);
  }
};

module.exports = { triggerWebhook };
