const AuditLog = require('../models/AuditLog');

const audit = (action, resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode < 400 && req.user?.id) {
      AuditLog.create({
        userId: req.user.id,
        action,
        resource,
        resourceId: req.params?.id || req.params?.keyId || data?._id || null,
        details: { method: req.method, path: req.path },
        ip: req.ip,
      }).catch(console.error);
    }
    return originalJson(data);
  };
  next();
};

module.exports = audit;
