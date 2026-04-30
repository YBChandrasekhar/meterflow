const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { createCheckoutSession, verifyPayment, getPaymentHistory, getPlans, getPublishableKey } = require('../controllers/paymentController');

router.get('/plans', getPlans);
router.get('/config', getPublishableKey);
router.use(authenticate);
router.post('/checkout', createCheckoutSession);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);

module.exports = router;
