const User = require('../models/User');
const Api = require('../models/Api');
const UsageLog = require('../models/UsageLog');
const Billing = require('../models/Billing');
const Payment = require('../models/Payment');

const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalApis, totalRequests, totalRevenue, recentUsers] = await Promise.all([
      User.countDocuments(),
      Api.countDocuments(),
      UsageLog.countDocuments(),
      Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email plan role createdAt'),
    ]);

    res.json({
      totalUsers,
      totalApis,
      totalRequests,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentUsers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -refreshToken').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateUserPlan = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { plan: req.body.plan },
      { new: true }
    ).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSystemUsage = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const daily = await UsageLog.aggregate([
      { $match: { timestamp: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
          errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(daily);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAdminStats, getAllUsers, updateUserPlan, getSystemUsage };
