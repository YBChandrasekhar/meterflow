const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getAuditLogs } = require('../controllers/auditController');

router.use(authenticate);
router.get('/', getAuditLogs);

module.exports = router;
