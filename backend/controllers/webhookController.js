const Webhook = require('../models/Webhook');
const crypto = require('crypto');

const createWebhook = async (req, res) => {
  try {
    const { url, events } = req.body;
    const secret = crypto.randomBytes(32).toString('hex');
    const webhook = await Webhook.create({ userId: req.user.id, url, events, secret });
    res.status(201).json(webhook);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getWebhooks = async (req, res) => {
  try {
    const webhooks = await Webhook.find({ userId: req.user.id });
    res.json(webhooks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteWebhook = async (req, res) => {
  try {
    await Webhook.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Webhook deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toggleWebhook = async (req, res) => {
  try {
    const wh = await Webhook.findOne({ _id: req.params.id, userId: req.user.id });
    if (!wh) return res.status(404).json({ message: 'Webhook not found' });
    wh.isActive = !wh.isActive;
    await wh.save();
    res.json(wh);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createWebhook, getWebhooks, deleteWebhook, toggleWebhook };
