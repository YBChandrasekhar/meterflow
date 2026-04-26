const UsageLog = require('../models/UsageLog');
const Billing = require('../models/Billing');

const PRICING = {
  free: { freeRequests: 1000, pricePerHundred: 0 },
  pro: { freeRequests: 1000, pricePerHundred: 0.5 },
};

const getUsageSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { userId: req.user.id };
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const [total, byStatus, byEndpoint, recentLogs] = await Promise.all([
      UsageLog.countDocuments(filter),
      UsageLog.aggregate([
        { $match: filter },
        { $group: { _id: '$statusCode', count: { $sum: 1 } } }
      ]),
      UsageLog.aggregate([
        { $match: filter },
        { $group: { _id: '$endpoint', count: { $sum: 1 }, avgLatency: { $avg: '$latency' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      UsageLog.find(filter).sort({ timestamp: -1 }).limit(20).populate('apiKeyId', 'key label'),
    ]);

    res.json({ total, byStatus, byEndpoint, recentLogs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDailyUsage = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const data = await UsageLog.aggregate([
      { $match: { userId: req.user.id, timestamp: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
          errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
          avgLatency: { $avg: '$latency' },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const calculateBilling = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, mon] = month.split('-');
    const from = new Date(year, mon - 1, 1);
    const to = new Date(year, mon, 1);

    const totalRequests = await UsageLog.countDocuments({
      userId: req.user.id,
      timestamp: { $gte: from, $lt: to }
    });

    const plan = req.user.plan || 'free';
    const pricing = PRICING[plan];
    const billableRequests = Math.max(0, totalRequests - pricing.freeRequests);
    const amount = (billableRequests / 100) * pricing.pricePerHundred;

    const billing = await Billing.findOneAndUpdate(
      { userId: req.user.id, month },
      { totalRequests, billableRequests, amount, plan },
      { upsert: true, new: true }
    );

    res.json(billing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBillingHistory = async (req, res) => {
  try {
    const history = await Billing.find({ userId: req.user.id }).sort({ month: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUsageSummary, getDailyUsage, calculateBilling, getBillingHistory };
