const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  createApi, getMyApis, getApiById, updateApi, deleteApi,
  generateKey, getApiKeys, revokeKey, rotateKey
} = require('../controllers/apiController');

router.use(authenticate);

router.post('/', createApi);
router.get('/', getMyApis);
router.get('/:id', getApiById);
router.put('/:id', updateApi);
router.delete('/:id', deleteApi);

router.post('/:id/keys', generateKey);
router.get('/:id/keys', getApiKeys);
router.patch('/:id/keys/:keyId/revoke', revokeKey);
router.patch('/:id/keys/:keyId/rotate', rotateKey);

module.exports = router;
