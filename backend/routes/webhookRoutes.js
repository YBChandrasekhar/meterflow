const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { createWebhook, getWebhooks, deleteWebhook, toggleWebhook } = require('../controllers/webhookController');

router.use(authenticate);
router.post('/', createWebhook);
router.get('/', getWebhooks);
router.delete('/:id', deleteWebhook);
router.patch('/:id/toggle', toggleWebhook);

module.exports = router;
