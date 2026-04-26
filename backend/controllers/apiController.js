const Api = require('../models/Api');
const ApiKey = require('../models/ApiKey');

const createApi = async (req, res) => {
  try {
    const { name, description, baseUrl, rateLimit } = req.body;
    const api = await Api.create({ userId: req.user.id, name, description, baseUrl, rateLimit });
    const apiKey = await ApiKey.create({ apiId: api._id, userId: req.user.id, label: 'Default Key' });
    res.status(201).json({ api, apiKey });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyApis = async (req, res) => {
  try {
    const apis = await Api.find({ userId: req.user.id });
    res.json(apis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getApiById = async (req, res) => {
  try {
    const api = await Api.findOne({ _id: req.params.id, userId: req.user.id });
    if (!api) return res.status(404).json({ message: 'API not found' });
    res.json(api);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateApi = async (req, res) => {
  try {
    const api = await Api.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!api) return res.status(404).json({ message: 'API not found' });
    res.json(api);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteApi = async (req, res) => {
  try {
    const api = await Api.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!api) return res.status(404).json({ message: 'API not found' });
    await ApiKey.updateMany({ apiId: req.params.id }, { status: 'revoked' });
    res.json({ message: 'API deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const generateKey = async (req, res) => {
  try {
    const api = await Api.findOne({ _id: req.params.id, userId: req.user.id });
    if (!api) return res.status(404).json({ message: 'API not found' });
    const apiKey = await ApiKey.create({ apiId: api._id, userId: req.user.id, label: req.body.label || 'New Key' });
    res.status(201).json(apiKey);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ apiId: req.params.id, userId: req.user.id });
    res.json(keys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const revokeKey = async (req, res) => {
  try {
    const key = await ApiKey.findOneAndUpdate(
      { _id: req.params.keyId, userId: req.user.id },
      { status: 'revoked' },
      { new: true }
    );
    if (!key) return res.status(404).json({ message: 'Key not found' });
    res.json({ message: 'Key revoked', key });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const rotateKey = async (req, res) => {
  try {
    const oldKey = await ApiKey.findOneAndUpdate(
      { _id: req.params.keyId, userId: req.user.id, status: 'active' },
      { status: 'rotated' },
      { new: true }
    );
    if (!oldKey) return res.status(404).json({ message: 'Active key not found' });
    const newKey = await ApiKey.create({ apiId: oldKey.apiId, userId: req.user.id, label: oldKey.label + ' (rotated)' });
    res.json({ message: 'Key rotated', newKey });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createApi, getMyApis, getApiById, updateApi, deleteApi, generateKey, getApiKeys, revokeKey, rotateKey };
