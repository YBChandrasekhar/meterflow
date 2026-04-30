const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const audit = require('../middleware/audit');
const {
  createApi, getMyApis, getApiById, updateApi, deleteApi,
  generateKey, getApiKeys, revokeKey, rotateKey
} = require('../controllers/apiController');

router.use(authenticate);

router.post('/', audit('CREATE', 'api'), createApi);
router.get('/', getMyApis);
router.get('/:id', getApiById);
router.put('/:id', audit('UPDATE', 'api'), updateApi);
router.delete('/:id', audit('DELETE', 'api'), deleteApi);

router.post('/:id/keys', audit('GENERATE_KEY', 'apikey'), generateKey);
router.get('/:id/keys', getApiKeys);
router.patch('/:id/keys/:keyId/revoke', audit('REVOKE_KEY', 'apikey'), revokeKey);
router.patch('/:id/keys/:keyId/rotate', audit('ROTATE_KEY', 'apikey'), rotateKey);

module.exports = router;
