const router = require('express').Router();
const gateway = require('../middleware/gateway');

// All requests to /gateway/* are intercepted
router.all('/{*path}', gateway);

module.exports = router;
