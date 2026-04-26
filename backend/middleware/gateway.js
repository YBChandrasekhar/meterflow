const ApiKey = require('../models/ApiKey');
const Api = require('../models/Api');
const UsageLog = require('../models/UsageLog');
const redis = require('../config/redis');
const axios = require('axios');

const gateway = async (req, res) => {
  const start = Date.now();
  const keyValue = req.headers['x-api-key'];

  if (!keyValue)
    return res.status(401).json({ message: 'API key required' });

  // 1. Validate API key
  const apiKey = await ApiKey.findOne({ key: keyValue, status: 'active' }).populate('apiId');
  if (!apiKey || !apiKey.apiId?.isActive)
    return res.status(401).json({ message: 'Invalid or inactive API key' });

  const api = apiKey.apiId;

  // 2. Rate limiting via Redis
  const redisKey = `rate:${keyValue}`;
  const requests = await redis.incr(redisKey);
  if (requests === 1) await redis.expire(redisKey, 60); // 1 minute window

  if (requests > api.rateLimit / 60) {
    return res.status(429).json({ message: 'Rate limit exceeded' });
  }

  // 3. Forward request to actual API
  const targetUrl = `${api.baseUrl}/${req.params.path || ''}`;
  let statusCode = 500;
  let responseData;

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      params: req.query,
      data: req.body,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    statusCode = response.status;
    responseData = response.data;
  } catch (err) {
    statusCode = err.response?.status || 500;
    responseData = err.response?.data || { message: 'Gateway error' };
  }

  const latency = Date.now() - start;

  // 4. Log usage asynchronously
  UsageLog.create({
    apiKeyId: apiKey._id,
    apiId: api._id,
    userId: apiKey.userId,
    endpoint: req.params.path || '//',
    method: req.method,
    statusCode,
    latency,
  }).catch(console.error);

  res.status(statusCode).json(responseData);
};

module.exports = gateway;
