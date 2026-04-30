const { Queue, Worker } = require('bullmq');
const UsageLog = require('../models/UsageLog');
const Billing = require('../models/Billing');
const User = require('../models/User');

const getConnection = () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
      password: parsed.password || undefined,
      tls: url.startsWith('rediss') ? {} : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  } catch {
    return { host: 'localhost', port: 6379, maxRetriesPerRequest: null, enableReadyCheck: false };
  }
};

const connection = getConnection();

const PRICING = {
  free: { freeRequests: 1000, pricePerHundred: 0 },
  pro: { freeRequests: 1000, pricePerHundred: 0.5 },
};

const billingQueue = new Queue('billing', { connection });

const startBillingWorker = () => {
  new Worker('billing', async (job) => {
    const { month } = job.data;
    const [year, mon] = month.split('-');
    const from = new Date(year, mon - 1, 1);
    const to = new Date(year, mon, 1);

    const users = await User.find({});
    for (const user of users) {
      const totalRequests = await UsageLog.countDocuments({
        userId: user._id,
        timestamp: { $gte: from, $lt: to }
      });

      const pricing = PRICING[user.plan] || PRICING.free;
      const billableRequests = Math.max(0, totalRequests - pricing.freeRequests);
      const amount = (billableRequests / 100) * pricing.pricePerHundred;

      await Billing.findOneAndUpdate(
        { userId: user._id, month },
        { totalRequests, billableRequests, amount, plan: user.plan },
        { upsert: true }
      );
    }
    console.log(`Billing job completed for ${month}`);
  }, { connection });
};

const scheduleBillingJob = async () => {
  const month = new Date().toISOString().slice(0, 7);
  await billingQueue.add('calculate', { month }, { jobId: `billing-${month}` });
};

module.exports = { billingQueue, startBillingWorker, scheduleBillingJob };
