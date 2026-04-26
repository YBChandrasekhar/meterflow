const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getUsageSummary, getDailyUsage, calculateBilling, getBillingHistory } = require('../controllers/usageController');

router.use(authenticate);

router.get('/summary', getUsageSummary);
router.get('/daily', getDailyUsage);
router.get('/billing', calculateBilling);
router.get('/billing/history', getBillingHistory);

module.exports = router;
