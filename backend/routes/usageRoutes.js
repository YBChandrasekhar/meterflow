const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getUsageSummary, getDailyUsage, calculateBilling, getBillingHistory, getRateLimitStatus } = require('../controllers/usageController');

router.use(authenticate);

router.get('/summary', getUsageSummary);
router.get('/daily', getDailyUsage);
router.get('/billing', calculateBilling);
router.get('/billing/history', getBillingHistory);
router.get('/ratelimit', getRateLimitStatus);

module.exports = router;
