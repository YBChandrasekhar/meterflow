const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAdminStats, getAllUsers, updateUserPlan, getSystemUsage } = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));
router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/plan', updateUserPlan);
router.get('/usage', getSystemUsage);

module.exports = router;
